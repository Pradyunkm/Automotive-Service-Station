# Multi-Camera RPi Script with LOCAL YOLO Processing
# Runs 2 models: scratch/dent for front/left/right, brake model for brake station
import cv2
import requests
import time
import threading
import base64
from ultralytics import YOLO

# ======================================================
# CONFIGURATION
# ======================================================

LAPTOP_IP = "192.168.137.221"  # Your laptop IP
BASE_URL = f"http://{LAPTOP_IP}:8000"

# Camera mapping: camera_id -> (station_name, usb_index)
# Change USB indices if your cameras are on different ports
CAMERA_MAPPING = {
    0: ("front", 0),   # Front -> USB Index 0
    1: ("left", 1),    # Left  -> USB Index 1
    2: ("right", 2),   # Right -> USB Index 2
    3: ("brake", 3)    # Brake -> USB Index 3
}

# ======================================================
# LOAD YOLO MODELS ON RPI
# ======================================================

print("=" * 60)
print("🔥 LOADING YOLO MODELS ON RPI...")
print("=" * 60)

# Model 1: Scratch/Dent detection (for front, left, right cameras)
try:
    MODEL_SCRATCH = YOLO("scratch_dent_model.pt")
    print("✅ Scratch/Dent model loaded: scratch_dent_model.pt")
except Exception as e:
    print(f"⚠️  Could not load scratch_dent_model.pt: {e}")
    print("   Trying fallback: best.pt")
    try:
        MODEL_SCRATCH = YOLO("best.pt")
        print("✅ Fallback model loaded: best.pt")
    except:
        print("❌ No scratch/dent model found! Using YOLOv8n as placeholder")
        MODEL_SCRATCH = YOLO("yolov8n.pt")

# Model 2: Brake shoe detection (for brake camera only)
try:
    MODEL_BRAKE = YOLO("brakeshoe_model.pt")
    print("✅ Brake shoe model loaded: brakeshoe_model.pt")
except Exception as e:
    print(f"⚠️  Could not load brakeshoe_model.pt: {e}")
    print("   Trying fallback: brakes.pt")
    try:
        MODEL_BRAKE = YOLO("brakes.pt")
        print("✅ Fallback model loaded: brakes.pt")
    except:
        print("❌ No brake model found! Using scratch model as fallback")
        MODEL_BRAKE = MODEL_SCRATCH

print("=" * 60)
print("✅ ALL MODELS LOADED!")
print("=" * 60 + "\n")

# ======================================================
# GLOBAL STATE
# ======================================================

camera_frames = {0: None, 1: None, 2: None, 3: None}
frame_locks = {0: threading.Lock(), 1: threading.Lock(), 2: threading.Lock(), 3: threading.Lock()}

# ======================================================
# TEST BACKEND CONNECTION
# ======================================================

def test_backend_connection():
    """Test if backend is reachable"""
    print(f"\n🔍 Testing connection to backend at {BASE_URL}...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Backend connected successfully!")
            print(f"📡 Server status: {response.json()}")
            return True
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {LAPTOP_IP}:8000")
        print(f"   Make sure:")
        print(f"   1. Backend server is running (python api.py)")
        print(f"   2. IP address is correct: {LAPTOP_IP}")
        print(f"   3. RPi and laptop are on the same network")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Connection timeout - backend not responding")
        return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

# ======================================================
# CAMERA CAPTURE THREAD
# ======================================================

def camera_thread(camera_id, usb_index, station_name):
    """Capture frames from a specific camera"""
    print(f"📹 Starting Camera {camera_id} ({station_name.upper()}) on USB {usb_index}")
    
    # Try to open camera
    cap = cv2.VideoCapture(usb_index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    if not cap.isOpened():
        print(f"❌ Failed to open Camera {camera_id} ({station_name.upper()}) on USB {usb_index}")
        print(f"   Try checking if camera is connected or try different USB index")
        return
    
    print(f"✅ Camera {camera_id} ({station_name.upper()}) ready")
    
    frame_count = 0
    
    while True:
        try:
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️  Camera {camera_id} ({station_name.upper()}): Lost feed. Reconnecting...")
                cap.release()
                time.sleep(0.5)
                cap = cv2.VideoCapture(usb_index)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                cap.set(cv2.CAP_PROP_FPS, 30)
                continue
            
            # Store frame in shared memory
            with frame_locks[camera_id]:
                camera_frames[camera_id] = frame.copy()
            
            frame_count += 1
            if frame_count % 300 == 0:
                print(f"📊 Camera {camera_id} ({station_name.upper()}): {frame_count} frames captured")
            
            time.sleep(0.03)
            
        except Exception as e:
            print(f"❌ Camera {camera_id} ({station_name.upper()}): {e}")
            time.sleep(1)
    
    cap.release()

# ======================================================
# YOLO PROCESSING AND SENDING
# ======================================================

def process_and_send():
    """Run YOLO on frames and send annotated images to backend"""
    print("🚀 Starting YOLO processing and frame sender...")
    
    send_count = {0: 0, 1: 0, 2: 0, 3: 0}
    error_count = {0: 0, 1: 0, 2: 0, 3: 0}
    detection_count = {0: {"scratches": 0, "dents": 0, "cracks": 0}, 
                       1: {"scratches": 0, "dents": 0, "cracks": 0},
                       2: {"scratches": 0, "dents": 0, "cracks": 0},
                       3: {"scratches": 0, "dents": 0, "cracks": 0}}
    last_status_time = time.time()
    
    while True:
        try:
            for camera_id in [0, 1, 2, 3]:
                station_name = CAMERA_MAPPING[camera_id][0]
                
                # Get frame
                with frame_locks[camera_id]:
                    frame = camera_frames[camera_id]
                
                if frame is None:
                    continue
                
                # SELECT MODEL based on camera
                if camera_id == 3:  # Brake camera
                    model = MODEL_BRAKE
                else:  # Front, Left, Right cameras
                    model = MODEL_SCRATCH
                
                # RUN YOLO INFERENCE ON RPI
                try:
                    results = model(frame, conf=0.25, verbose=False)
                    annotated_frame = results[0].plot()
                    
                    # Count detections
                    scratch_count = 0
                    dent_count = 0
                    crack_count = 0
                    
                    for result in results:
                        for box in result.boxes:
                            cls = int(box.cls.item())
                            label = model.names.get(cls, "").lower()
                            
                            if "good" in label:
                                continue
                            elif "scratch" in label:
                                scratch_count += 1
                            elif "dent" in label:
                                dent_count += 1
                            else:
                                crack_count += 1
                    
                    detection_count[camera_id] = {
                        "scratches": scratch_count,
                        "dents": dent_count,
                        "cracks": crack_count
                    }
                    
                except Exception as e:
                    print(f"⚠️  YOLO error on {station_name}: {e}")
                    annotated_frame = frame
                
                # Encode annotated frame as JPEG
                _, img_encoded = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                
                # SEND TO STATION ENDPOINT (for multi-camera display)
                try:
                    files = {'file': ('image.jpg', img_encoded.tobytes(), 'image/jpeg')}
                    response = requests.post(
                        f"{BASE_URL}/api/update/{station_name}",
                        files=files,
                        timeout=2
                    )
                    
                    if response.status_code == 200:
                        send_count[camera_id] += 1
                    else:
                        error_count[camera_id] += 1
                        
                except requests.exceptions.Timeout:
                    error_count[camera_id] += 1
                except requests.exceptions.ConnectionError:
                    error_count[camera_id] += 1
                except Exception as e:
                    error_count[camera_id] += 1
                    if error_count[camera_id] % 50 == 1:
                        print(f"⚠️  {station_name.upper()}: Send error - {e}")
            
            # Print status every 30 seconds
            current_time = time.time()
            if current_time - last_status_time >= 30:
                print("\n" + "=" * 70)
                print("📊 SYSTEM STATUS - YOLO RUNNING ON RPI")
                print("=" * 70)
                for cam_id in [0, 1, 2, 3]:
                    station = CAMERA_MAPPING[cam_id][0].upper()
                    model_name = "BRAKE" if cam_id == 3 else "SCRATCH"
                    total = send_count[cam_id] + error_count[cam_id]
                    success_rate = (send_count[cam_id] / total * 100) if total > 0 else 0
                    detections = detection_count[cam_id]
                    print(f"{station:6} [{model_name:7}] | Sent: {send_count[cam_id]:4} | "
                          f"Errors: {error_count[cam_id]:4} | Success: {success_rate:5.1f}% | "
                          f"Detections: S={detections['scratches']} D={detections['dents']} C={detections['cracks']}")
                print("=" * 70 + "\n")
                last_status_time = current_time
            
            # Control processing rate
            time.sleep(0.1)
            
        except Exception as e:
            print(f"❌ Processing loop error: {e}")
            time.sleep(1)

# ======================================================
# MAIN PROGRAM
# ======================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🎥 MULTI-CAMERA YOLO SYSTEM (PROCESSING ON RPI)")
    print("=" * 60)
    print(f"📡 Backend: {BASE_URL}")
    print(f"📹 Cameras: {len(CAMERA_MAPPING)}")
    print(f"🔥 Models: Scratch/Dent (Cam 0-2), Brake (Cam 3)")
    print("=" * 60 + "\n")
    
    # Test backend connection
    if not test_backend_connection():
        print("\n⚠️  WARNING: Backend not reachable!")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("🛑 Exiting...")
            exit(1)
    
    print("\n🚀 Starting camera threads...")
    
    # Start camera capture threads
    for cam_id, (station, usb_idx) in CAMERA_MAPPING.items():
        t = threading.Thread(
            target=camera_thread,
            args=(cam_id, usb_idx, station),
            daemon=True
        )
        t.start()
        time.sleep(0.5)
    
    # Wait for cameras
    print("\n⏳ Waiting for cameras to initialize...")
    time.sleep(3)
    
    # Check cameras
    ready_count = sum(1 for frame in camera_frames.values() if frame is not None)
    print(f"\n✅ {ready_count}/4 cameras ready!")
    
    if ready_count == 0:
        print("\n❌ No cameras detected!")
        print("Please check:")
        print("  1. USB cameras are connected")
        print("  2. USB indices in CAMERA_MAPPING are correct")
        print("  3. Camera permissions: sudo usermod -a -G video $USER")
        print("\n💡 TIP: Run 'ls /dev/video*' to see available cameras")
        exit(1)
    
    # Start YOLO processing
    print("🔥 Starting YOLO inference on RPi...\n")
    
    try:
        process_and_send()
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        print("✅ System stopped successfully")
