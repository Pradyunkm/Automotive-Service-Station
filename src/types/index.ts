export interface Vehicle {
  id: string;
  car_number_plate: string;
  car_owner_name: string;
  car_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_date: string;
  scratches_count: number;
  dents_count: number;
  brake_wear_rate: number;
  brake_lifetime_days: number;
  brake_distance_mm?: number;  // VL53L0X sensor distance
  brake_wear_percent?: number;  // Calculated wear percentage
  crack_count: number;
  battery_level: number;
  drivable_range_km: number;
  vibration_level: string;
  service_status: string;
  total_cost: number;
  payment_status: string;
  created_at: string;
}

export interface InspectionImage {
  id: string;
  service_record_id: string;
  image_type: string;
  image_url: string;
  analysis_result: Record<string, unknown>;
  created_at: string;
}

export interface ServiceHistory {
  service_date: string;
  service_type: string;
  cost: number;
  status: string;
}
