import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SensorData {
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
  battery_percent: number;
  drivable_range_km: number;
  vibration_level: string;
  rpm: number;
  voltage: number;
  temperature: number;
  service_status: string;
  total_cost: number;
  payment_status: string;
  created_at: string;
}

export function useSensorData(serviceRecordId: string | null) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceRecordId) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    // Fetch data function
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('service_records')
          .select('*')
          .eq('id', serviceRecordId)
          .single();

        if (error) throw error;

        if (data && isSubscribed) {
          console.log('📊 Data fetched:', data);
          setSensorData(data as SensorData);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Polling fallback - fetch every 2 seconds
    const pollingInterval = setInterval(() => {
      fetchData();
    }, 2000);

    // Subscribe to real-time updates
    const channel: RealtimeChannel = supabase
      .channel(`service-record-${serviceRecordId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_records',
          filter: `id=eq.${serviceRecordId}`
        },
        (payload) => {
          console.log('🔴 Real-time update received:', payload);
          if (payload.new && isSubscribed) {
            setSensorData(payload.new as SensorData);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Real-time subscription status:', status);
      });

    return () => {
      isSubscribed = false;
      clearInterval(pollingInterval);
      console.log('🔴 Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [serviceRecordId]);

  return { sensorData, loading, error };
}
