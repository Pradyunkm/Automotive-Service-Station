"""
Supabase Client for Python Backend
Handles real-time sensor data updates to Supabase database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Dict, Optional, Any
from datetime import datetime

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_vehicle(car_number_plate: str, car_owner_name: str, car_id: str) -> Dict:
    """Create or get a vehicle record"""
    try:
        # Check if vehicle exists
        response = supabase.table("vehicles").select("*").eq("car_number_plate", car_number_plate).execute()
        
        if response.data:
            return response.data[0]
        
        # Create new vehicle
        data = {
            "car_number_plate": car_number_plate,
            "car_owner_name": car_owner_name,
            "car_id": car_id
        }
        response = supabase.table("vehicles").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error creating vehicle: {e}")
        return None


def create_service_record(vehicle_id: str) -> Optional[str]:
    """Create a new service record and return its ID"""
    try:
        data = {
            "vehicle_id": vehicle_id,
            "service_date": datetime.now().isoformat(),
            "service_status": "In Progress",
            "payment_status": "Pending"
        }
        response = supabase.table("service_records").insert(data).execute()
        return response.data[0]["id"] if response.data else None
    except Exception as e:
        print(f"Error creating service record: {e}")
        return None


def update_sensor_data(
    service_record_id: str,
    scratches_count: Optional[int] = None,
    dents_count: Optional[int] = None,
    crack_count: Optional[int] = None,
    brake_wear_rate: Optional[float] = None,
    brake_lifetime_days: Optional[int] = None,
    battery_level: Optional[float] = None,
    battery_percent: Optional[float] = None,
    drivable_range_km: Optional[float] = None,
    vibration_level: Optional[str] = None,
    rpm: Optional[int] = None,
    voltage: Optional[float] = None,
) -> bool:
    """Update sensor data for a service record in real-time"""
    try:
        # Build update data (only include non-None values)
        update_data = {}
        
        if scratches_count is not None:
            update_data["scratches_count"] = scratches_count
        if dents_count is not None:
            update_data["dents_count"] = dents_count
        if crack_count is not None:
            update_data["crack_count"] = crack_count
        if brake_wear_rate is not None:
            update_data["brake_wear_rate"] = brake_wear_rate
        if brake_lifetime_days is not None:
            update_data["brake_lifetime_days"] = brake_lifetime_days
        if battery_level is not None:
            update_data["battery_level"] = battery_level
        if battery_percent is not None:
            update_data["battery_percent"] = battery_percent
        if drivable_range_km is not None:
            update_data["drivable_range_km"] = drivable_range_km
        if vibration_level is not None:
            update_data["vibration_level"] = vibration_level
        if rpm is not None:
            update_data["rpm"] = rpm
        if voltage is not None:
            update_data["voltage"] = voltage
        
        if not update_data:
            return False
        
        response = supabase.table("service_records").update(update_data).eq("id", service_record_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error updating sensor data: {e}")
        return False


def get_latest_service_record(vehicle_id: str) -> Optional[Dict]:
    """Get the latest service record for a vehicle"""
    try:
        response = (
            supabase.table("service_records")
            .select("*")
            .eq("vehicle_id", vehicle_id)
            .order("service_date", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error getting latest service record: {e}")
        return None


def complete_service(service_record_id: str, total_cost: float) -> bool:
    """Mark a service as completed"""
    try:
        update_data = {
            "service_status": "Completed",
            "total_cost": total_cost,
            "payment_status": "Pending"
        }
        response = supabase.table("service_records").update(update_data).eq("id", service_record_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error completing service: {e}")
        return False


def update_payment_status(service_record_id: str, status: str) -> bool:
    """Update payment status (Pending/Paid)"""
    try:
        response = (
            supabase.table("service_records")
            .update({"payment_status": status})
            .eq("id", service_record_id)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        print(f"Error updating payment status: {e}")
        return False


def upload_image(file_bytes: bytes, file_name: str, bucket_name: str = "images") -> Optional[str]:
    """Upload an image to Supabase Storage and return its public URL"""
    try:
        print(f"🔵 Attempting to upload image: {file_name} to bucket: {bucket_name}")
        # Upload file
        response = supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        
        print(f"✅ Upload response: {response}")
        
        # Get public URL
        if response:
            url = get_public_url(file_name, bucket_name)
            print(f"✅ Image uploaded successfully! URL: {url}")
            return url
        return None
    except Exception as e:
        print(f"❌ Error uploading image: {e}")
        import traceback
        traceback.print_exc()
        return None


def upload_sensor_data(sensor_data: Dict, file_name: str, bucket_name: str = "sensor-data") -> Optional[str]:
    """Upload sensor data as JSON to Supabase Storage and return its public URL"""
    try:
        import json
        print(f"🔵 Attempting to upload sensor data: {file_name} to bucket: {bucket_name}")
        print(f"📊 Sensor data: {sensor_data}")
        
        # Convert sensor data to JSON bytes
        json_bytes = json.dumps(sensor_data, indent=2).encode('utf-8')
        
        # Upload file
        response = supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=json_bytes,
            file_options={"content-type": "application/json"}
        )
        
        print(f"✅ Upload response: {response}")
        
        # Get public URL
        if response:
            url = get_public_url(file_name, bucket_name)
            print(f"✅ Sensor data uploaded successfully! URL: {url}")
            return url
        return None
    except Exception as e:
        print(f"❌ Error uploading sensor data: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_public_url(path: str, bucket_name: str = "images") -> str:
    """Get public URL for a file in storage"""
    try:
        return supabase.storage.from_(bucket_name).get_public_url(path)
    except Exception as e:
        print(f"Error getting public URL: {e}")
        return ""
