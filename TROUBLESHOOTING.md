# Arduino Sensor Data Troubleshooting Guide

## Problem: Sensor data from Arduino IDE is not updating on the website

---

## 🔍 **Step-by-Step Troubleshooting**

### **Step 1: Verify Arduino Connection**

1. **Check COM Port:**
   - Open Arduino IDE
   - Go to `Tools > Port`
   - Note which COM port your Arduino is connected to (e.g., COM3, COM4, COM5)

2. **Update Backend Configuration:**
   - Open `api.py`
   - Find line 275: `SERIAL_PORT = "COM3"`
   - Change `"COM3"` to match your Arduino's COM port
   - Example: If Arduino is on COM5, change to `SERIAL_PORT = "COM5"`

3. **Test Arduino Output:**
   - Upload the Arduino sketch (arduino_sensor_sketch.ino)
   - Open Serial Monitor in Arduino IDE (Tools > Serial Monitor)
   - Set baud rate to **9600**
   - You should see data being printed every second like:
     ```
     {"rpm": 1234, "battery": 85.5, "voltage": 12.6, "vibration": "NORMAL", "range": 256.5}
     ```

---

### **Step 2: Verify Python Backend is Running**

1. **Start the Backend:**
   ```bash
   python api.py
   ```

2. **Check Console Output:**
   You should see:
   ```
   ⏳ Loading Models...
   ✅ Models Loaded
   🔌 Attempting to connect to Arduino on COM3...
   ✅ Serial Connected on COM3
   📥 Arduino: {"rpm": 1234, "battery": 85.5, ...}
   🔄 Updating Sensors for 455e445f-c11b-4db7-8c78-e62f8df86614: {...}
   ```

3. **If you see "❌ Serial Connection Failed":**
   - The COM port is wrong → Update `SERIAL_PORT` in api.py
   - Arduino is not connected → Check USB cable
   - Arduino sketch not uploaded → Upload the sketch

---

### **Step 3: Verify Service Record ID**

The backend uses a default service record ID: `455e445f-c11b-4db7-8c78-e62f8df86614`

**Option A: Create a matching record in Supabase**
1. Go to Supabase Dashboard
2. Navigate to the `service_records` table
3. Insert a new row with this exact ID

**Option B: Use an existing service record**
1. Start a service session from your website
2. Note the service_record_id from the console
3. The backend will automatically use the active service ID

---

### **Step 4: Verify Supabase Connection**

1. **Check .env file:**
   Open `.env` and verify:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Test Database Connection:**
   - The backend console should show:
     ```
     🔄 Updating Sensors for [ID]: {...}
     ```
   - If you see database errors, check your Supabase credentials

---

### **Step 5: Verify Frontend Connection**

1. **Open Browser Console:**
   - Press F12 in your browser
   - Go to Console tab

2. **Look for these logs:**
   ```
   📊 Data fetched: {...}
   🔴 Real-time update received: {...}
   🔴 Real-time subscription status: SUBSCRIBED
   ```

3. **Check Network Tab:**
   - Should see requests to Supabase
   - Should see "LIVE DATA CONNECTED" badge on the website

---

## 🚀 **Quick Fix Commands**

### **If Arduino data is not being sent:**
1. Open Arduino IDE
2. Upload `arduino_sensor_sketch.ino`
3. Open Serial Monitor (Ctrl+Shift+M)
4. Set baud rate to 9600
5. Verify data is printing

### **If Backend is not receiving data:**
```bash
# Stop the current backend (Ctrl+C)
# Edit api.py line 275 to match your COM port
# Restart the backend
python api.py
```

### **If Website is not updating:**
```bash
# Check if backend is running
# Check browser console for errors
# Verify "LIVE DATA CONNECTED" badge appears
# Try refreshing the page
```

---

## 🐛 **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| `❌ Serial Connection Failed` | Wrong COM port or Arduino not connected | Update `SERIAL_PORT` in api.py |
| `⚠️ Parse/Update Error` | Invalid data format from Arduino | Check Arduino sketch is sending correct format |
| `Error updating sensor data` | Supabase connection issue | Check .env file and Supabase credentials |
| No "LIVE DATA CONNECTED" badge | Frontend not subscribed to Supabase | Check browser console for subscription errors |

---

## 📊 **Data Flow Diagram**

```
┌─────────────┐     Serial      ┌──────────────┐     Supabase     ┌──────────┐
│   Arduino   │  ────────────>  │   Python     │  ─────────────>  │ Database │
│   (COM3)    │   (9600 baud)   │   Backend    │   (REST API)     │          │
└─────────────┘                 └──────────────┘                  └──────────┘
                                                                         │
                                                                         │ Real-time
                                                                         │ Subscription
                                                                         ▼
                                                                  ┌──────────┐
                                                                  │ Frontend │
                                                                  │ (React)  │
                                                                  └──────────┘
```

---

## ✅ **Checklist**

- [ ] Arduino sketch uploaded
- [ ] Serial Monitor shows data being sent
- [ ] COM port in api.py matches Arduino
- [ ] Python backend is running
- [ ] Backend console shows "Serial Connected"
- [ ] Backend console shows "Updating Sensors"
- [ ] .env file has correct Supabase credentials
- [ ] Website shows "LIVE DATA CONNECTED" badge
- [ ] Browser console shows real-time updates

---

## 🔧 **Need More Help?**

If you're still experiencing issues:

1. **Share Backend Console Output:**
   - Run `python api.py`
   - Copy the entire console output

2. **Share Browser Console Output:**
   - Press F12
   - Go to Console tab
   - Copy any errors or logs

3. **Share Arduino Serial Monitor Output:**
   - Open Arduino IDE Serial Monitor
   - Copy a few lines of output

This will help identify exactly where the data flow is breaking.
