# 🚀 RPi Multi-Camera Setup Guide

## Critical Bugs Fixed ✅

### 1. **Main Bug - Script Wouldn't Run**
```python
# ❌ WRONG (Your original code)
if __name__ == "_main_":

# ✅ FIXED
if __name__ == "__main__":
```
**Problem**: Single underscores instead of double underscores prevented the script from executing.

### 2. **API Endpoint Mismatch**
```python
# ❌ WRONG (Your original code)
API_URL = f"http://{LAPTOP_IP}:8000/api/analyze-image"
# Only sent to analyze-image, didn't update station feeds

# ✅ FIXED
# Sends to both:
# 1. /api/analyze-image (for YOLO processing)
# 2. /api/update/{station} (for multi-camera display)
```
**Problem**: Website's "RPi Feed" mode expects data at `/api/update/{station}` endpoints.

### 3. **Missing Error Handling**
- ✅ Added backend connection test before starting
- ✅ Added camera availability checks
- ✅ Added proper retry logic for lost camera connections
- ✅ Added status reporting every 30 seconds

---

## 📋 Setup Instructions

### Step 1: Verify Your Setup

**On Your Laptop:**
1. Backend server is running: `python api.py` ✅ (Already running)
2. Frontend is running: `npm run dev` ✅ (Already running)
3. Find your laptop's IP address:
   ```bash
   ipconfig
   # Look for IPv4 Address under your active network adapter
   ```

**On Your Raspberry Pi:**
1. Copy the fixed script: `rpi_multi_camera_fixed.py`
2. Update line 11 with your laptop's actual IP:
   ```python
   LAPTOP_IP = "192.168.137.1"  # Change if different
   ```

### Step 2: Test Camera Connections (On RPi)

Before running the full script, test if cameras are accessible:

```python
import cv2

# Test each USB index
for usb_index in [0, 2, 4, 6]:
    cap = cv2.VideoCapture(usb_index)
    if cap.isOpened():
        print(f"✅ Camera found on USB {usb_index}")
        cap.release()
    else:
        print(f"❌ No camera on USB {usb_index}")
```

**If cameras are not found:**
- Your cameras might be on different USB indices
- Try indices: 0, 1, 2, 3 instead of 0, 2, 4, 6
- Update `CAMERA_MAPPING` in the script

### Step 3: Run the Fixed Script (On RPi)

```bash
python rpi_multi_camera_fixed.py
```

**Expected Output:**
```
============================================================
🎥 MULTI-CAMERA LIVE FEED SYSTEM
============================================================
📡 Backend: http://192.168.137.1:8000
📹 Cameras: 4
============================================================

🔍 Testing connection to backend at http://192.168.137.1:8000...
✅ Backend connected successfully!
📡 Server status: {'status': 'online'}

🚀 Starting camera threads...
📹 Starting Camera 0 (FRONT) on USB 0
✅ Camera 0 (FRONT) ready
📹 Starting Camera 1 (LEFT) on USB 2
✅ Camera 1 (LEFT) ready
📹 Starting Camera 2 (RIGHT) on USB 4
✅ Camera 2 (RIGHT) ready
📹 Starting Camera 3 (BRAKE) on USB 6
✅ Camera 3 (BRAKE) ready

⏳ Waiting for cameras to initialize...

✅ 4/4 cameras ready!
🚀 Starting live feed transmission...

🚀 Starting frame sender...
```

### Step 4: View Live Feed (On Website)

1. Open your website in browser
2. Navigate to **Live Feed** section
3. Select **"RPi Feed"** from video source dropdown
4. You should see all 4 camera feeds:
   - Front Station (Camera 0)
   - Left Station (Camera 1)
   - Right Station (Camera 2)
   - Brake Station (Camera 3)

### Step 5: Test Auto-Capture

1. Click **"AUTO CAPTURE"** button
2. Watch as each station captures sequentially
3. **Timing**: 2 seconds between each station
4. **Total time**: ~8 seconds for all 4 stations

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to backend"

**Solutions:**
1. Verify backend is running: Check terminal running `python api.py`
2. Check IP address:
   ```bash
   # On laptop
   ipconfig
   # Make sure RPi script uses this IP
   ```
3. Verify network connection:
   ```bash
   # On RPi, ping laptop
   ping 192.168.137.1
   ```
4. Check firewall: Allow port 8000 on laptop

### Problem: "No cameras detected"

**Solutions:**
1. Check USB connections
2. List available cameras:
   ```bash
   # On RPi
   ls /dev/video*
   # Output: /dev/video0 /dev/video1 /dev/video2 /dev/video3
   ```
3. Try different USB indices:
   ```python
   # In rpi_multi_camera_fixed.py, change:
   CAMERA_MAPPING = {
       0: ("front", 0),   # Try 0, 1, 2, 3 instead
       1: ("left", 1),
       2: ("right", 2),
       3: ("brake", 3)
   }
   ```
4. Check camera permissions:
   ```bash
   sudo usermod -a -G video $USER
   # Then logout and login again
   ```

### Problem: "Live feed not displaying on website"

**Solutions:**
1. Check browser console (F12) for errors
2. Verify backend is receiving data:
   ```bash
   # Test endpoint
   curl http://127.0.0.1:8000/api/station-feed/front
   ```
3. Refresh the page
4. Try switching video source to "No Feed" then back to "RPi Feed"

### Problem: "Only some cameras working"

**Solutions:**
1. Check RPi terminal for camera errors
2. One camera might be using wrong USB index
3. Update `CAMERA_MAPPING` for problematic cameras

---

## 📊 System Status Monitoring

The fixed script provides status updates every 30 seconds:

```
============================================================
📊 SYSTEM STATUS
============================================================
FRONT  | Sent: 1234 | Errors:   12 | Success:  99.0%
LEFT   | Sent: 1229 | Errors:   15 | Success:  98.8%
RIGHT  | Sent: 1231 | Errors:   14 | Success:  98.9%
BRAKE  | Sent: 1235 | Errors:   11 | Success:  99.1%
============================================================
```

**Good indicators:**
- Success rate > 95%
- Errors are minimal
- All cameras sending frames

**Bad indicators:**
- Success rate < 50%
- Many errors
- Some cameras show 0 sent frames

---

## 🎯 Quick Reference

### Camera Mapping (Default)
| Camera ID | Station | USB Index | Model |
|-----------|---------|-----------|-------|
| 0 | Front | 0 | Scratch/Dent |
| 1 | Left | 2 | Scratch/Dent |
| 2 | Right | 4 | Scratch/Dent |
| 3 | Brake | 6 | Brake Shoe |

### Auto-Capture Settings
- **Interval**: 2 seconds per station
- **Order**: Front → Left → Right → Brake
- **Total time**: ~8 seconds for all 4 stations

### API Endpoints
- Backend: `http://{LAPTOP_IP}:8000`
- Station feeds: `/api/update/{station}`
- Latest detection: `/api/latest-detection`
- Health check: `/api/health`

---

## 📝 Comparison: Old vs Fixed Script

| Feature | Original Script | Fixed Script |
|---------|----------------|--------------|
| Main check | `_main_` ❌ | `__main__` ✅ |
| API endpoint | Only analyze-image | Both analyze + station ✅ |
| Backend test | None ❌ | Full test ✅ |
| Error handling | Minimal | Comprehensive ✅ |
| Status reporting | None ❌ | Every 30s ✅ |
| Camera retry | Basic | Robust ✅ |

---

## 🆘 Still Having Issues?

1. **Check backend terminal** - Look for incoming POST requests
2. **Check RPi terminal** - Look for error messages
3. **Test individual components**:
   - Backend health: `curl http://127.0.0.1:8000/api/health`
   - Camera test: Run the camera test snippet above
   - Network test: `ping {LAPTOP_IP}` from RPi
4. **Verify all requirements installed**:
   ```bash
   pip install opencv-python requests
   ```

---

## ✅ Success Checklist

- [ ] Backend server running on laptop
- [ ] Frontend running on laptop  
- [ ] Correct laptop IP in RPi script
- [ ] RPi can ping laptop IP
- [ ] All 4 cameras connected to RPi
- [ ] Camera USB indices are correct
- [ ] RPi script runs without errors
- [ ] All 4 camera feeds visible on website
- [ ] Auto-capture works with 2-second intervals
- [ ] Status updates show >95% success rate

**When all checked, your system is fully operational! 🎉**
