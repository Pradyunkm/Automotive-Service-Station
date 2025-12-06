# ⚡ ESP32 WiFi Setup - COMPLETE GUIDE

## 🎯 **What You Have:**
- **ESP32** (not regular Arduino)
- **WiFi enabled** 
- Sends data **directly to Supabase** over WiFi
- **NO USB/Serial connection needed** for data transfer

---

## ❌ **The Problem:**

Your ESP32 was posting to the WRONG Supabase table:
```cpp
// ❌ WRONG - This table doesn't exist
String supabaseUrl = ".../rest/v1/sensor_data";
```

It should be:
```cpp
// ✅ CORRECT - This is your actual table
String supabaseUrl = ".../rest/v1/service_records";
```

And it was using **POST** (create new record) instead of **PATCH** (update existing record).

---

## ✅ **The Solution:**

I created a **fixed ESP32 sketch**: `ESP32_WiFi_Sensor.ino`

### **Key Changes:**

1. **Correct Table:** Posts to `service_records` (not `sensor_data`)
2. **Update Method:** Uses `PATCH` to update existing record (not `POST`)
3. **Correct ID:** Updates record `455e445f-c11b-4db7-8c78-e62f8df86614`
4. **Field Names:** Matches database columns exactly:
   - `rpm` → `rpm`
   - `vibration_level` → `vibration_level`
   - `voltage` → `voltage`
   - `battery_level` → `battery_level`
   - `battery_percent` → `battery_percent`
   - `drivable_range_km` → `drivable_range_km`
   - `temperature` → `temperature`

---

## 📋 **Setup Steps:**

### **1. Upload the Fixed Sketch**
1. Open Arduino IDE
2. Open file: `ESP32_WiFi_Sensor.ino`
3. Make sure **ESP32 board** is selected (Tools > Board)
4. Upload to your ESP32

### **2. Check Serial Monitor**
1. Open Serial Monitor (Tools > Serial Monitor)
2. Set baud rate to **115200**
3. You should see:
   ```
   ✅ WiFi Connected!
   📍 IP Address: 192.168.x.x
   
   🔧 RPM: 4440 RPM
   📳 Vibration: HIGH
   ⚡ Battery Voltage: 11.04 V
   🔋 Battery Level: 3%
   📍 Range: 9.37 km
   🌡️  Temperature: 28.2°C
   
   📤 Sending to Supabase: {...}
   📡 Response Code: 204
   ✅ Update successful!
   ```

### **3. Stop the Python Backend Serial Worker**
Since you're using ESP32 with WiFi, you **don't need** the Python serial worker!

**Option A: Keep backend running but ignore serial errors**
- The backend will keep trying to connect to COM5
- This is harmless - it just won't find anything
- The web API will still work for image analysis

**Option B: Run backend with uvicorn (no serial worker)**
```bash
# Stop current backend (Ctrl+C)
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔍 **How Data Flows (ESP32 WiFi Setup):**

```
ESP32 (WiFi)
    ↓ HTTP POST via WiFi
Supabase Database (service_records table)
    ↓ Real-time subscription
React Frontend
    ✅ Displays live RPM, battery, etc.
```

**Note:** Data goes **directly** from ESP32 to Supabase. The Python backend is NOT involved in sensor data (only used for image analysis).

---

## ✅ **Verification Checklist:**

### ESP32 Serial Monitor:
- [ ] WiFi connected message
- [ ] IP address shown
- [ ] Sensor readings printing every 2 seconds
- [ ] "Response Code: 204" (success)
- [ ] "✅ Update successful!" message

### Website:
- [ ] Green "LIVE DATA CONNECTED" badge
- [ ] RPM updates every 2 seconds
- [ ] Battery gauge animates
- [ ] Vibration status changes
- [ ] All values match ESP32 Serial Monitor

### Browser Console (F12):
- [ ] "📊 Data fetched: {...}" messages
- [ ] "🔴 Real-time update received" messages
- [ ] No Supabase errors

---

## 🚨 **Common Issues & Fixes:**

### Issue: "Response Code: 401" (Unauthorized)
**Fix:** Check that your Supabase key is correct in the sketch

### Issue: "Response Code: 404" (Not Found)
**Fix:** The service_record_id doesn't exist in database
- Create a service record with ID: `455e445f-c11b-4db7-8c78-e62f8df86614`
- Or start a new service from the website and update the ID in the sketch

### Issue: "Response Code: 406" (Not Acceptable)
**Fix:** Remove or fix the `Prefer` header

### Issue: WiFi keeps disconnecting
**Fix:** 
- Check WiFi signal strength
- Add `WiFi.setAutoReconnect(true);` in setup()
- The sketch already tries to reconnect automatically

### Issue: Data not updating on website
**Fix:**
- Check ESP32 Serial Monitor shows "✅ Update successful!"
- Open browser console (F12) and check for real-time updates
- Verify the service_record_id matches in both ESP32 and frontend

---

## 📝 **Important Configuration:**

### WiFi Credentials (in ESP32 sketch):
```cpp
const char* ssid = "AK";              // Your WiFi name
const char* password = "abishek000";   // Your WiFi password
```

### Supabase URL (in ESP32 sketch):
```cpp
String supabaseUrl = "https://aqeolcjdbkjxfoanfgsa.supabase.co/rest/v1/service_records";
```

### Service Record ID (in ESP32 sketch):
```cpp
String serviceRecordId = "455e445f-c11b-4db7-8c78-e62f8df86614";
```
**Note:** This ID must exist in your `service_records` table!

---

## 🎉 **Expected Result:**

After uploading the fixed sketch:

1. ESP32 connects to WiFi ✅
2. ESP32 sends sensor data to Supabase every 2 seconds ✅
3. Supabase updates the `service_records` table ✅
4. Frontend receives real-time updates via subscription ✅
5. Website shows live RPM, battery, vibration, etc. ✅

**Your sensor data should now update live on the website!** 🚀

---

## 💡 **Additional Notes:**

- You can change the update interval by modifying `delay(2000)` at the end of `loop()`
- The ESP32 does NOT need to be connected to your computer for this to work (just needs power and WiFi)
- You can monitor data by opening Serial Monitor while ESP32 is connected via USB
- The Python backend serial worker can be safely ignored (it's looking for a non-existent serial Arduino)

---

## 🆘 **Still Having Issues?**

Share the **ESP32 Serial Monitor output** showing:
1. WiFi connection status
2. Sensor readings
3. Supabase response codes
4. Any error messages
