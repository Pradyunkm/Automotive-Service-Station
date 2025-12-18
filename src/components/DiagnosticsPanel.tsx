import { Battery, Gauge, Activity, AlertTriangle, Zap, TrendingUp, Save, CheckCircle } from 'lucide-react';
import { useSensorData } from '../hooks/useSensorData';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_CONFIG } from '../config/api.config';

interface DiagnosticsData {
  batteryLevel: number;
  drivableRange: number;
  vibrationLevel: string;
  brakeWearRate: number;
  brakeLifetimeDays: number;
}

interface DiagnosticsPanelProps {
  data: DiagnosticsData;
  serviceRecordId?: string;
  onDataUpdate?: (data: DiagnosticsData) => void;
}

interface TelemetryDataPoint {
  time: string;
  rpm: number;
  load: number;
}

export function DiagnosticsPanel({ data, serviceRecordId = '455e445f-c11b-4db7-8c78-e62f8df86614', onDataUpdate }: DiagnosticsPanelProps) {
  // Get real-time sensor data from Supabase
  const { sensorData } = useSensorData(serviceRecordId);

  // Store telemetry data for chart
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>([]);
  const telemetryRef = useRef<TelemetryDataPoint[]>([]);
  const maxTelemetryPoints = 15;

  // Store latest callback in ref to avoid dependency issues
  const onDataUpdateRef = useRef(onDataUpdate);
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  // Update parent component when real-time data arrives
  useEffect(() => {
    if (sensorData && onDataUpdateRef.current) {
      onDataUpdateRef.current({
        batteryLevel: sensorData.battery_level || data.batteryLevel,
        drivableRange: sensorData.drivable_range_km || data.drivableRange,
        vibrationLevel: sensorData.vibration_level || data.vibrationLevel,
        // Prioritize new brake_wear_percent from VL53L0X sensor
        brakeWearRate: sensorData.brake_wear_percent ?? sensorData.brake_wear_rate ?? data.brakeWearRate,
        brakeLifetimeDays: sensorData.brake_lifetime_days || data.brakeLifetimeDays,
      });
    }
  }, [sensorData, data.batteryLevel, data.drivableRange, data.vibrationLevel, data.brakeWearRate, data.brakeLifetimeDays]);

  // Use real-time data if available, otherwise use props
  const displayData = sensorData ? {
    batteryLevel: sensorData.battery_level || data.batteryLevel,
    drivableRange: sensorData.drivable_range_km || data.drivableRange,
    vibrationLevel: sensorData.vibration_level || data.vibrationLevel,
    // Prioritize new brake_wear_percent from VL53L0X sensor
    brakeWearRate: sensorData.brake_wear_percent ?? sensorData.brake_wear_rate ?? data.brakeWearRate,
    brakeLifetimeDays: sensorData.brake_lifetime_days || data.brakeLifetimeDays,
  } : data;

  // Update telemetry data
  useEffect(() => {
    if (sensorData) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const newPoint: TelemetryDataPoint = {
        time: timeString,
        rpm: sensorData.rpm || 0,
        load: (sensorData.rpm || 0) / 100 // Engine load calculation
      };

      telemetryRef.current = [...telemetryRef.current, newPoint].slice(-maxTelemetryPoints);
      setTelemetryData(telemetryRef.current);
    }
  }, [sensorData]);

  // Initialize telemetry data
  useEffect(() => {
    if (telemetryData.length === 0 && sensorData) {
      const now = new Date();
      const initialData: TelemetryDataPoint[] = [];

      for (let i = 4; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2000);
        const timeString = time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const rpm = (sensorData.rpm || 0) + (Math.random() - 0.5) * 100;
        initialData.push({
          time: timeString,
          rpm: Math.max(0, rpm),
          load: rpm / 100
        });
      }

      telemetryRef.current = initialData;
      setTelemetryData(initialData);
    }
  }, [sensorData, telemetryData.length]);

  // Animated counters
  const [animatedBattery, setAnimatedBattery] = useState(0);
  const [animatedRange, setAnimatedRange] = useState(0);
  const [animatedRpm, setAnimatedRpm] = useState(0);
  const [animatedBrake, setAnimatedBrake] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;

    const startBattery = animatedBattery;
    const startRange = animatedRange;
    const startRpm = animatedRpm;
    const startBrake = animatedBrake;

    const targetBattery = displayData.batteryLevel;
    const targetRange = displayData.drivableRange;
    const targetRpm = sensorData?.rpm || 0;
    const targetBrake = displayData.brakeWearRate;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedBattery(startBattery + (targetBattery - startBattery) * progress);
      setAnimatedRange(startRange + (targetRange - startRange) * progress);
      setAnimatedRpm(startRpm + (targetRpm - startRpm) * progress);
      setAnimatedBrake(startBrake + (targetBrake - startBrake) * progress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedBattery(targetBattery);
        setAnimatedRange(targetRange);
        setAnimatedRpm(targetRpm);
        setAnimatedBrake(targetBrake);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [displayData.batteryLevel, displayData.drivableRange, displayData.brakeWearRate, sensorData?.rpm]);

  // Auto-save timer state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save sensor data to database
  const saveSensorData = async () => {
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('service_record_id', serviceRecordId);
      formData.append('battery_level', displayData.batteryLevel.toString());
      formData.append('drivable_range_km', displayData.drivableRange.toString());
      formData.append('vibration_level', displayData.vibrationLevel);
      formData.append('brake_wear_rate', displayData.brakeWearRate.toString());
      formData.append('brake_lifetime_days', displayData.brakeLifetimeDays.toString());
      if (sensorData?.rpm) {
        formData.append('rpm', sensorData.rpm.toString());
      }
      if (sensorData?.voltage) {
        formData.append('voltage', sensorData.voltage.toString());
      }

      const response = await fetch(`${API_CONFIG.baseURL}/api/save-sensor-data`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setLastSaveTime(new Date());
        console.log('✅ Sensor data auto-saved');
      } else {
        setSaveError('Save failed');
      }
    } catch (error) {
      console.error('Error saving sensor data:', error);
      setSaveError('Connection error');
    }
  };

  // Start auto-save
  const startAutoSave = () => {
    setIsAutoSaving(true);
    saveSensorData(); // Save immediately
    autoSaveTimerRef.current = setInterval(() => {
      saveSensorData();
    }, 120000); // 2 minutes = 120000ms
  };

  // Stop auto-save
  const stopAutoSave = () => {
    setIsAutoSaving(false);
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto p-6 min-h-screen">
      {/* Circuit Board Background */}
      <div className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='circuit' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 0 100 L 50 100 L 50 50 L 100 50 M 100 50 L 150 50 L 150 100 L 200 100 M 50 100 L 50 150 L 100 150 M 100 150 L 150 150 L 150 100' stroke='%2300EAFF' stroke-width='1' fill='none'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%2300EAFF'/%3E%3Ccircle cx='100' cy='50' r='3' fill='%234E8CFF'/%3E%3Ccircle cx='150' cy='100' r='3' fill='%23915EFF'/%3E%3Ccircle cx='100' cy='150' r='3' fill='%23FF4C8B'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23circuit)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        {/* Auto-Save Controls - Small and at top */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          {/* Live Data Indicator */}
          <AnimatePresence>
            {sensorData && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-full border border-emerald-400/30"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }}
                />
                <span className="text-xs font-bold text-emerald-300 tracking-wider">LIVE DATA</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto-Save Start/Stop Buttons */}
          <div className="inline-flex items-center gap-2">
            {!isAutoSaving ? (
              <motion.button
                onClick={startAutoSave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-2 hover:border-cyan-400/60 transition-all"
                style={{ boxShadow: '0 0 15px rgba(0, 234, 255, 0.2)' }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Start Auto-Save</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={stopAutoSave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/40 text-red-300 text-xs font-bold flex items-center gap-2 hover:border-red-400/60 transition-all"
                style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stop Auto-Save</span>
              </motion.button>
            )}
          </div>

          {/* Status Indicators */}
          {isAutoSaving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-400/30"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Save className="w-3 h-3 text-blue-300" />
              </motion.div>
              <span className="text-[10px] font-bold text-blue-300">Saving every 2 min</span>
            </motion.div>
          )}

          {lastSaveTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-gray-400 font-mono"
            >
              Last saved: {lastSaveTime.toLocaleTimeString()}
            </motion.div>
          )}

          {saveError && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-400/40"
            >
              <AlertTriangle className="w-3 h-3 text-red-300" />
              <span className="text-[10px] font-bold text-red-300">{saveError}</span>
            </motion.div>
          )}
        </div>

        {/* Main Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Battery Level Card with Circular Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{
              y: -8,
              boxShadow: '0 20px 60px rgba(0, 234, 255, 0.4), 0 0 40px rgba(0, 234, 255, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-cyan-400/30 overflow-hidden h-full"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-bl-3xl" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-2xl">
                  <Battery className="w-5 h-5 text-cyan-300" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 234, 255, 0.8))' }} />
                </div>
                <span className="text-sm font-bold text-cyan-300/80 tracking-wider">BATTERY LEVEL</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(0, 234, 255, 0.1)" strokeWidth="8" fill="none" />
                    <motion.circle
                      cx="48" cy="48" r="40"
                      stroke="url(#batteryGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 251 }}
                      animate={{ strokeDashoffset: 251 - (animatedBattery / 100) * 251 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{
                        strokeDasharray: 251,
                        filter: 'drop-shadow(0 0 6px rgba(0, 234, 255, 0.6))'
                      }}
                    />
                    <defs>
                      <linearGradient id="batteryGradient">
                        <stop offset="0%" stopColor="#00EAFF" />
                        <stop offset="100%" stopColor="#4E8CFF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-cyan-300 tabular-nums"
                      style={{ textShadow: '0 0 20px rgba(0, 234, 255, 0.8)' }}>
                      {animatedBattery.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <motion.div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-400 tabular-nums"
                    style={{ textShadow: '0 0 30px rgba(0, 234, 255, 0.4)' }}>
                    {animatedBattery.toFixed(1)}
                  </motion.div>
                  <p className="text-xs text-cyan-400/70 font-semibold tracking-wide mt-1">km range</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Drivable Range Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{
              y: -8,
              boxShadow: '0 20px 60px rgba(78, 140, 255, 0.4), 0 0 40px rgba(78, 140, 255, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-blue-400/30 overflow-hidden h-full"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-3xl" />

              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-2xl"
                  >
                    <Zap className="w-6 h-6 text-blue-300" style={{ filter: 'drop-shadow(0 0 6px rgba(78, 140, 255, 0.8))' }} />
                  </motion.div>
                  <span className="text-sm font-bold text-blue-300/80 tracking-wider">DRIVABLE RANGE</span>
                </div>

                <div>
                  <motion.div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-purple-400 tabular-nums mb-2"
                    style={{ textShadow: '0 0 30px rgba(78, 140, 255, 0.6)' }}>
                    {animatedRange.toFixed(1)}
                  </motion.div>
                  <p className="text-xs text-blue-400/70 font-semibold tracking-wide flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    kilometers remaining
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Engine RPM Card with Animated Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{
              y: -8,
              boxShadow: '0 20px 60px rgba(145, 94, 255, 0.4), 0 0 40px rgba(145, 94, 255, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-purple-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-purple-400/30 overflow-hidden h-full"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-3xl" />

              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-600/30 rounded-2xl"
                >
                  <Gauge className="w-6 h-6 text-purple-300" style={{ filter: 'drop-shadow(0 0 6px rgba(145, 94, 255, 0.8))' }} />
                </motion.div>
                <span className="text-sm font-bold text-purple-300/80 tracking-wider">ENGINE RPM</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="relative w-28 h-28">
                  {/* Speedometer gauge */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgba(145, 94, 255, 0.1)" strokeWidth="8" fill="none" />
                    <motion.circle
                      cx="50" cy="50" r="45"
                      stroke="url(#rpmGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 282 }}
                      animate={{ strokeDashoffset: 282 - ((animatedRpm / 2000) * 282 * 0.75) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{
                        strokeDasharray: 282,
                        transform: 'rotate(-135deg)',
                        transformOrigin: '50% 50%',
                        filter: 'drop-shadow(0 0 8px rgba(145, 94, 255, 0.6))'
                      }}
                    />
                    <defs>
                      <linearGradient id="rpmGradient">
                        <stop offset="0%" stopColor="#915EFF" />
                        <stop offset="100%" stopColor="#FF4C8B" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-black text-purple-300 tabular-nums"
                        style={{ textShadow: '0 0 20px rgba(145, 94, 255, 0.8)' }}>
                        {Math.round(animatedRpm)}
                      </div>
                      <div className="text-[10px] text-purple-400/70 font-bold">RPM</div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-pink-400 tabular-nums"
                    style={{ textShadow: '0 0 30px rgba(145, 94, 255, 0.4)' }}>
                    {Math.round(animatedRpm)}
                  </motion.div>
                  <p className="text-xs text-purple-400/70 font-semibold tracking-wide mt-1">rev/min</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vibration Analysis Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{
              y: -8,
              boxShadow: displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                ? '0 20px 60px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)'
                : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                  ? '0 20px 60px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)'
                  : '0 20px 60px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)'
            }}
            className="relative group"
          >
            <div className={`absolute inset-0 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
              : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                : 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
              }`} />
            <div className={`relative backdrop-blur-2xl rounded-3xl p-6 border-2 overflow-hidden h-full ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
              ? 'bg-gradient-to-br from-slate-900/90 to-emerald-950/90 border-emerald-400/30'
              : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                ? 'bg-gradient-to-br from-slate-900/90 to-yellow-950/90 border-yellow-400/30'
                : 'bg-gradient-to-br from-slate-900/90 to-red-950/90 border-red-400/30'
              }`}
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>

              {/* Corner accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br to-transparent rounded-bl-3xl ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                ? 'from-emerald-400/20'
                : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                  ? 'from-yellow-400/20'
                  : 'from-red-400/20'
                }`} />

              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={displayData.vibrationLevel.toUpperCase() !== 'NORMAL' ? { x: [-2, 2, -2, 2, 0] } : { scale: [1, 1.1, 1] }}
                    transition={{ duration: displayData.vibrationLevel.toUpperCase() !== 'NORMAL' ? 0.3 : 2, repeat: Infinity }}
                    className={`p-3 rounded-2xl ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                      ? 'bg-gradient-to-br from-emerald-500/30 to-green-600/30'
                      : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                        ? 'bg-gradient-to-br from-yellow-500/30 to-orange-600/30'
                        : 'bg-gradient-to-br from-red-500/30 to-rose-600/30'
                      }`}
                  >
                    <Activity className={`w-6 h-6 ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                      ? 'text-emerald-300'
                      : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                        ? 'text-yellow-300'
                        : 'text-red-300'
                      }`} style={{
                        filter: displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                          ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                          : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                            ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))'
                            : 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))'
                      }} />
                  </motion.div>
                  <span className={`text-sm font-bold tracking-wider ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                    ? 'text-emerald-300/80'
                    : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                      ? 'text-yellow-300/80'
                      : 'text-red-300/80'
                    }`}>VIBRATION STATUS</span>
                </div>

                <div>
                  <motion.div
                    key={displayData.vibrationLevel}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-5xl font-black text-transparent bg-clip-text mb-2 ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                      ? 'bg-gradient-to-br from-emerald-300 to-green-400'
                      : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                        ? 'bg-gradient-to-br from-yellow-300 to-orange-400'
                        : 'bg-gradient-to-br from-red-300 to-rose-400'
                      }`}
                    style={{
                      textShadow: displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                        ? '0 0 30px rgba(16, 185, 129, 0.6)'
                        : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                          ? '0 0 30px rgba(251, 191, 36, 0.6)'
                          : '0 0 30px rgba(239, 68, 68, 0.6)'
                    }}>
                    {displayData.vibrationLevel.toUpperCase()}
                  </motion.div>
                  <p className={`text-xs font-semibold tracking-wide ${displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                    ? 'text-emerald-400/70'
                    : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                      ? 'text-yellow-400/70'
                      : 'text-red-400/70'
                    }`}>
                    {displayData.vibrationLevel.toUpperCase() === 'NORMAL'
                      ? 'System Status OK'
                      : displayData.vibrationLevel.toUpperCase() === 'MODERATE'
                        ? 'Moderate Vibration Detected'
                        : 'High Vibration - Check System'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Brake Wear Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{
              y: -8,
              boxShadow: '0 20px 60px rgba(255, 76, 139, 0.4), 0 0 40px rgba(255, 76, 139, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-red-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-pink-400/30 overflow-hidden h-full"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-transparent rounded-bl-3xl" />

              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={animatedBrake > 60 ? { rotate: [0, 10, -10, 0] } : { scale: [1, 1.1, 1] }}
                  transition={{ duration: animatedBrake > 60 ? 0.5 : 2, repeat: Infinity }}
                  className="p-3 bg-gradient-to-br from-pink-500/30 to-red-600/30 rounded-2xl"
                >
                  <AlertTriangle className="w-6 h-6 text-pink-300" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 76, 139, 0.8))' }} />
                </motion.div>
                <span className="text-sm font-bold text-pink-300/80 tracking-wider">BRAKE WEAR</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <motion.div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-300 to-red-400 tabular-nums"
                    style={{ textShadow: '0 0 30px rgba(255, 76, 139, 0.6)' }}>
                    {animatedBrake.toFixed(1)}%
                  </motion.div>
                </div>

                <div className="relative w-full h-3 bg-gradient-to-r from-emerald-500/20 via-yellow-500/20 to-red-500/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedBrake}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 rounded-full relative"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255, 76, 139, 0.6))' }}
                  >
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-1/3 bg-white/30"
                      style={{ filter: 'blur(8px)' }}
                    />
                  </motion.div>
                </div>

                {/* Display brake distance if available */}
                {sensorData?.brake_distance_mm !== undefined && (
                  <div className="flex items-center justify-between px-3 py-2 bg-pink-500/10 rounded-lg border border-pink-400/20">
                    <span className="text-xs text-pink-300/70 font-semibold">Brake Distance:</span>
                    <span className="text-sm text-pink-200 font-black tabular-nums">
                      {sensorData.brake_distance_mm.toFixed(1)} mm
                    </span>
                  </div>
                )}

                <p className="text-xs text-pink-400/70 font-semibold tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Lifetime: {displayData.brakeLifetimeDays} days
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Telemetry Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{
            y: -5,
            boxShadow: '0 25px 70px rgba(0, 234, 255, 0.3)'
          }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-2xl rounded-3xl p-8 border-2 border-cyan-400/20 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
          >
            {/* Scan lines */}
            <motion.div
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-sm"
            />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 234, 255, 0.8))' }} />
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                  Telemetry - Engine Load
                </h3>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-xs text-cyan-400 font-mono"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(0, 234, 255, 0.8)' }} />
                REAL-TIME
              </motion.div>
            </div>

            <div className="relative h-[280px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 234, 255, 0.03) 40px, rgba(0, 234, 255, 0.03) 41px)'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00EAFF" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#4E8CFF" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 234, 255, 0.1)" />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(0, 234, 255, 0.5)"
                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="rgba(0, 234, 255, 0.5)"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    label={{ value: 'Load %', angle: -90, position: 'insideLeft', style: { fill: '#00EAFF', fontWeight: 'bold' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.95))',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(0, 234, 255, 0.3)',
                      borderRadius: '16px',
                      boxShadow: '0 0 30px rgba(0, 234, 255, 0.3)'
                    }}
                    labelStyle={{ color: '#00EAFF', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="load"
                    stroke="url(#telemetryGradient)"
                    strokeWidth={3}
                    name="Engine Load"
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-out"
                    dot={{
                      fill: '#00EAFF',
                      strokeWidth: 2,
                      r: 5,
                      filter: 'drop-shadow(0 0 6px rgba(0, 234, 255, 0.8))'
                    }}
                    activeDot={{
                      r: 8,
                      fill: '#00EAFF',
                      stroke: '#0A1528',
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 0 10px rgba(0, 234, 255, 1))'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
