# 🔧 Quick Fix Guide: Arduino Sensor Data Not Updating

## ⚡ **MOST COMMON ISSUE: Wrong COM Port**

### **Step 1: Find Your Arduino COM Port**

**Method 1: Using Arduino IDE**
1. Open Arduino IDE
2. Click `Tools > Port`
3. You'll see something like:
   - `COM3 (Arduino Uno)` ✅ Use COM3
   - `COM5 (USB-SERIAL CH340)` ✅ Use COM5

**Method 2: Using Device Manager (Windows)**
1. Press `Windows + X`
2. Select "Device Manager"
3. Expand "Ports (COM & LPT)"
4. Look for "Arduino" or "USB Serial Device"
5. Note the COM number (e.g., COM3, COM4, etc.)

---

### **Step 2: Update api.py**

1. Open `api.py`
2. Go to **line 275**
3. Change:
   ```python
   SERIAL_PORT = "COM3"  # ← Change this to match your Arduino port
   ```
4. Example: If your Arduino is on COM5:
   ```python
   SERIAL_PORT = "COM5"
   ```
5. Save the file

---

### **Step 3: Upload Arduino Sketch**

1. Open Arduino IDE
2. Open file: `arduino_sensor_sketch/arduino_sensor_sketch.ino`
3. Select your Arduino: `Tools > Board > Arduino Uno` (or your model)
4. Select your Port: `Tools > Port > COM5` (your detected port)
5. Click **Upload** (arrow button)
6. Wait for "Done uploading" message

---

### **Step 4: Test Arduino Output**

1. In Arduino IDE, click `Tools > Serial Monitor`
2. Set baud rate to **9600** (bottom-right dropdown)
3. You should see data like this every second:
   ```json
   {"rpm": 1234, "battery": 85.5, "voltage": 12.6, "vibration": "NORMAL", "range": 256.5}
   ```

**If you DON'T see data:**
- Click the RESET button on your Arduino
- Check the baud rate is 9600
- Re-upload the sketch

---

### **Step 5: Start Python Backend**

1. Open a terminal/command prompt
2. Navigate to project folder:
   ```bash
   cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"
   ```
3. Run the backend:
   ```bash
   python api.py
   ```

**Expected Output:**
```
⏳ Loading Models...
✅ Models Loaded
🔌 Attempting to connect to Arduino on COM5...
✅ Serial Connected on COM5
📥 Arduino: {"rpm": 1234, "battery": 85.5, ...}
🔄 Updating Sensors for 455e445f-c11b-4db7-8c78-e62f8df86614: {...}
🚀 Starting Server...
```

**If you see "❌ Serial Connection Failed":**
- Arduino is not connected → Check USB cable
- Wrong COM port → Update `SERIAL_PORT` in api.py
- Arduino sketch not running → Re-upload the sketch
- Port in use → Close Arduino IDE Serial Monitor

---

### **Step 6: Check Website**

1. Open your website in a browser
2. You should see a **green "LIVE DATA CONNECTED"** badge
3. The sensor values (RPM, Battery, Voltage) should update every 1-2 seconds

**If website is not updating:**
- Press `F12` to open browser console
- Check for errors
- Refresh the page
- Make sure the backend is running

---

## 🎯 **The 3 Things That MUST Be Running:**

| Component | How to Check | Status |
|-----------|-------------|--------|
| **1. Arduino** | Serial Monitor shows data every second | ⬜ |
| **2. Python Backend** | Console shows "Serial Connected" and "Updating Sensors" | ⬜ |
| **3. Website** | Shows "LIVE DATA CONNECTED" badge | ⬜ |

---

## ❌ **Common Errors & Fixes**

### Error: "Serial Connection Failed"
**Cause:** Wrong COM port or Arduino not connected  
**Fix:** Update `SERIAL_PORT` in api.py to match your Arduino's port

### Error: "Parse/Update Error"
**Cause:** Arduino sending wrong format  
**Fix:** Re-upload `arduino_sensor_sketch.ino`

### Error: No "LIVE DATA CONNECTED" badge
**Cause:** Backend not running or Supabase issue  
**Fix:** 
1. Check backend is running: `python api.py`
2. Check `.env` file has correct Supabase credentials

### Error: "Port already in use"
**Cause:** Arduino IDE Serial Monitor is open  
**Fix:** Close Serial Monitor before running `python api.py`

---

## 🧪 **Testing Without Physical Sensors**

If you don't have physical sensors connected to Arduino, use TEST MODE:

1. Open `arduino_sensor_sketch.ino`
2. Scroll to the bottom
3. **UNCOMMENT** the test mode section (lines 143-161)
4. **COMMENT OUT** the regular loop function (lines 56-68)
5. Upload to Arduino

This will send random simulated sensor data for testing.

---

## 📸 **What Success Looks Like**

### Arduino IDE Serial Monitor:
```
{"rpm": 1523, "battery": 87.2, "voltage": 12.58, "vibration": "NORMAL", "range": 261.6}
{"rpm": 1487, "battery": 86.9, "voltage": 12.61, "vibration": "NORMAL", "range": 260.7}
{"rpm": 1502, "battery": 87.0, "voltage": 12.59, "vibration": "NORMAL", "range": 261.0}
```

### Python Backend Console:
```
✅ Serial Connected on COM5
📥 Arduino: {"rpm": 1523, "battery": 87.2, ...}
🔄 Updating Sensors for 455e445f-c11b-4db7-8c78-e62f8df86614
```

### Website:
- Green "LIVE DATA CONNECTED" badge visible
- RPM counter updating
- Battery gauge animating
- Vibration status changing

---

## 🆘 **Still Not Working?**

Run the diagnostic script:
```bash
python detect_arduino_port.py
```

This will:
- Show all available COM ports
- Detect which one is likely your Arduino
- Test the connection
- Tell you exactly what to update in api.py

---

## 📞 **Need More Help?**

Check the full troubleshooting guide: `TROUBLESHOOTING.md`
