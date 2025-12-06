/*
  # Smart Automated Car Service System Schema

  ## Overview
  Database schema for the automated car service station system that tracks vehicle inspections,
  diagnostics, and service history with real-time monitoring capabilities.

  ## New Tables
  
  ### `vehicles`
  - `id` (uuid, primary key) - Unique vehicle identifier
  - `car_number_plate` (text, unique) - Vehicle registration number
  - `car_owner_name` (text) - Owner's full name
  - `car_id` (text) - Internal car identification number
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `service_records`
  - `id` (uuid, primary key) - Unique service record identifier
  - `vehicle_id` (uuid, foreign key) - References vehicles table
  - `service_date` (timestamptz) - Service entry timestamp
  - `scratches_count` (integer) - Number of scratches detected
  - `dents_count` (integer) - Number of dents detected
  - `brake_wear_rate` (numeric) - Brake shoe wear percentage
  - `brake_lifetime_days` (integer) - Predicted brake lifetime in days
  - `crack_count` (integer) - Number of cracks in brake shoe
  - `battery_level` (numeric) - Battery percentage
  - `drivable_range_km` (numeric) - Estimated drivable range
  - `vibration_level` (text) - Vibration analysis result
  - `service_status` (text) - Current service status
  - `total_cost` (numeric) - Total service cost
  - `payment_status` (text) - Payment completion status
  - `created_at` (timestamptz) - Record creation timestamp

  ### `inspection_images`
  - `id` (uuid, primary key) - Unique image identifier
  - `service_record_id` (uuid, foreign key) - References service_records
  - `image_type` (text) - Type of inspection image
  - `image_url` (text) - URL or path to stored image
  - `analysis_result` (jsonb) - JSON data with analysis results
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
  - Public read access for service center staff

  ## Notes
  - All timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
  - JSONB used for flexible analysis result storage
*/

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS inspection_images CASCADE;
DROP TABLE IF EXISTS service_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Create vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_number_plate text UNIQUE NOT NULL,
  car_owner_name text NOT NULL,
  car_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_records table
CREATE TABLE service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date timestamptz DEFAULT now(),
  scratches_count integer DEFAULT 0,
  dents_count integer DEFAULT 0,
  brake_wear_rate numeric(5,2) DEFAULT 0,
  brake_lifetime_days integer DEFAULT 0,
  crack_count integer DEFAULT 0,
  battery_level numeric(5,2) DEFAULT 0,
  drivable_range_km numeric(8,2) DEFAULT 0,
  vibration_level text DEFAULT 'Normal',
  service_status text DEFAULT 'In Progress',
  total_cost numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);

-- Create inspection_images table
CREATE TABLE inspection_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id uuid NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  image_type text NOT NULL,
  image_url text NOT NULL,
  analysis_result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vehicles"
  ON vehicles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to service records"
  ON service_records FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to service records"
  ON service_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to service records"
  ON service_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to inspection images"
  ON inspection_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to inspection images"
  ON inspection_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspection_images_service_record_id ON inspection_images(service_record_id);