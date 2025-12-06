#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "DHT.h"

// =====================================================================
// PIN SETTINGS
// =====================================================================
#define IR_PIN 21          // RPM IR sensor
#define VIB_PIN 34         // Vibration digital output
#define ADC_PIN 35         // Battery ADC
#define DHTPIN 4           // DHT22 Sensor
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// =====================================================================
// RPM SETTINGS
// =====================================================================
volatile unsigned long pulseCount = 0;
unsigned long lastSampleTime = 0;
const unsigned long sampleMs = 1000;
int pulsesPerRevolution = 1;

void IRAM_ATTR pulseISR() {
  pulseCount++;
}

// =====================================================================
// BATTERY SETTINGS
// =====================================================================
float R1 = 15000.0;   // 15k ohm
float R2 = 3300.0;    // 3.3k ohm
float FULL_BAT = 12.6;
float EMPTY_BAT = 11.0;

// =====================================================================
// WIFI & SUPABASE CONFIG
// =====================================================================
const char* ssid = "AK";
const char* password = "abishek000";

// ✅ CORRECT: Post to service_records table
String supabaseUrl = "https://aqeolcjdbkjxfoanfgsa.supabase.co/rest/v1/service_records";

// 🔑 Your Supabase anon key
String supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZW9sY2pkYmtqeGZvYW5mZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDUyMDQsImV4cCI6MjA3ODI4MTIwNH0.ZW6oo-SL4etQdlqSbgt-RTGg0BNsYAS6xiQPIgg5NDs";

// 🆔 The service record ID to update (matches frontend default)
String serviceRecordId = "455e445f-c11b-4db7-8c78-e62f8df86614";

// =====================================================================
void setup() {
  Serial.begin(115200);

  // RPM interrupt
  pinMode(IR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(IR_PIN), pulseISR, RISING);

  // Vibration
  pinMode(VIB_PIN, INPUT);

  // ADC
  analogReadResolution(12);

  // DHT
  dht.begin();

  // WiFi
  Serial.println("\n🔌 Connecting to WiFi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
  }
}

// =====================================================================
void loop() {
  unsigned long now = millis();
  float rpm = 0;

  // ---------------- RPM Calculation ----------------
  if (now - lastSampleTime >= sampleMs) {
    noInterrupts();
    unsigned long pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    rpm = (float)pulses * 60.0;  // pulses per second → RPM

    lastSampleTime = now;
  }

  // ---------------- Vibration ----------------
  int vibValue = digitalRead(VIB_PIN);
  String vibrationStatus;
  
  if (vibValue == HIGH) {
    vibrationStatus = "HIGH";
  } else if (rpm > 2000) {
    vibrationStatus = "MODERATE";
  } else {
    vibrationStatus = "NORMAL";
  }

  // ---------------- Battery Voltage ----------------
  int adcValue = analogRead(ADC_PIN);
  float adcVoltage = (adcValue / 4095.0) * 3.3;
  float batteryVoltage = adcVoltage * ((R1 + R2) / R2);

  float batteryPercent = ((batteryVoltage - EMPTY_BAT) / (FULL_BAT - EMPTY_BAT)) * 100.0;
  batteryPercent = constrain(batteryPercent, 0, 100);

  // Estimate range based on battery
  float drivableRange = (batteryPercent / 100.0) * 300.0; // Assuming 300km max range

  // ---------------- Temperature ----------------
  float tempC = dht.readTemperature();
  if (isnan(tempC)) tempC = 28.0; // Default value

  // ---------------- Print to Serial ----------------
  Serial.println("================================================");
  Serial.printf("🔧 RPM: %.0f RPM\n", rpm);
  Serial.printf("📳 Vibration: %s\n", vibrationStatus.c_str());
  Serial.printf("⚡ Battery Voltage: %.2f V\n", batteryVoltage);
  Serial.printf("🔋 Battery Level: %.0f%%\n", batteryPercent);
  Serial.printf("💚 Battery Health: %.1f%%\n", batteryPercent);
  Serial.printf("📍 Range: %.2f km\n", drivableRange);
  Serial.printf("🌡️  Temperature: %.1f°C\n", tempC);

  // ---------------- Send to Supabase ----------------
  if (WiFi.status() == WL_CONNECTED) {
    // Create WiFiClientSecure for HTTPS
    WiFiClientSecure *client = new WiFiClientSecure;
    
    if (client) {
      // Disable SSL certificate verification (simplest approach)
      client->setInsecure();
      
      HTTPClient http;
      
      // Build URL with query parameter to update specific record
      String updateUrl = supabaseUrl + "?id=eq." + serviceRecordId;
      
      // Begin HTTPS connection with secure client
      http.begin(*client, updateUrl);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("apikey", supabaseKey);
      http.addHeader("Authorization", "Bearer " + supabaseKey);
      http.addHeader("Prefer", "return=minimal");

      // Create JSON with correct field names matching database
      StaticJsonDocument<500> doc;
      doc["rpm"] = (int)rpm;
      doc["vibration_level"] = vibrationStatus;
      doc["voltage"] = batteryVoltage;
      doc["battery_level"] = batteryPercent;
      doc["battery_percent"] = batteryPercent;
      doc["drivable_range_km"] = drivableRange;
      doc["temperature"] = tempC;

      String json;
      serializeJson(doc, json);

      Serial.println("\n📤 Sending to Supabase: " + json);

      // Use PATCH to update existing record
      int response = http.PATCH(json);
      
      Serial.print("📡 Response Code: ");
      Serial.println(response);
      
      if (response == 200 || response == 204) {
        Serial.println("✅ Update successful!");
      } else if (response > 0) {
        String payload = http.getString();
        Serial.println("❌ Update failed!");
        Serial.println("Response: " + payload);
      } else {
        Serial.printf("❌ HTTP Error: %s\n", http.errorToString(response).c_str());
      }

      http.end();
      delete client;
    }
  } else {
    Serial.println("❌ WiFi not connected!");
    // Try to reconnect
    WiFi.reconnect();
  }

  Serial.println("================================================\n");
  delay(2000);  // Send updates every 2 seconds
}
