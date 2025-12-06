import { Car, User, FileText, Calendar, CheckCircle, MapPin, Shield, Zap, AlertCircle } from 'lucide-react';
import { Vehicle, ServiceHistory } from '../types';
import { motion } from 'framer-motion';
import { useSensorData } from '../hooks/useSensorData';
import { useState, useEffect } from 'react';

interface VehicleInfoProps {
  vehicle: Vehicle;
  serviceHistory: ServiceHistory[];
}

export function VehicleInfo({ vehicle, serviceHistory }: VehicleInfoProps) {
  // Get real-time sensor data
  const { sensorData, loading } = useSensorData('455e445f-c11b-4db7-8c78-e62f8df86614');
  
  // Calculate total cost from sensor data
  const totalCost = sensorData?.total_cost || 0;
  
  return (
    <div className="space-y-6">
      {/* Vehicle Card with 3D Effect */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-6 relative overflow-hidden">
          <motion.div
            animate={{ x: [-100, 1000] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-40 h-full bg-white/10"
            style={{ transform: 'skewX(-20deg)' }}
          ></motion.div>
          <h3 className="text-white font-bold text-2xl flex items-center gap-3 relative z-10">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
            >
              <Car className="w-7 h-7" />
            </motion.div>
            Vehicle Information
          </h3>
        </div>

        {/* Vehicle Details Grid */}
        <div className="p-8 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-orange-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-orange-300/30 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-orange-500 to-pink-600 p-4 rounded-xl shadow-lg relative z-10"
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div className="relative z-10">
                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Car ID</p>
                <p className="font-bold text-xl text-white">{vehicle.car_id}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-pink-300/30 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-xl shadow-lg relative z-10"
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <div className="relative z-10">
                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Number Plate</p>
                <p className="font-bold text-2xl text-white tracking-wider">{vehicle.car_number_plate}</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            className="flex items-center gap-4 p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl border border-purple-300/30 shadow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="bg-gradient-to-br from-purple-500 to-blue-600 p-4 rounded-xl shadow-lg relative z-10"
            >
              <User className="w-7 h-7 text-white" />
            </motion.div>
            <div className="relative z-10">
              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Owner Name</p>
              <p className="font-bold text-2xl text-white">{vehicle.car_owner_name}</p>
            </div>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="ml-auto bg-green-500/20 p-3 rounded-full border border-green-400/30"
            >
              <Shield className="w-6 h-6 text-green-400" />
            </motion.div>
          </motion.div>
        </div>

      </motion.div>

      {/* Service History Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8"
      >
        <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-2xl">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="bg-gradient-to-br from-orange-500 to-pink-600 p-3 rounded-xl"
          >
            <Calendar className="w-6 h-6 text-white" />
          </motion.div>
          Service History Timeline
        </h4>
        
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {serviceHistory.length > 0 ? (
            serviceHistory.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 10 }}
                className="flex items-start gap-4 p-5 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all group relative overflow-hidden"
              >
                {/* Timeline Dot */}
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg relative z-10"
                  >
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                  {index !== serviceHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-green-400 to-transparent"></div>
                  )}
                </div>

                {/* Service Details */}
                <div className="flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="text-lg font-bold text-white mb-1">{service.service_type}</h5>
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(service.service_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                        ₹{service.cost}
                      </p>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                          service.status === 'Completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                        }`}
                      >
                        {service.status}
                      </motion.span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-pink-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                ></motion.div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg">No service history available</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Damage & Sensor Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-white font-black text-3xl flex items-center gap-3 mb-2">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl"
            >
              <AlertCircle className="w-7 h-7 text-white" />
            </motion.div>
            Damage & Sensor Summary
          </h3>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-1 w-48 bg-gradient-to-r from-purple-500 via-pink-500 to-transparent rounded-full"
            style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
          />
        </div>

        {/* Damage Views Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Front View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(0, 234, 255, 0.3)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-950/90 backdrop-blur-xl rounded-2xl p-5 border-2 border-cyan-400/20 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-bl-2xl" />
              
              <h4 className="text-cyan-300 font-bold text-sm mb-4 tracking-wider">Front View</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Scratches</span>
                  <motion.span 
                    key={sensorData?.scratches_count}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-orange-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.scratches_count || 0)}
                  </motion.span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Dents</span>
                  <motion.span 
                    key={sensorData?.dents_count}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-red-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.dents_count || 0)}
                  </motion.span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Cracks</span>
                  <motion.span 
                    key={sensorData?.crack_count}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-yellow-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.crack_count || 0)}
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(78, 140, 255, 0.3)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-950/90 backdrop-blur-xl rounded-2xl p-5 border-2 border-blue-400/20 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-2xl" />
              
              <h4 className="text-blue-300 font-bold text-sm mb-4 tracking-wider">Side View</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Scratches</span>
                  <span className="text-orange-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.scratches_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Dents</span>
                  <span className="text-red-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.dents_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Cracks</span>
                  <span className="text-yellow-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.crack_count || 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rear View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(145, 94, 255, 0.3)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-purple-950/90 backdrop-blur-xl rounded-2xl p-5 border-2 border-purple-400/20 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/10 to-transparent rounded-bl-2xl" />
              
              <h4 className="text-purple-300 font-bold text-sm mb-4 tracking-wider">Rear View</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Scratches</span>
                  <span className="text-orange-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.scratches_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Dents</span>
                  <span className="text-red-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.dents_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Cracks</span>
                  <span className="text-yellow-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.crack_count || 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Brake View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(255, 76, 139, 0.3)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-pink-950/90 backdrop-blur-xl rounded-2xl p-5 border-2 border-pink-400/20 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-400/10 to-transparent rounded-bl-2xl" />
              
              <h4 className="text-pink-300 font-bold text-sm mb-4 tracking-wider">Brake View</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Scratches</span>
                  <span className="text-orange-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.scratches_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Dents</span>
                  <span className="text-red-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.dents_count || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Cracks</span>
                  <span className="text-yellow-400 font-black text-xl tabular-nums">
                    {loading ? '-' : (sensorData?.crack_count || 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live Sensors */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ 
              y: -8,
              boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)'
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-emerald-950/90 backdrop-blur-xl rounded-2xl p-5 border-2 border-emerald-400/20 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-2xl" />
              
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-emerald-300 font-bold text-sm tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Live Sensors
                </h4>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)' }}
                />
              </div>
              
              <div className="flex items-center justify-center h-20">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                ) : (
                  <p className="text-gray-400 text-sm text-center italic">
                    Sensor data loaded
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Total Service Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex justify-end"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-slate-900/90 to-orange-950/90 backdrop-blur-xl rounded-2xl px-8 py-6 border-2 border-orange-400/30"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
              <div className="text-right">
                <p className="text-orange-300/80 text-sm font-bold tracking-wider mb-2">Total Service Cost</p>
                <motion.div 
                  key={totalCost}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-pink-300 to-purple-400 tabular-nums"
                  style={{ textShadow: '0 0 30px rgba(251, 146, 60, 0.4)' }}>
                  ₹{loading ? '0.00' : totalCost.toFixed(2)}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f97316, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ea580c, #db2777);
        }
      `}</style>
    </div>
  );
}

export default VehicleInfo;
