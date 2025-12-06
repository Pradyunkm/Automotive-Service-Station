import { FileText, Download, Share2, CreditCard, CheckCircle2, Clock, ImageIcon } from 'lucide-react';
import { ServiceRecord, Vehicle } from '../types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ComparisonModal } from './ComparisonModal';

interface FeedAnalysis {
  front: { scratches: number; dents: number; cracks: number; imageUrl: string; beforeImage: string; annotatedImage: string; annotatedImageUrl: string; brakeStatus?: "Good" | "Bad" };
  left: { scratches: number; dents: number; cracks: number; imageUrl: string; beforeImage: string; annotatedImage: string; annotatedImageUrl: string; brakeStatus?: "Good" | "Bad" };
  right: { scratches: number; dents: number; cracks: number; imageUrl: string; beforeImage: string; annotatedImage: string; annotatedImageUrl: string; brakeStatus?: "Good" | "Bad" };
  brake: { scratches: number; dents: number; cracks: number; imageUrl: string; beforeImage: string; annotatedImage: string; annotatedImageUrl: string; brakeStatus?: "Good" | "Bad" };
}

interface PaymentReceiptProps {
  vehicle: Vehicle;
  serviceRecord: ServiceRecord;
  feedAnalysis: FeedAnalysis;
  onGenerateReceipt: () => void;
}

export function PaymentReceipt({ serviceRecord, feedAnalysis, onGenerateReceipt }: PaymentReceiptProps) {
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: '',
    beforeImage: null as string | null,
    afterImage: null as string | null,
    stats: { scratches: 0, dents: 0, marks: 0 },
    status: undefined as "Good" | "Bad" | undefined
  });

  const generateQRCode = () => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='white'/%3E%3Ctext x='100' y='100' font-size='12' text-anchor='middle' fill='black'%3EQRCODE%3C/text%3E%3C/svg%3E`;
  };

  const handleOpenModal = (station: 'front' | 'left' | 'right' | 'brake') => {
    const data = feedAnalysis[station];
    setModalData({
      isOpen: true,
      title: station,
      beforeImage: data.beforeImage,
      afterImage: data.annotatedImage,
      stats: {
        scratches: data.scratches,
        dents: data.dents,
        marks: data.cracks
      },
      status: data.brakeStatus
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Background animated orb */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
      />

      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header with animated gradient */}
        <motion.div
          className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6 overflow-hidden"
          whileHover={{ scale: 1.01 }}
        >
          <motion.div
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <div className="relative flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold text-xl tracking-tight">Payment & Receipt</h3>
              <p className="text-white/80 text-sm">Service Invoice Details</p>
            </div>
          </div>
        </motion.div>

        <div className="p-8 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/20 overflow-hidden group"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </motion.div>
                  <p className="text-xs text-gray-300 font-medium">Service Status</p>
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${serviceRecord.service_status === 'Completed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                  }`}>
                  {serviceRecord.service_status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
                  {serviceRecord.service_status === 'In Progress' && <Clock className="w-4 h-4 animate-spin" />}
                  {serviceRecord.service_status}
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/20 overflow-hidden group"
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </motion.div>
                  <p className="text-xs text-gray-300 font-medium">Payment Status</p>
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${serviceRecord.payment_status === 'Paid'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  }`}>
                  {serviceRecord.payment_status === 'Paid' && <CheckCircle2 className="w-4 h-4" />}
                  {serviceRecord.payment_status === 'Pending' && <Clock className="w-4 h-4 animate-pulse" />}
                  {serviceRecord.payment_status}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Inspection Images Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/30 overflow-hidden"
          >
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
            />

            <div className="relative space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center"
                >
                  <ImageIcon className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">Inspection Summary</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['front', 'left', 'right', 'brake'] as const).map((station, index) => {
                  const data = feedAnalysis[station];
                  const hasImage = data.annotatedImage || data.scratches > 0 || data.dents > 0 || data.cracks > 0;

                  return (
                    <motion.div
                      key={station}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: hasImage ? 1.05 : 1, y: hasImage ? -5 : 0 }}
                      onClick={() => hasImage && handleOpenModal(station)}
                      className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/20 overflow-hidden group ${hasImage ? 'cursor-pointer' : 'opacity-50'
                        }`}
                    >
                      {/* Station Image or Placeholder */}
                      <div className="relative aspect-video bg-slate-800/50 rounded-lg mb-2 overflow-hidden">
                        {data.annotatedImage ? (
                          <>
                            <img
                              src={data.annotatedImage}
                              alt={`${station} inspection`}
                              className="w-full h-full object-cover"
                            />
                            {hasImage && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  whileHover={{ scale: 1 }}
                                  className="bg-white/90 backdrop-blur-sm rounded-full p-2"
                                >
                                  <ImageIcon className="w-4 h-4 text-slate-800" />
                                </motion.div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-xs text-slate-500 font-semibold">No image</p>
                          </div>
                        )}
                      </div>

                      {/* Station Name */}
                      <h4 className="text-xs font-bold text-white uppercase mb-2 text-center">
                        {station}
                      </h4>

                      {/* Defect Counts or Status */}
                      {station === 'brake' ? (
                        <div className="flex items-center justify-center mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${data.brakeStatus === 'Bad'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                            {data.brakeStatus || 'Pending'}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="bg-red-500/30 rounded-lg p-1.5 border-2 border-red-400/50">
                            <div className="text-red-200 font-black text-sm">{data.dents}</div>
                            <div className="text-red-300 text-[9px] font-semibold">DENT</div>
                          </div>
                          <div className="bg-yellow-500/30 rounded-lg p-1.5 border-2 border-yellow-400/50">
                            <div className="text-yellow-200 font-black text-sm">{data.scratches}</div>
                            <div className="text-yellow-300 text-[9px] font-semibold">SCRATCH</div>
                          </div>
                          <div className="bg-purple-500/30 rounded-lg p-1.5 border-2 border-purple-400/50">
                            <div className="text-purple-200 font-black text-sm">{data.cracks}</div>
                            <div className="text-purple-300 text-[9px] font-semibold">MARK</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Bill Details Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/30 overflow-hidden"
          >
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
            />

            <div className="relative space-y-4">
              {/* Individual Line Items */}
              <motion.div
                whileHover={{ x: 5 }}
                className="flex justify-between items-center pb-3 border-b border-white/10 group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Dent Repair</span>
                <span className="text-sm font-bold text-white">
                  ₹{(serviceRecord.dents_count * 500).toFixed(2)}
                </span>
              </motion.div>

              <motion.div
                whileHover={{ x: 5 }}
                className="flex justify-between items-center pb-3 border-b border-white/10 group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Scratch Repair</span>
                <span className="text-sm font-bold text-white">
                  ₹{(serviceRecord.scratches_count * 300).toFixed(2)}
                </span>
              </motion.div>

              <motion.div
                whileHover={{ x: 5 }}
                className="flex justify-between items-center pb-3 border-b border-white/10 group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Brake Service</span>
                <span className="text-sm font-bold text-white">
                  ₹{(serviceRecord.brake_wear_rate * 20).toFixed(2)}
                </span>
              </motion.div>

              <motion.div
                whileHover={{ x: 5 }}
                className="flex justify-between items-center pb-3 border-b border-white/10 group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Diagnostic Fee</span>
                <span className="text-sm font-bold text-white">₹500.00</span>
              </motion.div>

              {/* Total Amount */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex justify-between items-center pt-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <span className="text-lg font-bold text-white">Total Amount</span>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl font-black bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent"
                >
                  ₹{serviceRecord.total_cost.toFixed(2)}
                </motion.span>
              </motion.div>
            </div>
          </motion.div>

          {/* QR Code Payment Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
            />

            <div className="relative flex items-center justify-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(168, 85, 247, 0.3)',
                      '0 0 40px rgba(236, 72, 153, 0.5)',
                      '0 0 20px rgba(168, 85, 247, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white p-4 rounded-2xl border-4 border-purple-400/50"
                >
                  <img src={generateQRCode()} alt="Payment QR" className="w-32 h-32" />
                </motion.div>
                {/* Corner accents */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-pink-400 rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-pink-400 rounded-br-lg" />
              </motion.div>

              <div className="text-center space-y-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <p className="text-lg font-bold text-white mb-1">Scan to Pay</p>
                </motion.div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/50 to-pink-600/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <p className="text-sm text-gray-200 font-medium">UPI Payment</p>
                </div>
                <p className="text-xs text-gray-400">PhonePe • GPay • Paytm</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <motion.button
              onClick={onGenerateReceipt}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-xl font-bold shadow-2xl overflow-hidden group"
            >
              <motion.div
                animate={{ x: ['0%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Download className="w-5 h-5 relative z-10" />
              </motion.div>
              <span className="relative z-10">Download Receipt</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl text-white rounded-xl font-bold border border-white/30 shadow-xl overflow-hidden group"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Share2 className="w-5 h-5" />
              </motion.div>
              <span>Share</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/30 to-purple-600/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        title={modalData.title}
        beforeImage={modalData.beforeImage}
        afterImage={modalData.afterImage}
        stats={modalData.stats}
        status={modalData.status}
      />
    </motion.div>
  );
}
