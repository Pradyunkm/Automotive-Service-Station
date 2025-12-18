# 🚀 Complete Raspberry Pi Setup Guide
## Automotive Service Station - From Zero to Running

This guide will walk you through setting up your Raspberry Pi from scratch for the automotive service station project with camera-based inspection and YOLO detection.

---

## 📋 What You'll Need

### Hardware
- **Raspberry Pi 4** (4GB or 8GB RAM recommended)
- **MicroSD Card** (32GB or larger, Class 10 or better)
- **Power Supply** (Official 5V 3A USB-C adapter)
- **Raspberry Pi Camera Module(s)** - Up to 4 cameras for:
  - Front station inspection
  - Left side inspection
  - Right side inspection
  - Brake inspection
- **Ethernet cable** or WiFi connection
- **Monitor, keyboard, mouse** (for initial setup)

### Software Files You'll Need
- Raspberry Pi Imager (we'll download this)
- Your YOLO model files: `scratch_model.pt` and `brakes.pt`
- Your Python script: `rpi_multi_camera_yolo.py`

---

## 🔧 Step 1: Install Raspberry Pi OS

### 1.1 Download Raspberry Pi Imager

**On Windows:**
1. Go to https://www.raspberrypi.com/software/
2. Download "Raspberry Pi Imager for Windows"
3. Install and run the application

### 1.2 Flash the OS to SD Card

1. **Insert your microSD card** into your computer
2. **Open Raspberry Pi Imager**
3. **Choose Device**: Select "Raspberry Pi 4"
4. **Choose OS**: 
   - Click "Raspberry Pi OS (other)"
   - Select **"Raspberry Pi OS (64-bit)"** (recommended for better performance)
5. **Choose Storage**: Select your microSD card
6. **Click the ⚙️ (Settings) icon** before writing:
   - ✅ **Set hostname**: `automotive-rpi` (or any name you prefer)
   - ✅ **Enable SSH**: Check "Enable SSH" and select "Use password authentication"
   - ✅ **Set username and password**:
     - Username: `pi`
     - Password: (choose a secure password)
   - ✅ **Configure WiFi** (if using WiFi):
     - SSID: Your WiFi network name
     - Password: Your WiFi password
     - WiFi country: Your country code (e.g., `IN` for India)
   - ✅ **Set locale settings**: Your timezone and keyboard layout
7. **Click "SAVE"**
8. **Click "WRITE"** and wait for the process to complete (5-10 minutes)
9. **Remove the SD card** when done

### 1.3 First Boot

1. Insert the microSD card into your Raspberry Pi
2. Connect monitor, keyboard, and mouse
3. Connect power supply
4. Wait for the Pi to boot (first boot takes 1-2 minutes)
5. You should see the Raspberry Pi desktop

---

## 🌐 Step 2: Initial System Setup

### 2.1 Connect to Your Network

**If using Ethernet:**
- Just plug in the cable - it will auto-configure

**If using WiFi (and didn't configure it in Imager):**
1. Click the network icon in the top-right corner
2. Select your WiFi network
3. Enter the password

### 2.2 Find Your Pi's IP Address

Open a terminal and type:
```bash
hostname -I
```
Note down this IP address (e.g., `192.168.1.100`) - you'll use it to access the Pi remotely.

### 2.3 Update the System

Run these commands in the terminal:
```bash
sudo apt update
sudo apt upgrade -y
```
This will take 10-15 minutes. **Let it complete.**

### 2.4 Enable Camera Interface

1. Open terminal and run:
```bash
sudo raspi-config
```
2. Navigate to: **Interface Options** → **Legacy Camera** → **Enable**
3. Also enable: **Interface Options** → **SSH** (if not already enabled)
4. Select **Finish** and **Reboot**

---

## 🐍 Step 3: Install Python Dependencies

### 3.1 Install System Packages

```bash
sudo apt install -y python3-pip python3-opencv libcamera-dev
sudo apt install -y python3-picamera2 python3-libcamera
sudo apt install -y libatlas-base-dev libhdf5-dev libhdf5-serial-dev
sudo apt install -y libjasper-dev libqtgui4 libqt4-test
```

### 3.2 Install Python Libraries

```bash
# Upgrade pip
pip3 install --upgrade pip

# Install PyTorch (CPU version for Raspberry Pi)
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install Ultralytics (YOLO)
pip3 install ultralytics

# Install other dependencies
pip3 install opencv-python-headless
pip3 install requests
pip3 install numpy
pip3 install pillow
```

**Note:** This will take 30-60 minutes depending on your Pi and internet speed.

---

## 📸 Step 4: Set Up Cameras

### 4.1 Connect Camera Module

1. **Power off** the Raspberry Pi
2. Locate the camera connector (between HDMI and audio jack)
3. Gently pull up the plastic clip
4. Insert the camera ribbon cable (blue side facing the audio jack)
5. Push the clip back down
6. Power on the Pi

### 4.2 Test Camera

```bash
# Test with legacy camera
raspistill -o test.jpg

# Or test with libcamera (newer method)
libcamera-still -o test.jpg
```

If you see a test image file created, your camera works! ✅

### 4.3 Multiple Cameras Setup (Optional)

For 4 cameras, you'll need:
- USB webcams OR
- Camera multiplexer board OR
- Multiple Raspberry Pis (one per station)

**For USB webcams:**
```bash
# List connected cameras
ls /dev/video*

# Should show: /dev/video0, /dev/video1, /dev/video2, /dev/video3
```

---

## 🤖 Step 5: Transfer Project Files

### 5.1 Create Project Directory

```bash
mkdir ~/automotive-service
cd ~/automotive-service
```

### 5.2 Transfer Files from Your PC

**Option A: Using SCP (from your Windows PC)**

Open PowerShell on your Windows PC and run:
```powershell
# Navigate to your project folder
cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"

# Transfer Python script
scp rpi_multi_camera_yolo.py pi@192.168.1.100:~/automotive-service/

# Transfer YOLO models
scp scratch_model.pt pi@192.168.1.100:~/automotive-service/
scp brakes.pt pi@192.168.1.100:~/automotive-service/
```

Replace `192.168.1.100` with your Pi's actual IP address.

**Option B: Using USB Drive**
1. Copy files to a USB drive on your PC
2. Plug USB drive into Raspberry Pi
3. Copy files:
```bash
cp /media/pi/YOUR_USB_NAME/*.py ~/automotive-service/
cp /media/pi/YOUR_USB_NAME/*.pt ~/automotive-service/
```

---

## ⚙️ Step 6: Configure the Script

### 6.1 Edit Backend URL

Open the Python script:
```bash
nano ~/automotive-service/rpi_multi_camera_yolo.py
```

Find this line (near the top):
```python
BACKEND_URL = "http://localhost:8000"
```

Change it to your actual backend URL:
```python
# If backend is on your Windows PC (find PC's IP with 'ipconfig')
BACKEND_URL = "http://192.168.1.50:8000"  # Replace with your PC's IP

# OR if using deployed backend
BACKEND_URL = "https://automotive-service-station.onrender.com"
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 6.2 Verify Camera Configuration

The script is configured for 4 cameras. If you have fewer cameras, edit the `CAMERAS` section in the script.

---

## 🚀 Step 7: Run the Detection System

### 7.1 Test Run

```bash
cd ~/automotive-service
python3 rpi_multi_camera_yolo.py
```

You should see:
```
⏳ Loading YOLO Models...
✅ Front/Left/Right Model Loaded from scratch_model.pt
✅ Brake Model Loaded from brakes.pt
🚀 Starting multi-camera capture...
📸 Camera 0 (Front) initialized
📸 Camera 1 (Left) initialized
...
```

### 7.2 Verify Website Connection

1. Open your website
2. Go to the live feed section
3. Select "RPi Feed" as the source
4. You should see the camera feeds appearing!

---

## 🔄 Step 8: Auto-Start on Boot (Optional)

To make the script run automatically when the Pi starts:

### 8.1 Create Startup Script

```bash
nano ~/automotive-service/start_detection.sh
```

Add this content:
```bash
#!/bin/bash
cd /home/pi/automotive-service
python3 rpi_multi_camera_yolo.py >> /home/pi/detection.log 2>&1
```

Save and make it executable:
```bash
chmod +x ~/automotive-service/start_detection.sh
```

### 8.2 Add to Cron

```bash
crontab -e
```

Select `nano` editor (option 1), then add this line at the bottom:
```
@reboot sleep 30 && /home/pi/automotive-service/start_detection.sh
```

Save and exit. Now the script will start 30 seconds after boot!

---

## 🧪 Step 9: Testing Everything

### 9.1 Backend Connection Test

```bash
# Test if backend is reachable
curl http://YOUR_BACKEND_IP:8000/api/health

# Should return: {"status":"online"}
```

### 9.2 Full System Test

1. **Start the RPi detection** (if not already running)
2. **Open your website** on any device
3. **Navigate to Overview tab**
4. **Select video source**: Choose "RPi Feed"
5. **Select camera**: Choose which station (Front/Left/Right/Brake)
6. **Click "Start Auto-Capture"**
7. **Verify**: Images should appear with detection boxes!

---

## 🐛 Troubleshooting

### Camera Not Detected
```bash
# Check if camera is recognized
vcgencmd get_camera

# Should show: supported=1 detected=1

# If not, check cable connection and enable legacy camera in raspi-config
```

### Models Not Loading
```bash
# Check if model files exist
ls -lh ~/automotive-service/*.pt

# Verify file sizes (should be ~6MB each)
```

### Backend Connection Failed
```bash
# Check if backend is running
curl http://YOUR_BACKEND_URL/api/health

# Check network connection
ping YOUR_BACKEND_IP

# Check firewall on your Windows PC (allow port 8000)
```

### Out of Memory Errors
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=100 to CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Script Crashes
```bash
# Check logs
tail -f ~/detection.log

# Run with verbose output
python3 rpi_multi_camera_yolo.py --verbose
```

---

## 📊 Performance Tips

### Optimize Detection Speed
- **Lower resolution**: Edit script to use 640x480 instead of 1920x1080
- **Reduce detection frequency**: Add delays between captures
- **Use confidence threshold**: Only process high-confidence detections

### Power Management
- **Disable WiFi if using Ethernet**: `sudo rfkill block wifi`
- **Disable Bluetooth**: `sudo rfkill block bluetooth`
- **Reduce GPU memory**: In `/boot/config.txt`, set `gpu_mem=128`

---

## 🎯 Next Steps

1. ✅ **Backend is running** on `http://localhost:8000`
2. ✅ **Website connects** to backend via environment configuration
3. **Now set up the Raspberry Pi** following this guide
4. **Test the full system** with live detection
5. **Fine-tune** detection models if needed

---

## 📞 Quick Reference

**Raspberry Pi Login:**
- Username: `pi`
- Password: (your chosen password)
- SSH: `ssh pi@YOUR_PI_IP`

**Important Paths:**
- Project: `~/automotive-service/`
- Models: `~/automotive-service/*.pt`
- Logs: `~/detection.log`

**Backend URLs:**
- Local: `http://localhost:8000`
- Your PC: `http://YOUR_PC_IP:8000`
- Production: `https://automotive-service-station.onrender.com`

---

**Good luck with your setup! 🚀**
