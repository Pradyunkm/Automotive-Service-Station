import { useSensorData } from '../hooks/useSensorData';

export function RealtimeDebugger() {
  const { sensorData, loading, error } = useSensorData('455e445f-c11b-4db7-8c78-e62f8df86614');

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-md text-xs font-mono">
      <div className="font-bold mb-2">🔴 Real-time Debug</div>
      
      <div className="space-y-1">
        <div>Status: {loading ? '⏳ Loading...' : error ? '❌ Error' : '✅ Connected'}</div>
        {error && <div className="text-red-400">Error: {error}</div>}
        
        {sensorData && (
          <div className="mt-2 space-y-1 border-t border-gray-700 pt-2">
            <div>RPM: {sensorData.rpm}</div>
            <div>Battery: {sensorData.battery_level?.toFixed(1)}%</div>
            <div>Voltage: {sensorData.voltage?.toFixed(2)}V</div>
            <div>Range: {sensorData.drivable_range_km?.toFixed(1)} km</div>
            <div>Vibration: {sensorData.vibration_level}</div>
            <div className="text-gray-400 text-[10px] mt-1">
              Last: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
        
        {!sensorData && !loading && (
          <div className="text-yellow-400 mt-2">No data received yet</div>
        )}
      </div>
    </div>
  );
}
