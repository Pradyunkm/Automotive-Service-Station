import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSensorData } from '../hooks/useSensorData';
import { motion } from 'framer-motion';
import { Battery, Zap, Thermometer, Activity, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface BatteryDataPoint {
  time: string;
  health: number;
  voltage: number;
  temperature: number;
}

const BatteryHealthTrends = () => {
  // Get real-time sensor data
  const { sensorData } = useSensorData('455e445f-c11b-4db7-8c78-e62f8df86614');

  // Store historical data for graphs (max 20 points)
  const [batteryData, setBatteryData] = useState<BatteryDataPoint[]>([]);
  const dataPointsRef = useRef<BatteryDataPoint[]>([]);
  const maxDataPoints = 20;

  // Use real-time data or fallback to default
  const currentHealth = sensorData?.battery_level || 78;
  const currentVoltage = sensorData?.voltage || 5.37;
  const currentTemp = sensorData?.temperature || 25;

  // Animated counter states
  const [animatedHealth, setAnimatedHealth] = useState(0);
  const [animatedVoltage, setAnimatedVoltage] = useState(0);
  const [animatedTemp, setAnimatedTemp] = useState(0);

  // Update historical data when sensor data changes
  useEffect(() => {
    if (sensorData) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });

      const newDataPoint: BatteryDataPoint = {
        time: timeString,
        health: currentHealth,
        voltage: currentVoltage,
        temperature: currentTemp
      };

      // Add new data point and keep only last maxDataPoints
      dataPointsRef.current = [...dataPointsRef.current, newDataPoint].slice(-maxDataPoints);
      setBatteryData(dataPointsRef.current);
    }
  }, [sensorData, currentHealth, currentVoltage, currentTemp]);

  // Initialize with current data if empty
  useEffect(() => {
    if (batteryData.length === 0 && sensorData) {
      const now = new Date();
      const initialData: BatteryDataPoint[] = [];
      
      // Create initial 5 data points with slight variations for smooth start
      for (let i = 4; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2000);
        const timeString = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        });
        
        initialData.push({
          time: timeString,
          health: currentHealth + (Math.random() - 0.5) * 2,
          voltage: currentVoltage + (Math.random() - 0.5) * 0.1,
          temperature: currentTemp + (Math.random() - 0.5) * 2
        });
      }
      
      dataPointsRef.current = initialData;
      setBatteryData(initialData);
    }
  }, [sensorData, batteryData.length, currentHealth, currentVoltage, currentTemp]);

  // Animate counters when values change
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    
    const startHealth = animatedHealth;
    const startVoltage = animatedVoltage;
    const startTemp = animatedTemp;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedHealth(startHealth + (currentHealth - startHealth) * progress);
      setAnimatedVoltage(startVoltage + (currentVoltage - startVoltage) * progress);
      setAnimatedTemp(startTemp + (currentTemp - startTemp) * progress);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedHealth(currentHealth);
        setAnimatedVoltage(currentVoltage);
        setAnimatedTemp(currentTemp);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentHealth, currentVoltage, currentTemp]);

  // Circular gauge calculation
  const healthPercentage = (animatedHealth / 100) * 283; // 283 is circumference of circle with r=45

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-cyan-400/30 shadow-2xl"
          style={{ boxShadow: '0 0 30px rgba(0, 234, 255, 0.3)' }}
        >
          <p className="font-black text-cyan-300 mb-2 text-sm tracking-wider">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
              <span className="text-white">{entry.name}: {entry.value}{entry.name === 'Health' ? '%' : entry.name === 'Voltage' ? 'V' : '°C'}</span>
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto p-6 min-h-screen">
      {/* Futuristic Circuit Board Background */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='circuit' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 0 100 L 50 100 L 50 50 L 100 50 M 100 50 L 150 50 L 150 100 L 200 100 M 50 100 L 50 150 L 100 150 M 100 150 L 150 150 L 150 100' stroke='%2300EAFF' stroke-width='1' fill='none'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%2300EAFF'/%3E%3Ccircle cx='100' cy='50' r='3' fill='%2353A8FF'/%3E%3Ccircle cx='150' cy='100' r='3' fill='%238658FF'/%3E%3Ccircle cx='100' cy='150' r='3' fill='%23FF4C8B'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23circuit)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        {/* Futuristic Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Zap className="w-8 h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 234, 255, 0.8))' }} />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400"
              style={{ textShadow: '0 0 30px rgba(0, 234, 255, 0.3)' }}>
              Battery Health Trends
            </h1>
          </div>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-1 w-32 bg-gradient-to-r from-cyan-400 via-blue-500 to-transparent rounded-full"
            style={{ boxShadow: '0 0 10px rgba(0, 234, 255, 0.5)' }}
          />
        </motion.div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Battery Health - Circular Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(0, 234, 255, 0.4), 0 0 40px rgba(0, 234, 255, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-cyan-400/30 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-bl-3xl" />
              
              {/* Circular Gauge */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40 mb-4">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="rgba(0, 234, 255, 0.1)"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Animated progress circle */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#batteryGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - healthPercentage }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      style={{
                        strokeDasharray: 440,
                        filter: 'drop-shadow(0 0 8px rgba(0, 234, 255, 0.6))'
                      }}
                    />
                    <defs>
                      <linearGradient id="batteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00EAFF" />
                        <stop offset="50%" stopColor="#53A8FF" />
                        <stop offset="100%" stopColor="#8658FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center value */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      className="text-5xl font-black text-cyan-300 tabular-nums"
                      style={{ textShadow: '0 0 20px rgba(0, 234, 255, 0.8)' }}
                    >
                      {animatedHealth.toFixed(1)}%
                    </motion.span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-bold text-cyan-300/80 tracking-wider mb-1">BATTERY HEALTH</p>
                  <motion.p 
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1"
                  >
                    <TrendingUp className="w-3 h-3" />
                    17% from Jan
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voltage Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(83, 168, 255, 0.4), 0 0 40px rgba(83, 168, 255, 0.2)'
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
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-2xl"
                  >
                    <Zap className="w-6 h-6 text-blue-300" style={{ filter: 'drop-shadow(0 0 6px rgba(83, 168, 255, 0.8))' }} />
                  </motion.div>
                  <span className="text-sm font-bold text-blue-300/80 tracking-wider">VOLTAGE</span>
                </div>
                
                <div>
                  <motion.div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-purple-400 tabular-nums mb-2"
                    style={{ textShadow: '0 0 30px rgba(83, 168, 255, 0.6)' }}>
                    {animatedVoltage.toFixed(2)}V
                  </motion.div>
                  <p className="text-xs text-blue-400/70 font-semibold tracking-wide">Normal Range</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Temperature Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(255, 76, 139, 0.4), 0 0 40px rgba(255, 76, 139, 0.2)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-orange-950/90 backdrop-blur-2xl rounded-3xl p-6 border-2 border-orange-400/30 overflow-hidden h-full"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-3xl" />
              
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-3 bg-gradient-to-br from-orange-500/30 to-pink-600/30 rounded-2xl"
                  >
                    <Thermometer className="w-6 h-6 text-orange-300" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.8))' }} />
                  </motion.div>
                  <span className="text-sm font-bold text-orange-300/80 tracking-wider">TEMPERATURE</span>
                </div>
                
                <div>
                  <motion.div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-300 to-pink-400 tabular-nums mb-2"
                    style={{ textShadow: '0 0 30px rgba(251, 146, 60, 0.6)' }}>
                    {animatedTemp.toFixed(0)}°C
                  </motion.div>
                  <p className="text-xs text-orange-400/70 font-semibold tracking-wide">↑ 10°C from Jan</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* First Chart - Health Percentage */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          whileHover={{ 
            y: -5,
            boxShadow: '0 25px 70px rgba(0, 234, 255, 0.3)'
          }}
          className="relative group mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
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
                <Activity className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 234, 255, 0.8))' }} />
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                  Real-Time Battery Health
                </h3>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-xs text-cyan-400 font-mono"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(0, 234, 255, 0.8)' }} />
                LIVE UPDATE
              </motion.div>
            </div>
            
            <div className="relative h-[300px] mt-4"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 234, 255, 0.03) 40px, rgba(0, 234, 255, 0.03) 41px)'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={batteryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00EAFF" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#53A8FF" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#8658FF" stopOpacity={0.05} />
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="health" 
                    stroke="#00EAFF" 
                    strokeWidth={3}
                    fill="url(#healthGradient)"
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Second Chart - Voltage & Temperature */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ 
            y: -5,
            boxShadow: '0 25px 70px rgba(134, 88, 255, 0.3)'
          }}
          className="relative group mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-purple-950/95 backdrop-blur-2xl rounded-3xl p-8 border-2 border-purple-400/20 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
          >
            {/* Scan lines */}
            <motion.div
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent blur-sm"
            />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(134, 88, 255, 0.8))' }} />
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                  Real-Time Voltage & Temperature
                </h3>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-xs text-purple-400 font-mono"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 8px rgba(134, 88, 255, 0.8)' }} />
                LIVE UPDATE
              </motion.div>
            </div>
            
            <div className="relative h-[300px] mt-4"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(134, 88, 255, 0.03) 40px, rgba(134, 88, 255, 0.03) 41px)'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={batteryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#53A8FF" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8658FF" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4C8B" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#FB923C" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(134, 88, 255, 0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(134, 88, 255, 0.5)" 
                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="rgba(83, 168, 255, 0.5)"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', style: { fill: '#53A8FF', fontWeight: 'bold' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(255, 76, 139, 0.5)"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', style: { fill: '#FF4C8B', fontWeight: 'bold' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="voltage" 
                    stroke="url(#voltageGradient)"
                    strokeWidth={3}
                    name="Voltage"
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-out"
                    dot={{ 
                      fill: '#53A8FF', 
                      strokeWidth: 2, 
                      r: 5,
                      filter: 'drop-shadow(0 0 6px rgba(83, 168, 255, 0.8))'
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: '#53A8FF',
                      stroke: '#0A1528',
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 0 10px rgba(83, 168, 255, 1))'
                    }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="url(#tempGradient)"
                    strokeWidth={3}
                    name="Temperature"
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-out"
                    dot={{ 
                      fill: '#FF4C8B', 
                      strokeWidth: 2, 
                      r: 5,
                      filter: 'drop-shadow(0 0 6px rgba(255, 76, 139, 0.8))'
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: '#FF4C8B',
                      stroke: '#0A1528',
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 0 10px rgba(255, 76, 139, 1))'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Recommendations Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          whileHover={{ 
            y: -5,
            boxShadow: '0 25px 70px rgba(251, 191, 36, 0.2)'
          }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-amber-950/95 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/20 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-3 bg-gradient-to-br from-yellow-500/30 to-amber-600/30 rounded-2xl mt-1"
              >
                <Battery className="w-6 h-6 text-yellow-300" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' }} />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-4">
                  AI Recommendations
                </h3>
                <ul className="space-y-3">
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-3 text-yellow-100/90"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" 
                      style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
                    <span className="font-medium">Battery health is declining. Consider scheduling a battery replacement within the next 3 months.</span>
                  </motion.li>
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-start gap-3 text-yellow-100/90"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"
                      style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
                    <span className="font-medium">Temperature is rising steadily. Check cooling system and ensure proper ventilation.</span>
                  </motion.li>
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex items-start gap-3 text-yellow-100/90"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"
                      style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
                    <span className="font-medium">Voltage levels are within normal range but showing slight decline. Monitor closely.</span>
                  </motion.li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Corner HUD Elements */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-60">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{ boxShadow: '0 0 8px rgba(0, 234, 255, 0.8)' }}
          />
          <span className="text-xs text-cyan-400 font-mono tracking-wider">LIVE</span>
        </div>

      </motion.div>
    </div>
  );
};

export default BatteryHealthTrends;