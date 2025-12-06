# ⚠️ IMPORTANT: How to Run the Backend Correctly

## The Problem:
You're running: `uvicorn api:app --reload --host 0.0.0.0 --port 8000`

This **does NOT start the serial worker** that reads Arduino data!

## The Solution:
Run the backend with: `python api.py`

This will:
✅ Start the FastAPI server
✅ Start the serial worker thread
✅ Connect to Arduino on COM5
✅ Read sensor data and update Supabase

---

## Steps to Fix:

### 1. Stop the current backend
Press `Ctrl+C` in the terminal where uvicorn is running

### 2. Start the correct way
```bash
python api.py
```

### 3. You should see:
```
⏳ Loading Models...
✅ Models Loaded
🔌 Attempting to connect to Arduino on COM5...
✅ Serial Connected on COM5
🚀 Starting Server... (Service ID: 455e445f-c11b-4db7-8c78-e62f8df86614)
INFO:     Started server process
INFO:     Waiting for application startup.
```

### 4. When Arduino sends data, you'll see:
```
📥 Arduino: {"rpm": 4440, "battery": 3, "voltage": 11.04, "vibration": "HIGH", "range": 0.37}
🔄 Updating Sensors for 455e445f-c11b-4db7-8c78-e62f8df86614: {'rpm': 4440, 'battery_level': 3, ...}
```

---

## Why This Matters:

The serial worker is in the `if __name__ == "__main__":` block, which only runs when you execute the file directly with `python api.py`.

When you use `uvicorn api:app`, it imports the module differently and skips that block.

---

## Quick Commands:

```bash
# Stop current backend (Ctrl+C in that terminal)

# Navigate to project folder
cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"

# Run the backend correctly
python api.py
```

---

## After Restarting:

1. ✅ Upload the updated Arduino sketch (arduino_sensor_sketch.ino) with 115200 baud rate
2. ✅ Restart backend with `python api.py`
3. ✅ Check that Arduino data appears in backend console
4. ✅ Check that website shows "LIVE DATA CONNECTED" badge
5. ✅ Watch sensor values update in real-time!

---

**Note:** You should NOT use the Arduino sketch that sends HTTP requests. Use the simple serial-based sketch I created in `arduino_sensor_sketch/arduino_sensor_sketch.ino`.
