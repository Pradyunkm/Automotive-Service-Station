import { supabase } from './supabase';

export interface SensorUpdateData {
  battery_level?: number;
  battery_percent?: number;
  drivable_range_km?: number;
  vibration_level?: string;
  rpm?: number;
  voltage?: number;
  brake_wear_rate?: number;
  brake_lifetime_days?: number;
  scratches_count?: number;
  dents_count?: number;
  crack_count?: number;
  service_status?: string;
  total_cost?: number;
  payment_status?: string;
}

export async function updateSensorData(
  serviceRecordId: string,
  sensorData: SensorUpdateData
) {
  const { data, error } = await supabase
    .from('service_records')
    .update(sensorData)
    .eq('id', serviceRecordId)
    .select()
    .single();

  if (error) {
    console.error('Error updating sensor data:', error);
    throw error;
  }

  return data;
}

export async function createVehicle(
  carNumberPlate: string,
  carOwnerName: string,
  carId: string
) {
  // Check if vehicle exists
  const { data: existing } = await supabase
    .from('vehicles')
    .select('*')
    .eq('car_number_plate', carNumberPlate)
    .single();

  if (existing) {
    return existing;
  }

  // Create new vehicle
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      car_number_plate: carNumberPlate,
      car_owner_name: carOwnerName,
      car_id: carId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }

  return data;
}

export async function createServiceRecord(vehicleId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .insert({
      vehicle_id: vehicleId,
      service_status: 'In Progress',
      payment_status: 'Pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service record:', error);
    throw error;
  }

  return data;
}

export async function getLatestServiceRecord(vehicleId: string) {
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching service record:', error);
    throw error;
  }

  return data;
}
