import cv2
import threading
import requests
import time
from ultralytics import YOLO

# ======================================================
# 1. CONFIGURATION
# ======================================================

LAPTOP_IP = "192.168.137.1"
BASE_URL = f"http://{LAPTOP_IP}:8000/api/update"

# CAMERA MAPPING
CAMERAS = {
    "front": 0,
    "left": 2,
    "right": 4,
    "brake": 6
}

# ======================================================
# 2. LOAD TWO YOLO MODELS
# ======================================================

MODEL_SCRATCH = YOLO("scratch_dent_model.pt")   # Model 1
MODEL_BRAKE   = YOLO("brakeshoe_model.pt")      # Model 2

print("🔥 Models loaded: Scratch/Dent + Brake Shoe")


# ======================================================
# 3. TEST CONNECTION TO BACKEND
# ======================================================

def test_backend_connection():
    """Test if backend is reachable before starting cameras"""
    print(f"\n🔍 Testing connection to backend at {BASE_URL}...")
    try:
        response = requests.get(f"http://{LAPTOP_IP}:8000/api/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Backend connected successfully!")
            print(f"📡 Server status: {response.json()}")
            return True
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {LAPTOP_IP}:8000")
        print(f"   Make sure the backend server is running and the IP is correct.")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Connection timeout - backend not responding")
        return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False


# ======================================================
# 4. CAMERA WORKER (WITH STATUS INDICATORS)
# ======================================================

def camera_worker(station, usb_index):
    print(f"🚀 Starting {station.upper()} camera on USB {usb_index}")

    # Open camera
    cap = cv2.VideoCapture(usb_index)
    cap.set(3, 640)
    cap.set(4, 480)

    if not cap.isOpened():
        print(f"❌ Could not open camera {station}")
        return

    endpoint = f"{BASE_URL}/{station}"

    # SELECT MODEL FOR THIS CAMERA
    if station == "brake":
        model = MODEL_BRAKE
        print(f"🟡 {station.upper()} → Using BRAKE model")
    else:
        model = MODEL_SCRATCH
        print(f"🔵 {station.upper()} → Using SCRATCH/DENT model")

    # Statistics
    frame_count = 0
    success_count = 0
    error_count = 0
    last_status_time = time.time()

    # Main loop
    while True:
        try:
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️  Lost feed on {station.upper()}. Reconnecting…")
                cap.release()
                time.sleep(1)
                cap = cv2.VideoCapture(usb_index)
                continue

            # YOLO Inference
            results = model(frame)[0]
            annotated = results.plot()

            # Encode image
            _, buffer = cv2.imencode('.jpg', annotated)
            files = {'file': ('image.jpg', buffer.tobytes(), 'image/jpeg')}

            # POST to backend with status tracking
            response = requests.post(endpoint, files=files, timeout=1)
            
            frame_count += 1
            
            if response.status_code == 200:
                success_count += 1
                # Print success message every 50 frames
                if frame_count % 50 == 0:
                    print(f"✅ {station.upper()}: {success_count} images sent successfully (Frame {frame_count})")
            else:
                error_count += 1
                print(f"⚠️  {station.upper()}: Server returned status {response.status_code}")

            # Print periodic status update every 30 seconds
            current_time = time.time()
            if current_time - last_status_time >= 30:
                success_rate = (success_count / frame_count * 100) if frame_count > 0 else 0
                print(f"\n📊 {station.upper()} STATUS:")
                print(f"   ├─ Total frames: {frame_count}")
                print(f"   ├─ Successful: {success_count} ({success_rate:.1f}%)")
                print(f"   ├─ Errors: {error_count}")
                print(f"   └─ Endpoint: {endpoint}\n")
                last_status_time = current_time

        except requests.exceptions.ConnectionError:
            error_count += 1
            if error_count % 10 == 1:  # Print every 10th error to avoid spam
                print(f"❌ {station.upper()}: Cannot reach backend at {endpoint}")
                print(f"   Check network connection and backend status")
        except requests.exceptions.Timeout:
            error_count += 1
            if error_count % 10 == 1:
                print(f"⏱️  {station.upper()}: Request timeout - backend may be overloaded")
        except Exception as e:
            error_count += 1
            print(f"❌ ERROR in {station.upper()}: {e}")
            time.sleep(1)


# ======================================================
# 5. START ALL CAMERA THREADS
# ======================================================

print("\n" + "="*60)
print("🎥 MULTI-CAMERA YOLO INSPECTION SYSTEM")
print("="*60)

# Test backend connection first
if not test_backend_connection():
    print("\n⚠️  WARNING: Backend not reachable, but starting cameras anyway...")
    print("   Cameras will retry connection automatically.\n")
    time.sleep(2)

print("\n🔥 Launching 4-camera multi-model YOLO pipeline…\n")

for station, usb_index in CAMERAS.items():
    threading.Thread(target=camera_worker, args=(station, usb_index), daemon=True).start()
    time.sleep(0.5)  # Small delay between camera starts
    print(f"✅ Thread started for {station.upper()} station")

print("\n" + "="*60)
print("🚀 All cameras running with correct models.")
print(f"📡 Sending to: {BASE_URL}")
print("💡 Status updates will appear every 30 seconds")
print("="*60 + "\n")

# Keep alive with periodic heartbeat
print("🟢 System running... Press Ctrl+C to stop\n")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n\n🛑 Shutting down cameras...")
    print("✅ System stopped successfully")
