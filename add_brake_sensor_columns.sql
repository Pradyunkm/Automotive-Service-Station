-- Add VL53L0X Brake Sensor Columns to service_records table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE service_records 
ADD COLUMN IF NOT EXISTS brake_distance_mm DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS brake_wear_percent DECIMAL(5,2) DEFAULT 0;

-- Add comments to the columns
COMMENT ON COLUMN service_records.brake_distance_mm IS 'Distance from VL53L0X sensor to brake pad in millimeters';
COMMENT ON COLUMN service_records.brake_wear_percent IS 'Calculated brake wear percentage (0-100) based on distance measurement';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'service_records' 
AND column_name IN ('brake_distance_mm', 'brake_wear_percent');
