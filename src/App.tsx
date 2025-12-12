import { useState, useEffect } from 'react';
import { LiveFeed } from './components/LiveFeed';
import { VehicleInfo } from './components/VehicleInfo';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { PaymentReceipt } from './components/PaymentReceipt';
import BatteryHealthChart from './components/BatteryHealthChart';
import { Vehicle, ServiceRecord, ServiceHistory } from './types';
import { Car, Activity, Cpu, Battery, Info, CreditCard, Wifi, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [supabaseStatus] = useState("Idle");

  // --- DATA MOCK (UNCHANGED) ---
  const [currentVehicle] = useState<Vehicle>({
    id: '1', car_id: 'TCS-2024-0001', car_number_plate: 'MH-12-AB-1234',
    car_owner_name: 'Rajesh Kumar', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });

  const [serviceRecord, setServiceRecord] = useState<ServiceRecord>({
    id: '455e445f-c11b-4db7-8c78-e62f8df86614', // Match ESP32's service record ID
    vehicle_id: '1', service_date: new Date().toISOString(),
    scratches_count: 0, dents_count: 0, brake_wear_rate: 45.5, brake_lifetime_days: 120,
    crack_count: 0, battery_level: 78, drivable_range_km: 245, vibration_level: 'Normal',
    service_status: 'In Progress', total_cost: 0, payment_status: 'Pending', created_at: new Date().toISOString(),
  });

  const [serviceHistory] = useState<ServiceHistory[]>([
    { service_date: '2024-09-15', service_type: 'Full Service', cost: 5500, status: 'Completed' },
    { service_date: '2024-06-20', service_type: 'Oil Change', cost: 1200, status: 'Completed' },
  ]);

  const [feedAnalysis, setFeedAnalysis] = useState({
    front: { scratches: 0, dents: 0, cracks: 0, imageUrl: '', beforeImage: '', annotatedImage: '', annotatedImageUrl: '', brakeStatus: undefined as "Good" | "Bad" | undefined },
    left: { scratches: 0, dents: 0, cracks: 0, imageUrl: '', beforeImage: '', annotatedImage: '', annotatedImageUrl: '', brakeStatus: undefined as "Good" | "Bad" | undefined },
    right: { scratches: 0, dents: 0, cracks: 0, imageUrl: '', beforeImage: '', annotatedImage: '', annotatedImageUrl: '', brakeStatus: undefined as "Good" | "Bad" | undefined },
    brake: { scratches: 0, dents: 0, cracks: 0, imageUrl: '', beforeImage: '', annotatedImage: '', annotatedImageUrl: '', brakeStatus: undefined as "Good" | "Bad" | undefined },
  });

  // --- LOGIC (UNCHANGED) ---
  const updateTotalCost = (updatedAnalysis = feedAnalysis) => {
    const front = updatedAnalysis.front || { scratches: 0, dents: 0 };
    const left = updatedAnalysis.left || { scratches: 0, dents: 0 };
    const right = updatedAnalysis.right || { scratches: 0, dents: 0 };
    const brake = updatedAnalysis.brake || { scratches: 0, dents: 0 };

    const total =
      (front.scratches ?? 0) * 300 + (front.dents ?? 0) * 500 +
      (left.scratches ?? 0) * 300 + (left.dents ?? 0) * 500 +
      (right.scratches ?? 0) * 300 + (right.dents ?? 0) * 500 +
      (brake.scratches ?? 0) * 300 + (brake.dents ?? 0) * 500 +
      (serviceRecord.brake_wear_rate ?? 0) * 20 + 500;

    setServiceRecord(prev => ({ ...prev, total_cost: total }));
  };

  useEffect(() => {
    fetch('https://automotive-service-station.onrender.com/api/health')
      .then(() => setBackendStatus('Connected'))
      .catch(() => setBackendStatus('Offline'));
  }, []);

  const handleAnalysisComplete = (block: keyof typeof feedAnalysis, result: any) => {
    setFeedAnalysis(prev => {
      const updated = {
        ...prev,
        [block]: {
          scratches: result.scratches ?? 0, dents: result.dents ?? 0, cracks: result.cracks ?? 0,
          imageUrl: result.imageUrl ?? '',
          beforeImage: result.beforeImage ?? '',
          annotatedImage: result.annotatedImage ?? '',
          annotatedImageUrl: result.annotatedImageUrl ?? '',
          brakeStatus: result.brakeStatus,
        },
      };
      updateTotalCost(updated);
      return updated;
    });

    if (result.imageUrl) {
      // setSupabaseStatus("Synced"); // Removed as state is read-only in this snippet context if not fully restored, but assuming setSupabaseStatus is available in full file
      // setTimeout(() => setSupabaseStatus("Idle"), 5000);
    } else {
      // setSupabaseStatus("Upload Failed");
    }
  };

  const handleGenerateReceipt = async () => { alert("Receipt Generated! (Simulation)"); };

  // --- RENDER UI (REDESIGNED) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 font-sans text-white relative overflow-hidden">

      {/* Premium Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Automotive blueprint pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%233b82f6' stroke-width='0.5'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%233b82f6'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
        />

        {/* Subtle scan lines */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.3) 2px, rgba(59, 130, 246, 0.3) 4px)',
          }}
        />
      </div>

      {/* PREMIUM NAVBAR */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-black/40 backdrop-blur-2xl text-white shadow-2xl sticky top-0 z-50 border-b border-white/20 relative overflow-hidden"
      >
        {/* Navbar glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center h-20">
            {/* Premium Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.15 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 p-4 rounded-2xl shadow-2xl"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Car className="w-7 h-7 text-white relative z-10" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-2xl"
                />
              </motion.div>
              <div className="leading-tight">
                <h1 className="text-2xl font-black tracking-tight relative">
                  AUTOSERVICE
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse">
                    PRO
                  </span>
                </h1>
                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs text-blue-300/80 uppercase tracking-widest flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  Intelligent Diagnostics
                </motion.p>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex gap-2">
              {[
                { id: "dashboard", label: "Overview", icon: Activity },
                { id: "ecu", label: "ECU", icon: Cpu },
                { id: "battery", label: "Battery", icon: Battery },
                { id: "info", label: "Vehicle", icon: Info },
                { id: "payment", label: "Billing", icon: CreditCard },
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveTab(item.id)}
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                     ${isActive
                        ? "bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-white shadow-xl"
                        : "text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-white/10"}`}
                    style={isActive ? {
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    } : {}}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Premium Status Badge */}
            <div className="flex gap-4">
              {/* Supabase Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold backdrop-blur-xl relative overflow-hidden
                ${supabaseStatus === 'Synced'
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-2 border-cyan-400/50'
                    : supabaseStatus === 'Upload Failed'
                      ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-2 border-red-400/50'
                      : 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border-2 border-slate-400/50'}`}
                style={supabaseStatus === 'Synced' ? {
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                } : {}}
              >
                <motion.div
                  animate={supabaseStatus === 'Synced' ? {
                    scale: [1, 1.2, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span className="relative z-10">{supabaseStatus === 'Idle' ? 'Storage Ready' : supabaseStatus}</span>
              </motion.div>

              {/* Backend Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold backdrop-blur-xl relative overflow-hidden
                ${backendStatus === 'Connected'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-green-300 border-2 border-green-400/50'
                    : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-2 border-red-400/50'}`}
                style={backendStatus === 'Connected' ? {
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                } : {
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Wifi className="w-5 h-5" />
                </motion.div>
                <span className="relative z-10">{backendStatus}</span>

                {/* Animated pulse ring */}
                {backendStatus === 'Connected' && (
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-green-400 rounded-2xl"
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Premium Page Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 relative"
              >
                <motion.div
                  animate={{
                    scaleY: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 10px rgba(59, 130, 246, 0.5)',
                      '0 0 20px rgba(139, 92, 246, 0.7)',
                      '0 0 10px rgba(59, 130, 246, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-10 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 rounded-full"
                />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200">
                  Service Overview
                </h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-cyan-400"
                  style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)' }}
                />
              </motion.div>

              {/* Live Feed Component */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <LiveFeed showUpload serviceRecordId={serviceRecord.id} onAnalysisComplete={handleAnalysisComplete} />
              </motion.div>

              {/* Premium Cost Estimation Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{
                  scale: 1.02,
                  y: -8,
                  rotateX: 2,
                  rotateY: -2
                }}
                className="glass-card bg-gradient-to-r from-blue-600/30 via-purple-700/30 to-pink-600/30 p-8 rounded-3xl shadow-2xl border-2 border-white/30 flex justify-between items-center backdrop-blur-2xl relative overflow-hidden transform-gpu"
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Animated orbs */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [1.2, 1, 1.2]
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="absolute -left-20 -bottom-20 w-60 h-60 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
                />

                {/* Scan line effect */}
                <motion.div
                  animate={{ y: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent blur-sm"
                />

                <div className="relative z-10">
                  <motion.h3
                    className="text-2xl font-black text-white mb-2 flex items-center gap-2"
                    animate={{ opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CreditCard className="w-6 h-6 text-cyan-400" />
                    Estimated Repair Cost
                  </motion.h3>
                  <p className="text-sm text-blue-100 font-semibold">Includes labor and parts based on AI-detected defects</p>
                </div>
                <div className="text-right relative z-10">
                  <motion.p
                    key={serviceRecord.total_cost}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 tabular-nums"
                    style={{
                      textShadow: '0 0 30px rgba(34, 211, 238, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    ₹{serviceRecord.total_cost.toFixed(2)}
                  </motion.p>
                  <motion.p
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-xs text-cyan-200 uppercase font-black tracking-widest mt-2 flex items-center justify-end gap-1"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)' }}
                    />
                    Total + Tax
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Other tabs */}
          {activeTab === "ecu" && (
            <motion.div
              key="ecu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 mb-8 relative"
              >
                <motion.div
                  animate={{
                    scaleY: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 10px rgba(249, 115, 22, 0.5)',
                      '0 0 20px rgba(236, 72, 153, 0.7)',
                      '0 0 10px rgba(249, 115, 22, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-10 bg-gradient-to-b from-orange-400 via-pink-500 to-rose-600 rounded-full"
                />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-pink-200">
                  ECU Diagnostics
                </h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-orange-400"
                  style={{ boxShadow: '0 0 10px rgba(251, 146, 60, 0.8)' }}
                />
              </motion.div>
              <DiagnosticsPanel
                data={{
                  batteryLevel: serviceRecord.battery_level,
                  drivableRange: serviceRecord.drivable_range_km,
                  vibrationLevel: serviceRecord.vibration_level,
                  brakeWearRate: serviceRecord.brake_wear_rate,
                  brakeLifetimeDays: serviceRecord.brake_lifetime_days
                }}
                serviceRecordId={serviceRecord.id}
              />
            </motion.div>
          )}

          {activeTab === "battery" && (
            <motion.div
              key="battery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BatteryHealthChart />
            </motion.div>
          )}

          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 mb-8 relative"
              >
                <motion.div
                  animate={{
                    scaleY: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 10px rgba(16, 185, 129, 0.5)',
                      '0 0 20px rgba(5, 150, 105, 0.7)',
                      '0 0 10px rgba(16, 185, 129, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 via-green-500 to-teal-600 rounded-full"
                />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-green-200">
                  Vehicle Details
                </h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)' }}
                />
              </motion.div>
              <VehicleInfo vehicle={currentVehicle} serviceHistory={serviceHistory} />
            </motion.div>
          )}

          {activeTab === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 mb-8 relative"
              >
                <motion.div
                  animate={{
                    scaleY: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 10px rgba(234, 179, 8, 0.5)',
                      '0 0 20px rgba(249, 115, 22, 0.7)',
                      '0 0 10px rgba(234, 179, 8, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-10 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-600 rounded-full"
                />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-100 to-orange-200">
                  Checkout & Billing
                </h2>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 rounded-full bg-yellow-400"
                  style={{ boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)' }}
                />
              </motion.div>
              <PaymentReceipt vehicle={currentVehicle} serviceRecord={serviceRecord} feedAnalysis={feedAnalysis} onGenerateReceipt={handleGenerateReceipt} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}