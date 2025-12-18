from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import io
from PIL import Image
import base64
from datetime import datetime
import uuid
from supabase_client import update_sensor_data, create_vehicle, create_service_record, upload_image, upload_sensor_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yolo-vehicle-inspection-2024.vercel.app",  # Production frontend
        "http://localhost:5173",  # Local development
        "http://127.0.0.1:5173",  # Local development alternative
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CAMERA MEMORY
active_camera_config = {"camera_id": 0}

# RPI CAMERA CONFIGURATION - List based
rpi_cameras_list = []

@app.get("/api/get-active-camera")
def get_active_camera():
    return active_camera_config

@app.post("/api/set-active-camera/{camera_id}")
def set_active_camera(camera_id: int):
    global active_camera_config
    active_camera_config["camera_id"] = camera_id
    return {"status": "success"}

# RPI CAMERA ENDPOINTS
@app.get("/api/rpi-cameras")
def get_rpi_cameras():
    """Get all configured RPI cameras"""
    return {"cameras": rpi_cameras_list}

@app.post("/api/rpi-cameras/configure")
async def configure_rpi_cameras(request: Request):
    """Configure RPI camera list"""
    global rpi_cameras_list
    try:
        body = await request.json()
        cameras = body.get("cameras", [])
        rpi_cameras_list = cameras
        print(f"✅ RPI Cameras configured: {rpi_cameras_list}")
        return {"status": "success", "cameras": rpi_cameras_list}
    except Exception as e:
        print(f"❌ Error configuring RPI cameras: {e}")
        return {"status": "error", "message": str(e)}

# LOAD MODELS
print("⏳ Loading Models...")
try:
    damage_model = YOLO("best.pt") 
    brake_model = YOLO("brakes.pt") 
    print("✅ Models Loaded")
    
    # PRE-WARM MODELS: Eliminate first-request cold start
    print("🔥 Pre-warming models...")
    dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
    damage_model(dummy_img, verbose=False)
    brake_model(dummy_img, verbose=False)
    print("✅ Models pre-warmed and ready!")
except:
    damage_model = YOLO("yolov8n.pt")
    brake_model = damage_model

latest_detection_store = {}

# Store per-station detection data for multi-camera RPI feeds
station_detection_store = {
    "front": {},
    "left": {},
    "right": {},
    "brake": {}
}

# Store current service record ID
current_service_record_id = None

@app.post("/api/analyze-image")
async def analyze_image(
    file: UploadFile = File(...), 
    camera_id: int = Form(0),
    is_manual: bool = Form(False),
    service_record_id: str = Form(None),
    should_upload: bool = Form(False)
):
    global latest_detection_store
    
    print(f"🔍 analyze-image called: camera_id={camera_id}, is_manual={is_manual}, should_upload={should_upload}, service_record_id={service_record_id}")
    
    try:
        image_bytes = await file.read()
        pil_img = Image.open(io.BytesIO(image_bytes))
        
        if pil_img.mode == 'RGBA':
            pil_img = pil_img.convert('RGB')
        
        # OPTIMIZED: Resize to 640px max for faster processing
        max_size = 640
        if max(pil_img.size) > max_size:
            ratio = max_size / max(pil_img.size)
            new_size = tuple(int(dim * ratio) for dim in pil_img.size)
            pil_img = pil_img.resize(new_size, Image.LANCZOS)
            
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        
        # INSTANT PREVIEW: Return image immediately before YOLO runs
        _, preview_buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        preview_b64 = base64.b64encode(preview_buffer).decode("utf-8")
        clean_b64 = preview_b64  # Use same preview for clean image
        
        # Prepare instant response
        response = {
            "annotatedImage": preview_b64,  # Preview shown immediately
            "cleanImage": clean_b64,
            "imageUrl": None,
            "annotatedImageUrl": None,
            "scratchCount": 0,  # Will be updated in background
            "dentCount": 0,
            "crackCount": 0,
            "timestamp": datetime.now().timestamp(),
            "status": "processing"  # Indicates background processing
        }
        
        # BACKGROUND YOLO PROCESSING: Don't block response
        import threading
        def process_yolo_background():
            try:
                print("🚀 Starting background YOLO inference...")
                
                # Run YOLO inference
                if camera_id == 3:
                    results = brake_model(img, conf=0.25, iou=0.45, agnostic_nms=True, half=True, verbose=False, max_det=50, imgsz=640)
                    names = brake_model.names
                else:
                    results = damage_model(img, conf=0.25, iou=0.45, agnostic_nms=True, half=True, verbose=False, max_det=50, imgsz=640)
                    names = damage_model.names
                
                # Count detections
                scratch_count = 0
                dent_count = 0
                crack_count = 0
                
                for result in results:
                    for box in result.boxes:
                        cls = int(box.cls.item())
                        label = names.get(cls, "").lower().strip()
                        
                        if "good" in label:
                            continue
                        if "scratch" in label:
                            scratch_count += 1
                        elif "dent" in label:
                            dent_count += 1
                        elif any(x in label for x in ["mark", "crack", "rust", "wear", "brake"]):
                            crack_count += 1
                        else:
                            crack_count += 1
                
                print(f"📈 YOLO Results: Scratches={scratch_count}, Dents={dent_count}, Marks={crack_count}")
                
                # Generate high-quality annotated image
                annotated = results[0].plot()
                _, annotated_buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 95])
                annotated_b64 = base64.b64encode(annotated_buffer).decode("utf-8")
                
                _, clean_buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
                
                # Update latest detection store
                final_response = {
                    "annotatedImage": annotated_b64,
                    "cleanImage": clean_b64,
                    "imageUrl": None,
                    "annotatedImageUrl": None,
                    "scratchCount": scratch_count,
                    "dentCount": dent_count,
                    "crackCount": crack_count,
                    "timestamp": datetime.now().timestamp(),
                    "status": "complete"
                }
                
                if str(is_manual).lower() != "true":
                    global latest_detection_store
                    latest_detection_store = final_response
                
                # SAVE TO DATABASE: Only when should_upload=True
                if should_upload:
                    print(f"💾 Uploading to Supabase in background...")
                    try:
                        clean_filename = f"clean_{uuid.uuid4()}.jpg"
                        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
                        
                        img_url = upload_image(clean_buffer.tobytes(), clean_filename)
                        print(f"✅ Clean Image uploaded: {clean_filename}")
                        
                        ann_img_url = upload_image(annotated_buffer.tobytes(), annotated_filename)
                        print(f"✅ Annotated Image uploaded: {annotated_filename}")
                        
                        if service_record_id:
                            update_sensor_data(
                                service_record_id=service_record_id,
                                scratches_count=scratch_count,
                                dents_count=dent_count,
                                crack_count=crack_count
                            )
                            
                            sensor_data_dict = {
                                "service_record_id": service_record_id,
                                "timestamp": datetime.now().isoformat(),
                                "camera_id": camera_id,
                                "detection_results": {
                                    "scratches_count": scratch_count,
                                    "dents_count": dent_count,
                                    "crack_count": crack_count
                                },
                                "image_url": img_url,
                                "annotated_image_url": ann_img_url
                            }
                            sensor_filename = f"sensor_data_{service_record_id}_{uuid.uuid4()}.json"
                            upload_sensor_data(sensor_data_dict, sensor_filename)
                            print(f"✅ Sensor data exported: {sensor_filename}")
                    except Exception as e:
                        print(f"❌ Error uploading to Supabase: {e}")
            except Exception as e:
                print(f"❌ Background YOLO error: {e}")
        
        # Start background thread - don't wait!
        yolo_thread = threading.Thread(target=process_yolo_background, daemon=True)
        yolo_thread.start()
        print("⚡ Instant preview returned - YOLO processing in background!")
        
        return response
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False}

@app.get("/api/latest-detection")
def get_latest():
    return latest_detection_store

@app.get("/api/health")
def health():
    return {"status": "online"}

@app.post("/api/start-service")
async def start_service(
    car_number_plate: str = Form(...),
    car_owner_name: str = Form(...),
    car_id: str = Form(...)
):
    """Start a new service session"""
    global current_service_record_id
    
    try:
        vehicle = create_vehicle(car_number_plate, car_owner_name, car_id)
        if not vehicle:
            return {"success": False, "error": "Failed to create vehicle"}
        
        service_record_id = create_service_record(vehicle["id"])
        if not service_record_id:
            return {"success": False, "error": "Failed to create service record"}
        
        current_service_record_id = service_record_id
        
        return {
            "success": True,
            "service_record_id": service_record_id,
            "vehicle_id": vehicle["id"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/update-sensors")
async def update_sensors(
    service_record_id: str = Form(...),
    battery_level: float = Form(None),
    battery_percent: float = Form(None),
    drivable_range_km: float = Form(None),
    vibration_level: str = Form(None),
    rpm: int = Form(None),
    voltage: float = Form(None)
):
    """Update sensor data in real-time"""
    try:
        success = update_sensor_data(
            service_record_id=service_record_id,
            battery_level=battery_level,
            battery_percent=battery_percent,
            drivable_range_km=drivable_range_km,
            vibration_level=vibration_level,
            rpm=rpm,
            voltage=voltage
        )
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/save-sensor-data")
async def save_sensor_data(
    service_record_id: str = Form(...),
    battery_level: float = Form(None),
    drivable_range_km: float = Form(None),
    vibration_level: str = Form(None),
    brake_wear_rate: float = Form(None),
    brake_lifetime_days: int = Form(None),
    rpm: int = Form(None),
    voltage: float = Form(None)
):
    """Manually save sensor data to database (called from ECU Diagnostics page)"""
    print(f"💾 MANUAL SENSOR SAVE: service_record_id={service_record_id}")
    try:
        success = update_sensor_data(
            service_record_id=service_record_id,
            battery_level=battery_level,
            drivable_range_km=drivable_range_km,
            vibration_level=vibration_level,
            brake_wear_rate=brake_wear_rate,
            brake_lifetime_days=brake_lifetime_days,
            rpm=rpm,
            voltage=voltage
        )
        if success:
            print(f"✅ Sensor data saved successfully for record {service_record_id}")
        else:
            print(f"❌ Failed to save sensor data")
        return {"success": success}
    except Exception as e:
        print(f"❌ Error saving sensor data: {e}")
        return {"success": False, "error": str(e)}


# MULTI-CAMERA RPI FEED ENDPOINTS
@app.post("/api/update/{station}")
async def update_station_feed(station: str, file: UploadFile = File(...)):
    """Receive annotated images from RPI multi-camera script"""
    global station_detection_store
    
    valid_stations = ["front", "left", "right", "brake"]
    if station not in valid_stations:
        return {"success": False, "error": f"Invalid station. Must be one of: {valid_stations}"}
    
    try:
        # Read the uploaded image (already annotated by RPI YOLO)
        image_bytes = await file.read()
        
        # Convert to base64 for storage and transmission
        annotated_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        # Store the latest feed for this station
        station_detection_store[station] = {
            "annotatedImage": annotated_b64,
            "timestamp": datetime.now().timestamp(),
            "station": station
        }
        
        print(f"✅ Received feed from {station.upper()} station")
        return {"success": True, "station": station}
        
    except Exception as e:
        print(f"❌ Error receiving {station} feed: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/station-feed/{station}")
def get_station_feed(station: str):
    """Retrieve latest feed for a specific station"""
    valid_stations = ["front", "left", "right", "brake"]
    if station not in valid_stations:
        return {"error": f"Invalid station. Must be one of: {valid_stations}"}
    
    return station_detection_store.get(station, {})

if __name__ == "__main__":
    import uvicorn
    import threading
    import serial
    import time
    import json
    import re

    SERIAL_PORT = "COM5" 
    BAUD_RATE = 115200
    
    DEFAULT_SERVICE_ID = "455e445f-c11b-4db7-8c78-e62f8df86614"
    if current_service_record_id is None:
        current_service_record_id = DEFAULT_SERVICE_ID

    def parse_serial_line(line: str) -> dict:
        data = {}
        line = line.strip()
        
        try:
            json_data = json.loads(line)
            mapped_data = {}
            
            if "rpm" in json_data:
                mapped_data["rpm"] = int(json_data["rpm"])
            
            if "battery" in json_data:
                mapped_data["battery_level"] = float(json_data["battery"])
                mapped_data["battery_percent"] = float(json_data["battery"])
            
            if "voltage" in json_data:
                mapped_data["voltage"] = float(json_data["voltage"])
            
            if "vibration" in json_data:
                mapped_data["vibration_level"] = str(json_data["vibration"])
            
            if "range" in json_data:
                mapped_data["drivable_range_km"] = float(json_data["range"])
            
            return mapped_data
        except:
            pass
            
        pairs = re.findall(r'(\w+)[:=]\s*([\w\.]+)', line)
        for key, val in pairs:
            key = key.lower()
            try:
                if '.' in val:
                    val = float(val)
                else:
                    val = int(val)
            except:
                pass
            
            if "rpm" in key: data["rpm"] = val
            if "batt" in key: 
                data["battery_level"] = val
                data["battery_percent"] = val
            if "volt" in key: data["voltage"] = val
            if "vib" in key: data["vibration_level"] = str(val)
            if "range" in key: data["drivable_range_km"] = val
            if "wear" in key: data["brake_wear_rate"] = val
            
        return data

    def serial_worker():
        global current_service_record_id
        print(f"🔌 Attempting to connect to Arduino on {SERIAL_PORT}...")
        
        while True:
            try:
                with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
                    print(f"✅ Serial Connected on {SERIAL_PORT}")
                    
                    while True:
                        if ser.in_waiting:
                            try:
                                line = ser.readline().decode('utf-8', errors='ignore').strip()
                                if not line: continue
                                
                                print(f"📥 Arduino: {line}")
                                
                                sensor_data = parse_serial_line(line)
                                
                                if sensor_data:
                                    target_id = current_service_record_id or DEFAULT_SERVICE_ID
                                    
                                    print(f"🔄 Updating Sensors for {target_id}: {sensor_data}")
                                    
                                    update_sensor_data(
                                        service_record_id=target_id,
                                        **sensor_data
                                    )
                            except Exception as e:
                                print(f"⚠️ Parse/Update Error: {e}")
                                
                        time.sleep(0.1)
                        
            except serial.SerialException:
                print(f"❌ Serial Connection Failed ({SERIAL_PORT}). Retrying in 5s...")
                time.sleep(5)
            except Exception as e:
                print(f"❌ Serial Worker Error: {e}")
                time.sleep(5)

    t = threading.Thread(target=serial_worker, daemon=True)
    t.start()

    print(f"🚀 Starting Server... (Service ID: {current_service_record_id or 'None'})")
    uvicorn.run(app, host="0.0.0.0", port=8000)