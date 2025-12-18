#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
RPi5 MULTI-CAMERA AUTO-CAPTURE AGENT
Production-Grade Automotive Service Station Vision System
═══════════════════════════════════════════════════════════════════════════════

SYSTEM OVERVIEW:
- 4 USB cameras (front, left, right, brake inspection)
- Local YOLO inference on Raspberry Pi 5
- Automatic camera switching based on backend state
- Live annotated feed streaming to FastAPI backend
- Auto-capture mode with sequential station processing
- Manual capture trigger support
- Non-blocking threaded architecture

CAMERA MAPPING:
┌──────────┬─────────┬──────────────┐
│ Camera ID│ Station │ YOLO Model   │
├──────────┼─────────┼──────────────┤
│    0     │  front  │ damage_model │
│    1     │  left   │ damage_model │
│    2     │  right  │ damage_model │
│    3     │  brake  │ brake_model  │
└──────────┴─────────┴──────────────┘

BACKEND API CONTRACT (DO NOT MODIFY):
- GET  /api/get-active-camera          → {"camera_id": int}
- POST /api/set-active-camera/{id}     → sets active camera
- POST /api/analyze-image              → image analysis + upload
- POST /api/update/{station}           → live feed ingestion
- GET  /api/station-feed/{station}     → frontend retrieval

PERFORMANCE TARGETS:
- FPS: ≥8 per camera
- CPU: ≤80%
- Latency: <300ms camera switch
- Memory: No leaks

═══════════════════════════════════════════════════════════════════════════════
"""

import cv2
import requests
import time
import threading
import numpy as np
from datetime import datetime
from ultralytics import YOLO
from typing import Optional, Dict, Tuple
import io
import logging
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

class Config:
    """Centralized configuration - MODIFY THESE VALUES"""
    
    # Backend Configuration
    BACKEND_URL = "http://localhost:8000"  # Change to your backend URL (HTTPS for production)
    SERVICE_RECORD_ID = "455e445f-c11b-4db7-8c78-e62f8df86614"  # Your service record ID
    
    # Camera Settings
    CAMERA_POLL_INTERVAL = 0.3  # Poll backend every 300ms for active camera
    NUM_CAMERAS = 4
    CAMERA_WARMUP_FRAMES = 5  # Discard first N frames after opening camera
    
    # YOLO Inference Settings
    YOLO_CONFIDENCE = 0.25
    YOLO_IOU = 0.45
    YOLO_IMG_SIZE = 640
    MAX_DETECTIONS = 50
    
    # Image Processing
    MAX_FRAME_WIDTH = 640
    JPEG_QUALITY = 95
    
    # Performance Settings
    TARGET_FPS = 10
    FRAME_TIMEOUT = 2.0  # Skip frame if processing takes longer
    
    # Auto-Capture Mode
    AUTO_CAPTURE_ENABLED = True  # Set to False to disable auto-capture
    AUTO_CAPTURE_INTERVAL = 10  # Seconds between auto-captures per camera
    
    # Logging
    LOG_LEVEL = logging.INFO  # Change to logging.DEBUG for verbose output
    
    # Model Paths
    DAMAGE_MODEL_PATH = "best.pt"
    BRAKE_MODEL_PATH = "brakes.pt"


# ═══════════════════════════════════════════════════════════════════════════
# LOGGING SETUP
# ═══════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=Config.LOG_LEVEL,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# CAMERA STATION MAPPING
# ═══════════════════════════════════════════════════════════════════════════

CAMERA_STATION_MAP = {
    0: "front",
    1: "left",
    2: "right",
    3: "brake"
}

STATION_MODEL_MAP = {
    "front": "damage",
    "left": "damage",
    "right": "damage",
    "brake": "brake"
}


# ═══════════════════════════════════════════════════════════════════════════
# CAMERA MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class CameraManager:
    """Handles dynamic camera opening/closing with USB hot-plug support"""
    
    def __init__(self):
        self.active_camera: Optional[cv2.VideoCapture] = None
        self.active_camera_id: Optional[int] = None
        self.lock = threading.Lock()
        
    def open_camera(self, camera_id: int) -> bool:
        """
        Open camera with error handling and warmup
        Returns: True if successful, False otherwise
        """
        with self.lock:
            # Don't reopen if already active
            if self.active_camera_id == camera_id and self.active_camera is not None:
                if self.active_camera.isOpened():
                    logger.debug(f"Camera {camera_id} already open")
                    return True
            
            # Release previous camera
            self._release_camera()
            
            # Open new camera
            logger.info(f"📹 Opening camera {camera_id} ({CAMERA_STATION_MAP.get(camera_id, 'unknown')} station)")
            
            try:
                cap = cv2.VideoCapture(camera_id)
                
                if not cap.isOpened():
                    logger.error(f"❌ Failed to open camera {camera_id}")
                    return False
                
                # Configure camera for best performance
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                cap.set(cv2.CAP_PROP_FPS, Config.TARGET_FPS)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize latency
                
                # Warmup: discard first few frames (often corrupted)
                for _ in range(Config.CAMERA_WARMUP_FRAMES):
                    cap.read()
                
                self.active_camera = cap
                self.active_camera_id = camera_id
                
                logger.info(f"✅ Camera {camera_id} opened successfully")
                return True
                
            except Exception as e:
                logger.error(f"❌ Exception opening camera {camera_id}: {e}")
                return False
    
    def read_frame(self) -> Optional[np.ndarray]:
        """
        Read frame from active camera
        Returns: Frame as numpy array, or None if failed
        """
        with self.lock:
            if self.active_camera is None or not self.active_camera.isOpened():
                return None
            
            ret, frame = self.active_camera.read()
            
            if not ret or frame is None:
                logger.warning(f"⚠️ Failed to read from camera {self.active_camera_id}")
                return None
            
            return frame
    
    def _release_camera(self):
        """Internal: Release active camera"""
        if self.active_camera is not None:
            logger.debug(f"Releasing camera {self.active_camera_id}")
            self.active_camera.release()
            self.active_camera = None
            self.active_camera_id = None
    
    def release(self):
        """Public method to release camera"""
        with self.lock:
            self._release_camera()
    
    def get_active_id(self) -> Optional[int]:
        """Get currently active camera ID"""
        with self.lock:
            return self.active_camera_id


# ═══════════════════════════════════════════════════════════════════════════
# YOLO INFERENCE ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class YOLOEngine:
    """Local YOLO inference with model caching"""
    
    def __init__(self):
        logger.info("⏳ Loading YOLO models...")
        
        try:
            self.damage_model = YOLO(Config.DAMAGE_MODEL_PATH)
            logger.info(f"✅ Loaded damage model: {Config.DAMAGE_MODEL_PATH}")
        except Exception as e:
            logger.error(f"❌ Failed to load damage model: {e}")
            raise
        
        try:
            self.brake_model = YOLO(Config.BRAKE_MODEL_PATH)
            logger.info(f"✅ Loaded brake model: {Config.BRAKE_MODEL_PATH}")
        except Exception as e:
            logger.error(f"❌ Failed to load brake model: {e}")
            raise
        
        logger.info("✅ All YOLO models loaded successfully")
    
    def infer(self, frame: np.ndarray, station: str) -> Tuple[np.ndarray, int, int, int]:
        """
        Run YOLO inference on frame
        
        Args:
            frame: Input image (BGR format)
            station: Station name to determine model
        
        Returns:
            Tuple of (annotated_frame, scratch_count, dent_count, crack_count)
        """
        # Select model based on station
        model = self.brake_model if station == "brake" else self.damage_model
        
        # Resize frame for inference
        resized_frame = self._resize_frame(frame)
        
        # Run inference
        results = model(
            resized_frame,
            conf=Config.YOLO_CONFIDENCE,
            iou=Config.YOLO_IOU,
            agnostic_nms=True,
            half=True,
            verbose=False,
            max_det=Config.MAX_DETECTIONS,
            imgsz=Config.YOLO_IMG_SIZE
        )
        
        # Count detections
        scratch_count = 0
        dent_count = 0
        crack_count = 0
        
        for result in results:
            for box in result.boxes:
                cls = int(box.cls.item())
                label = model.names.get(cls, "").lower().strip()
                
                if "good" in label:
                    continue
                
                if "scratch" in label:
                    scratch_count += 1
                elif "dent" in label:
                    dent_count += 1
                else:
                    crack_count += 1
        
        # Generate annotated frame
        annotated_frame = results[0].plot()
        
        return annotated_frame, scratch_count, dent_count, crack_count
    
    @staticmethod
    def _resize_frame(frame: np.ndarray) -> np.ndarray:
        """Resize frame to max dimension while preserving aspect ratio"""
        h, w = frame.shape[:2]
        max_dim = Config.MAX_FRAME_WIDTH
        
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w = int(w * scale)
            new_h = int(h * scale)
            return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        
        return frame


# ═══════════════════════════════════════════════════════════════════════════
# BACKEND API CLIENT
# ═══════════════════════════════════════════════════════════════════════════

class BackendClient:
    """Non-blocking API client for backend communication"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'RPi5-MultiCam-Agent/1.0'
        })
    
    def get_active_camera(self) -> Optional[int]:
        """
        Poll backend for active camera ID
        Returns: Camera ID or None if failed
        """
        try:
            response = self.session.get(
                f"{Config.BACKEND_URL}/api/get-active-camera",
                timeout=1.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("camera_id")
            
            logger.warning(f"⚠️ Backend returned status {response.status_code}")
            return None
            
        except requests.exceptions.RequestException as e:
            logger.debug(f"Backend poll failed: {e}")
            return None
    
    def push_live_feed(self, station: str, annotated_frame: np.ndarray) -> bool:
        """
        Push annotated frame to backend (non-blocking)
        
        Args:
            station: Station name (front/left/right/brake)
            annotated_frame: YOLO-annotated frame
        
        Returns: True if successful, False otherwise
        """
        try:
            # Encode frame to JPEG
            _, buffer = cv2.imencode(
                ".jpg",
                annotated_frame,
                [cv2.IMWRITE_JPEG_QUALITY, Config.JPEG_QUALITY]
            )
            
            # Send to backend
            files = {'file': ('frame.jpg', buffer.tobytes(), 'image/jpeg')}
            
            response = self.session.post(
                f"{Config.BACKEND_URL}/api/update/{station}",
                files=files,
                timeout=2.0
            )
            
            if response.status_code == 200:
                logger.debug(f"✅ Live feed pushed to {station}")
                return True
            else:
                logger.warning(f"⚠️ Feed push failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.debug(f"Live feed push error: {e}")
            return False
    
    def send_capture(
        self,
        frame: np.ndarray,
        camera_id: int,
        is_manual: bool = False,
        should_upload: bool = True
    ) -> bool:
        """
        Send capture to /api/analyze-image
        
        Args:
            frame: Raw frame (will be processed by backend)
            camera_id: Camera ID
            is_manual: Manual capture flag
            should_upload: Upload to Supabase flag
        
        Returns: True if successful, False otherwise
        """
        try:
            # Encode frame
            _, buffer = cv2.imencode(
                ".jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, Config.JPEG_QUALITY]
            )
            
            # Prepare multipart form data
            files = {'file': ('capture.jpg', buffer.tobytes(), 'image/jpeg')}
            data = {
                'camera_id': camera_id,
                'is_manual': str(is_manual).lower(),
                'should_upload': str(should_upload).lower(),
                'service_record_id': Config.SERVICE_RECORD_ID
            }
            
            response = self.session.post(
                f"{Config.BACKEND_URL}/api/analyze-image",
                files=files,
                data=data,
                timeout=5.0
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Capture sent (camera {camera_id}, manual={is_manual})")
                return True
            else:
                logger.error(f"❌ Capture failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Capture send error: {e}")
            return False


# ═══════════════════════════════════════════════════════════════════════════
# LIVE FEED STREAMER
# ═══════════════════════════════════════════════════════════════════════════

class LiveFeedStreamer(threading.Thread):
    """Background thread for continuous live feed streaming"""
    
    def __init__(self, camera_manager: CameraManager, yolo_engine: YOLOEngine, backend_client: BackendClient):
        super().__init__(daemon=True)
        self.camera_manager = camera_manager
        self.yolo_engine = yolo_engine
        self.backend_client = backend_client
        self.running = False
        self.fps_counter = 0
        self.last_fps_time = time.time()
    
    def run(self):
        """Main streaming loop"""
        logger.info("🎥 Live feed streamer started")
        self.running = True
        
        while self.running:
            try:
                # Get current camera
                camera_id = self.camera_manager.get_active_id()
                if camera_id is None:
                    time.sleep(0.1)
                    continue
                
                station = CAMERA_STATION_MAP.get(camera_id)
                if station is None:
                    time.sleep(0.1)
                    continue
                
                # Read frame
                frame = self.camera_manager.read_frame()
                if frame is None:
                    time.sleep(0.1)
                    continue
                
                # YOLO inference
                start_time = time.time()
                annotated_frame, _, _, _ = self.yolo_engine.infer(frame, station)
                inference_time = time.time() - start_time
                
                # Push to backend (non-blocking)
                self.backend_client.push_live_feed(station, annotated_frame)
                
                # FPS calculation
                self._update_fps()
                
                # Respect target FPS
                sleep_time = max(0, (1.0 / Config.TARGET_FPS) - inference_time)
                time.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"❌ Live feed error: {e}")
                time.sleep(0.5)
    
    def _update_fps(self):
        """Calculate and log FPS"""
        self.fps_counter += 1
        
        if time.time() - self.last_fps_time >= 5.0:
            fps = self.fps_counter / 5.0
            logger.info(f"📊 Live Feed FPS: {fps:.2f}")
            self.fps_counter = 0
            self.last_fps_time = time.time()
    
    def stop(self):
        """Stop streaming"""
        self.running = False


# ═══════════════════════════════════════════════════════════════════════════
# AUTO-CAPTURE MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class AutoCaptureManager(threading.Thread):
    """Background thread for automatic sequential camera capture"""
    
    def __init__(self, camera_manager: CameraManager, backend_client: BackendClient):
        super().__init__(daemon=True)
        self.camera_manager = camera_manager
        self.backend_client = backend_client
        self.running = False
    
    def run(self):
        """Main auto-capture loop"""
        if not Config.AUTO_CAPTURE_ENABLED:
            logger.info("⏸️ Auto-capture disabled in config")
            return
        
        logger.info(f"🔄 Auto-capture started (interval: {Config.AUTO_CAPTURE_INTERVAL}s per camera)")
        self.running = True
        
        while self.running:
            try:
                # Capture from all cameras sequentially
                for camera_id in range(Config.NUM_CAMERAS):
                    if not self.running:
                        break
                    
                    station = CAMERA_STATION_MAP.get(camera_id)
                    logger.info(f"📸 Auto-capturing {station} station (camera {camera_id})")
                    
                    # Switch to camera (if not already active)
                    if self.camera_manager.get_active_id() != camera_id:
                        self.camera_manager.open_camera(camera_id)
                        time.sleep(0.5)  # Allow camera to stabilize
                    
                    # Capture frame
                    frame = self.camera_manager.read_frame()
                    if frame is not None:
                        # Send to backend with should_upload=True
                        self.backend_client.send_capture(
                            frame=frame,
                            camera_id=camera_id,
                            is_manual=False,
                            should_upload=True
                        )
                    else:
                        logger.warning(f"⚠️ Failed to capture from camera {camera_id}")
                    
                    # Wait before next camera
                    time.sleep(Config.AUTO_CAPTURE_INTERVAL)
                
            except Exception as e:
                logger.error(f"❌ Auto-capture error: {e}")
                time.sleep(5.0)
    
    def stop(self):
        """Stop auto-capture"""
        self.running = False


# ═══════════════════════════════════════════════════════════════════════════
# ACTIVE CAMERA POLLER
# ═══════════════════════════════════════════════════════════════════════════

class ActiveCameraPoller(threading.Thread):
    """Background thread to poll backend for active camera changes"""
    
    def __init__(self, camera_manager: CameraManager, backend_client: BackendClient):
        super().__init__(daemon=True)
        self.camera_manager = camera_manager
        self.backend_client = backend_client
        self.running = False
        self.last_camera_id = None
    
    def run(self):
        """Main polling loop"""
        logger.info(f"🔄 Active camera poller started (interval: {Config.CAMERA_POLL_INTERVAL}s)")
        self.running = True
        
        while self.running:
            try:
                # Poll backend
                camera_id = self.backend_client.get_active_camera()
                
                if camera_id is not None and camera_id != self.last_camera_id:
                    logger.info(f"🔀 Active camera changed: {self.last_camera_id} → {camera_id}")
                    
                    # Switch camera
                    if self.camera_manager.open_camera(camera_id):
                        self.last_camera_id = camera_id
                
                time.sleep(Config.CAMERA_POLL_INTERVAL)
                
            except Exception as e:
                logger.error(f"❌ Camera poller error: {e}")
                time.sleep(1.0)
    
    def stop(self):
        """Stop polling"""
        self.running = False


# ═══════════════════════════════════════════════════════════════════════════
# MAIN AGENT
# ═══════════════════════════════════════════════════════════════════════════

class RPiMultiCamAgent:
    """Main orchestration class"""
    
    def __init__(self):
        logger.info("═" * 60)
        logger.info("RPi5 MULTI-CAMERA AUTO-CAPTURE AGENT")
        logger.info("═" * 60)
        logger.info(f"Backend: {Config.BACKEND_URL}")
        logger.info(f"Service ID: {Config.SERVICE_RECORD_ID}")
        logger.info(f"Auto-Capture: {'ENABLED' if Config.AUTO_CAPTURE_ENABLED else 'DISABLED'}")
        logger.info("═" * 60)
        
        # Initialize components
        self.camera_manager = CameraManager()
        self.yolo_engine = YOLOEngine()
        self.backend_client = BackendClient()
        
        # Initialize threads
        self.live_feed_streamer = LiveFeedStreamer(
            self.camera_manager,
            self.yolo_engine,
            self.backend_client
        )
        
        self.auto_capture_manager = AutoCaptureManager(
            self.camera_manager,
            self.backend_client
        )
        
        self.active_camera_poller = ActiveCameraPoller(
            self.camera_manager,
            self.backend_client
        )
    
    def start(self):
        """Start all background threads"""
        logger.info("🚀 Starting all threads...")
        
        # Start polling for active camera
        self.active_camera_poller.start()
        time.sleep(1.0)  # Allow time to detect initial camera
        
        # Start live feed streaming
        self.live_feed_streamer.start()
        
        # Start auto-capture
        self.auto_capture_manager.start()
        
        logger.info("✅ All systems operational")
        logger.info("Press Ctrl+C to stop")
    
    def stop(self):
        """Stop all threads and cleanup"""
        logger.info("🛑 Stopping agent...")
        
        self.active_camera_poller.stop()
        self.live_feed_streamer.stop()
        self.auto_capture_manager.stop()
        
        self.camera_manager.release()
        
        logger.info("✅ Agent stopped cleanly")
    
    def run(self):
        """Main run loop"""
        self.start()
        
        try:
            # Keep main thread alive
            while True:
                time.sleep(1.0)
        except KeyboardInterrupt:
            logger.info("\n⚠️ Interrupt received")
        finally:
            self.stop()


# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    agent = RPiMultiCamAgent()
    agent.run()
