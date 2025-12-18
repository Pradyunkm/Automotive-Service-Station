# 🚀 Raspberry Pi 5 Complete Setup Guide
**Production-Grade Multi-Camera Auto-Capture System for Automotive Service Station**

---

## 📋 Prerequisites

- Raspberry Pi 5 (8GB RAM recommended)
- 256GB+ microSD card (Class 10 or better)
- 4 USB cameras (compatible with V4L2)
- Stable internet connection
- Laptop for initial setup

---

## 1️⃣ OS INSTALLATION

### Flash Raspberry Pi OS

1. **Download Raspberry Pi Imager**
   - Visit: https://www.raspberrypi.com/software/
   - Install on your laptop

2. **Flash OS to microSD**
   ```
   OS: Raspberry Pi OS (64-bit) - Bookworm
   Storage: Your microSD card
   ```

3. **Configure Settings** (click ⚙️ gear icon)
   ```
   ✅ Enable SSH
   ✅ Set username: pi
   ✅ Set password: <your-secure-password>
   ✅ Configure WiFi (SSID & Password)
   ✅ Set hostname: rpi5-feed
   ✅ Set locale/timezone
   ```

4. **Write to SD Card**
   - Click "WRITE" and wait for completion
   - Insert SD card into RPi5 and power on

5. **Find RPi IP Address**
   ```bash
   # Option 1: Check your router DHCP clients
   # Option 2: Use nmap from laptop
   nmap -sn 192.168.1.0/24
   
   # Look for: rpi5-feed.local or "Raspberry Pi Foundation"
   ```

6. **SSH into RPi**
   ```bash
   ssh pi@<rpi-ip-address>
   # Or: ssh pi@rpi5-feed.local
   ```

---

## 2️⃣ INITIAL SYSTEM SETUP

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Expand filesystem (if not auto-expanded)
sudo raspi-config
# Navigate: Advanced Options > Expand Filesystem > Reboot

# Install essential tools
sudo apt install -y git vim htop curl wget
```

---

## 3️⃣ INSTALL DEPENDENCIES

### System Libraries

```bash
# Camera and graphics libraries
sudo apt install -y \
    libcamera-apps \
    libgl1 \
    libglib2.0-0 \
    v4l-utils \
    ffmpeg

# Python development tools
sudo apt install -y \
    python3-pip \
    python3-dev \
    python3-venv
```

### Python Packages

```bash
# Create virtual environment (recommended)
python3 -m venv ~/venv
source ~/venv/bin/activate

# Install YOLO and dependencies
pip3 install --upgrade pip
pip3 install ultralytics opencv-python-headless requests pillow numpy

# Verify installation
python3 -c "from ultralytics import YOLO; import cv2; print('✅ All imports successful')"
```

---

## 4️⃣ CAMERA CONFIGURATION

### Detect Cameras

```bash
# List video devices
ls -l /dev/video*

# Expected output (for 4 cameras):
# /dev/video0
# /dev/video2
# /dev/video4
# /dev/video6
# (Odd numbers are metadata devices, use even numbers)

# Get camera details
v4l2-ctl --list-devices

# Test individual camera
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

### Set Camera Permissions

```bash
# Add user to video group
sudo usermod -a -G video $USER

# Apply changes (logout/login or reboot)
sudo reboot
```

### Test Camera with libcamera

```bash
# Test camera 0 (5 second preview)
libcamera-hello --camera 0 -t 5000

# If no display, test JPEG capture
libcamera-jpeg --camera 0 -o test.jpg
ls -lh test.jpg  # Should see image file
```

---

## 5️⃣ MODEL DEPLOYMENT

### Download YOLO Models

```bash
# Create project directory
mkdir -p ~/automotive-vision
cd ~/automotive-vision

# Option 1: Copy from laptop via SCP
# From your laptop:
scp best.pt brakes.pt pi@<rpi-ip>:~/automotive-vision/

# Option 2: Download from cloud storage (if hosted)
# wget <your-model-url>/best.pt
# wget <your-model-url>/brakes.pt
```

### Verify Models

```bash
# Test damage model
python3 << EOF
from ultralytics import YOLO
model = YOLO('best.pt')
print(f"✅ Damage Model Loaded: {len(model.names)} classes")
print(f"Classes: {model.names}")
EOF

# Test brake model
python3 << EOF
from ultralytics import YOLO
model = YOLO('brakes.pt')
print(f"✅ Brake Model Loaded: {len(model.names)} classes")
print(f"Classes: {model.names}")
EOF
```

### Benchmark Performance

```bash
# Create benchmark script
cat > benchmark.py << 'EOF'
from ultralytics import YOLO
import cv2
import time
import numpy as np

# Generate dummy frame
frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

# Load model
model = YOLO('best.pt')

# Warmup
for _ in range(5):
    model(frame, verbose=False)

# Benchmark
times = []
for _ in range(20):
    start = time.time()
    model(frame, verbose=False)
    times.append(time.time() - start)

avg_time = sum(times) / len(times)
fps = 1.0 / avg_time
print(f"Average Inference Time: {avg_time*1000:.2f}ms")
print(f"Estimated FPS: {fps:.2f}")
EOF

python3 benchmark.py
# Target: >10 FPS on RPi5
```

---

## 6️⃣ DEPLOY RPi SCRIPT

### Copy Script to RPi

```bash
# From your laptop (in project directory):
scp rpi_multicam_agent.py pi@<rpi-ip>:~/automotive-vision/

# Or clone from GitHub:
cd ~/automotive-vision
git clone <your-repo-url> .
```

### Configure Script

```bash
cd ~/automotive-vision
nano rpi_multicam_agent.py

# Edit these lines in Config class:
# BACKEND_URL = "https://your-backend.com"  # Your actual backend URL
# SERVICE_RECORD_ID = "your-service-id"     # Your service record ID

# Save: Ctrl+O, Enter, Ctrl+X
```

### Test Script

```bash
# Activate venv
source ~/venv/bin/activate

# Run script
python3 rpi_multicam_agent.py

# Expected output:
# ═══════════════════════════════════════════
# RPi5 MULTI-CAMERA AUTO-CAPTURE AGENT
# ═══════════════════════════════════════════
# Backend: https://your-backend.com
# Service ID: your-service-id
# Auto-Capture: ENABLED
# ═══════════════════════════════════════════
# ⏳ Loading YOLO models...
# ✅ Loaded damage model: best.pt
# ✅ Loaded brake model: brakes.pt
# 🚀 Starting all threads...
# 📹 Opening camera 0 (front station)
# ✅ Camera 0 opened successfully
# 🎥 Live feed streamer started
# 🔄 Auto-capture started (interval: 10s per camera)
# ✅ All systems operational

# Stop with: Ctrl+C
```

---

## 7️⃣ CLOUDFLARE TUNNEL SETUP (Public HTTPS Access)

### Install Cloudflared

```bash
# Download ARM64 binary
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb

# Install
sudo dpkg -i cloudflared.deb

# Verify
cloudflared --version
```

### Authenticate

```bash
# Login to Cloudflare
cloudflared tunnel login

# This opens browser - login to your Cloudflare account
# Select the domain you want to use
```

### Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create rpi5-feed

# Copy tunnel ID from output (save this!)
# Example: Tunnel credentials written to /home/pi/.cloudflared/<TUNNEL-ID>.json
```

### Configure DNS

```bash
# Route subdomain to tunnel
cloudflared tunnel route dns rpi5-feed rpi-feed.yourdomain.com

# Replace "yourdomain.com" with your actual domain
```

### Create Config File

```bash
# Create config directory
mkdir -p ~/.cloudflared

# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/pi/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: rpi-feed.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
EOF

# Replace <YOUR-TUNNEL-ID> and yourdomain.com
```

### Start Tunnel

```bash
# Test tunnel
cloudflared tunnel run rpi5-feed

# Expected: "Connection registered, connIndex=0"
# Test in browser: https://rpi-feed.yourdomain.com/api/health
```

### Setup Auto-Start

```bash
# Install as systemd service
sudo cloudflared service install

# Enable on boot
sudo systemctl enable cloudflared

# Start service
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

---

## 8️⃣ AUTO-START RPi SCRIPT ON BOOT

### Create Systemd Service

```bash
sudo nano /etc/systemd/system/rpi-multicam.service
```

Paste this content:

```ini
[Unit]
Description=RPi5 Multi-Camera Auto-Capture Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/automotive-vision
Environment="PATH=/home/pi/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/pi/venv/bin/python3 /home/pi/automotive-vision/rpi_multicam_agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Enable Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable rpi-multicam.service

# Start service
sudo systemctl start rpi-multicam.service

# Check status
sudo systemctl status rpi-multicam.service

# View logs
sudo journalctl -u rpi-multicam.service -f
```

---

## 9️⃣ MONITORING & MAINTENANCE

### Check System Resources

```bash
# Real-time monitoring
htop

# CPU temperature
vcgencmd measure_temp

# Memory usage
free -h

# Disk space
df -h
```

### View Logs

```bash
# RPi script logs
sudo journalctl -u rpi-multicam.service -f --since "5 minutes ago"

# Cloudflare tunnel logs
sudo journalctl -u cloudflared -f

# System logs
dmesg | tail -n 50
```

### Restart Services

```bash
# Restart RPi script
sudo systemctl restart rpi-multicam.service

# Restart tunnel
sudo systemctl restart cloudflared

# Reboot RPi
sudo reboot
```

---

## 🔧 TROUBLESHOOTING

### Camera Not Detected

```bash
# Check USB connections
lsusb

# Check video devices
ls -l /dev/video*

# Test camera manually
ffmpeg -f v4l2 -i /dev/video0 -frames 1 test.jpg
```

### Low FPS / Performance Issues

```bash
# Check CPU usage
htop

# Reduce YOLO resolution in script
# Edit: Config.YOLO_IMG_SIZE = 416  (instead of 640)

# Lower target FPS
# Edit: Config.TARGET_FPS = 8  (instead of 10)

# Disable auto-capture during testing
# Edit: Config.AUTO_CAPTURE_ENABLED = False
```

### Backend Connection Failed

```bash
# Test backend connectivity
curl -X GET https://your-backend.com/api/health

# Check network
ping -c 4 8.8.8.8

# Check DNS
nslookup your-backend.com

# View script logs for detailed errors
sudo journalctl -u rpi-multicam.service -n 100
```

### Models Not Loading

```bash
# Verify model files exist
ls -lh ~/automotive-vision/*.pt

# Test manual load
python3 -c "from ultralytics import YOLO; YOLO('best.pt')"

# Check disk space
df -h

# Re-download models if corrupted
# (use SCP or wget commands from step 5)
```

---

## 📊 VERIFICATION CHECKLIST

- [ ] All 4 cameras detected (`ls /dev/video*`)
- [ ] Both YOLO models load successfully
- [ ] Benchmark FPS ≥10
- [ ] Backend connectivity confirmed (`curl /api/health`)
- [ ] RPi script runs without errors
- [ ] Live feeds visible in frontend (all 4 stations)
- [ ] Auto-capture uploads to Supabase
- [ ] Cloudflare tunnel active (HTTPS access works)
- [ ] Services auto-start on boot
- [ ] CPU usage <80% during operation

---

## 🎯 FINAL NOTES

**Performance Optimization:**
- RPi5 with 8GB RAM handles 4 cameras comfortably at 640px
- If performance degrades, reduce `YOLO_IMG_SIZE` to 416px
- Use `htop` to monitor real-time CPU/memory usage

**Network Requirements:**
- Minimum 10 Mbps upload for 4 camera streams
- Stable connection required for Supabase uploads
- Local network latency should be <50ms to backend

**Security:**
- Always use HTTPS for backend communication
- Keep RPi OS updated: `sudo apt update && sudo apt upgrade`
- Change default SSH password after setup
- Consider firewall rules: `sudo ufw enable`

**Support:**
- View logs: `sudo journalctl -u rpi-multicam.service -f`
- Debug mode: Edit script `LOG_LEVEL = logging.DEBUG`
- Monitor temperature: `vcgencmd measure_temp` (keep <70°C)

---

**🚀 Your RPi5 multi-camera system is now production-ready!**
