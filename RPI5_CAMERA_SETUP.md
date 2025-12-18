# 🔧 Raspberry Pi 5 Setup Guide for 4-Camera System

## Overview

This guide will help you set up 4 USB cameras on your Raspberry Pi 5 for the automotive service station inspection system.

---

## 📦 Hardware Requirements

✅ **Raspberry Pi 5** (4GB or 8GB RAM)  
✅ **4x USB Webcams** (any USB webcams will work)  
✅ **USB Hub** (powered, if using high-resolution cameras)  
✅ **Power Supply** (Official 27W USB-C adapter recommended)  
✅ **MicroSD Card** (already set up with OS)  

---

## 🔌 Step 1: Connect Cameras

### Physical Connections

Connect your 4 USB cameras to the Raspberry Pi:

```
RPi USB Ports:
├─ USB Port 1 → Front Camera  (will be /dev/video0)
├─ USB Port 2 → Left Camera   (will be /dev/video2)
├─ USB Port 3 → Right Camera  (will be /dev/video4)
└─ USB Port 4 → Brake Camera  (will be /dev/video6)
```

> [!NOTE]
> Each USB camera creates 2 devices (`/dev/videoX` and `/dev/videoX+1`). We use the even numbers (0, 2, 4, 6) for actual video capture.

---

## ✅ Step 2: Verify Camera Detection

SSH into your Raspberry Pi and run:

```bash
ls -l /dev/video*
```

**Expected output**:
```
crw-rw----+ 1 root video 81, 0 Dec 18 10:00 /dev/video0
crw-rw----+ 1 root video 81, 1 Dec 18 10:00 /dev/video1
crw-rw----+ 1 root video 81, 2 Dec 18 10:00 /dev/video2
crw-rw----+ 1 root video 81, 3 Dec 18 10:00 /dev/video3
crw-rw----+ 1 root video 81, 4 Dec 18 10:00 /dev/video4
crw-rw----+ 1 root video 81, 5 Dec 18 10:00 /dev/video5
crw-rw----+ 1 root video 81, 6 Dec 18 10:00 /dev/video6
crw-rw----+ 1 root video 81, 7 Dec 18 10:00 /dev/video7
```

If you see **8 video devices**, ✅ all 4 cameras are detected!

### Test Individual Cameras

```bash
# Test camera 0 (Front)
v4l2-ctl --device=/dev/video0 --all

# Should show camera info, resolution, etc.
```

---

## ⚙️ Step 3: Configure the Script

### Navigate to Project Directory

```bash
cd ~/automotive-service
```

### Edit Configuration

```bash
nano rpi_multicam_agent.py
```

### Update These Lines:

#### Line 63: Set Your Backend URL
```python
BACKEND_URL = "http://192.168.1.50:8000"  # Replace with your laptop's IP address
```

**To find your laptop's IP**:
- On Windows: Run `ipconfig` in PowerShell
- Look for "IPv4 Address" (e.g., `192.168.1.50`)

#### Lines 86-87: Verify Auto-Capture Settings
```python
AUTO_CAPTURE_ENABLED = True  # Must be True for auto-capture
AUTO_CAPTURE_INTERVAL = 2    # 2 seconds between each camera
```

#### Lines 92-94: Verify Model Paths
```python
DAMAGE_MODEL_PATH = "best.pt"     # Scratch/dent model
BRAKE_MODEL_PATH = "brakes.pt"    # Brake inspection model
```

**Save the file**: Press `Ctrl+X`, then `Y`, then `Enter`

---

## 🎯 Step 4: Map Cameras to Stations

The script automatically maps camera IDs to inspection stations:

| Camera ID | Station | Model Used     | Purpose               |
|-----------|---------|----------------|-----------------------|
| 0         | Front   | `best.pt`      | Scratch/Dent Detection|
| 1         | Left    | `best.pt`      | Scratch/Dent Detection|
| 2         | Right   | `best.pt`      | Scratch/Dent Detection|
| 3         | Brake   | `brakes.pt`    | Brake Inspection      |

> [!IMPORTANT]
> **If your cameras are detected in a different order**, either:
> 1. **Physically reconnect** cameras to match the order above, OR
> 2. **Modify the script** (lines 113-118) to update the mapping

---

## 🚀 Step 5: Test the System

### Start the Script

```bash
python3 rpi_multicam_agent.py
```

### Expected Console Output

```
════════════════════════════════════════════════════════════
RPi5 MULTI-CAMERA AUTO-CAPTURE AGENT
════════════════════════════════════════════════════════════
Backend: http://192.168.1.50:8000
Service ID: 455e445f-c11b-4db7-8c78-e62f8df86614
Auto-Capture: ENABLED
════════════════════════════════════════════════════════════
⏳ Loading YOLO models...
✅ Loaded damage model: best.pt
✅ Loaded brake model: brakes.pt
✅ All YOLO models loaded successfully
🚀 Starting all threads...
🔄 Active camera poller started (interval: 0.3s)
🎥 Live feed streamer started
🔄 Auto-capture started (interval: 2s per camera)
✅ All systems operational
Press Ctrl+C to stop

📹 Opening camera 0 (front station)
✅ Camera 0 opened successfully
📸 Auto-capturing front station (camera 0)
✅ Capture sent (camera 0, manual=False)

<wait 2 seconds>

📹 Opening camera 1 (left station)
✅ Camera 1 opened successfully
📸 Auto-capturing left station (camera 1)
✅ Capture sent (camera 1, manual=False)

<continues for all 4 cameras...>
```

---

## 🌐 Step 6: Verify Website Connection

### On Your Laptop

1. **Make sure backend is running**:
   ```powershell
   python api.py
   ```

2. **Open website** at http://localhost:5173

3. **Go to Overview tab**

4. **Select "RPi Feed"** as video source

5. **Watch the live feeds** appear in all 4 station tabs:
   - ✅ Front Station showing camera 0 feed
   - ✅ Left Station showing camera 1 feed
   - ✅ Right Station showing camera 2 feed
   - ✅ Brake Station showing camera 3 feed

6. **Click "AUTO CAPTURE"** button

7. **Watch sequential processing**:
   - Button shows "CAPTURING 1/4..."
   - Front tab shows "CAPTURING NOW..." with green highlight
   - After 2s, "CAPTURING 2/4..." → Left tab highlighted
   - After 2s, "CAPTURING 3/4..." → Right tab highlighted
   - After 2s, "CAPTURING 4/4..." → Brake tab highlighted
   - Annotated images appear in respective tabs

---

## 🐛 Troubleshooting

### Camera Not Detected

**Problem**: `ls /dev/video*` shows fewer than 8 devices

**Solution**:
```bash
# Check USB connections
lsusb

# Look for "Camera" or "Webcam" entries
# Should see 4 USB cameras listed

# Reboot and check again
sudo reboot
```

---

### Backend Connection Failed

**Problem**: `❌ Backend poll failed` errors in console

**Solutions**:

1. **Check laptop's IP address** is correct in Line 63
2. **Verify backend is running** on laptop
3. **Check firewall** on Windows laptop:
   ```powershell
   # Allow port 8000 in Windows Firewall
   New-NetFirewallRule -DisplayName "FastAPI Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```
4. **Ping test** from RPi:
   ```bash
   ping 192.168.1.50  # Your laptop IP
   ```

---

### Wrong Camera Order

**Problem**: Front camera shows in Left station, etc.

**Solution**: Edit camera mapping in `rpi_multicam_agent.py` lines 113-118:

```python
CAMERA_STATION_MAP = {
    0: "front",   # Change these numbers to match your cameras
    1: "left",
    2: "right",
    3: "brake"
}
```

---

### Low FPS or Performance Issues

**Problem**: Cameras lag or low frame rate

**Solutions**:

1. **Lower resolution** (Line 166-167):
   ```python
   cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)   # Was 640
   cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)  # Was 480
   ```

2. **Reduce target FPS** (Line 82):
   ```python
   TARGET_FPS = 5  # Was 10
   ```

3. **Increase capture interval** (Line 87):
   ```python
   AUTO_CAPTURE_INTERVAL = 5  # Increase from 2 to 5 seconds
   ```

---

## 🔄 Auto-Start on Boot (Optional)

To make the script run automatically when RPi boots:

```bash
# Create systemd service
sudo nano /etc/systemd/system/rpi-inspection.service
```

Add this content:
```ini
[Unit]
Description=RPi Multi-Camera Inspection Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/automotive-service
ExecStart=/usr/bin/python3 /home/pi/automotive-service/rpi_multicam_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable rpi-inspection.service
sudo systemctl start rpi-inspection.service

# Check status
sudo systemctl status rpi-inspection.service
```

---

## 📊 System Status Check

### Quick Health Check

```bash
# Check if script is running
ps aux | grep rpi_multicam_agent

# View logs if using systemd service
sudo journalctl -u rpi-inspection.service -f

# Check camera usage
v4l2-ctl --list-devices
```

---

## 🎯 Testing Checklist

- [ ] All 4 cameras detected (`ls /dev/video*` shows 8 devices)
- [ ] YOLO models loaded successfully (no errors on startup)
- [ ] Backend connection established (no poll errors)
- [ ] Live feeds visible in all 4 station tabs on website
- [ ] Auto-capture sequences through all 4 cameras with 2s intervals
- [ ] Annotated images appear in correct tabs
- [ ] Defect counts are accurate

---

## 📝 Quick Reference

**Start Script**:
```bash
cd ~/automotive-service
python3 rpi_multicam_agent.py
```

**Stop Script**: Press `Ctrl+C`

**View Live Logs**:
```bash
tail -f ~/detection.log  # If logging to file
```

**Camera IDs**:
- 0 → Front (Damage Model)
- 1 → Left (Damage Model)
- 2 → Right (Damage Model)
- 3 → Brake (Brake Model)

**Configuration File**: `~/automotive-service/rpi_multicam_agent.py`
- Line 63: Backend URL
- Line 86-87: Auto-capture settings
- Line 92-94: Model paths

---

**✅ Setup Complete! Your 4-camera inspection system is ready.**
