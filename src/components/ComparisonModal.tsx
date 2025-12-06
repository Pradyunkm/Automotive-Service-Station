import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    beforeImage: string | null;
    afterImage: string | null;
    stats: {
        scratches: number;
        dents: number;
        marks: number;
    };
    status?: "Good" | "Bad";
}

export function ComparisonModal({ isOpen, onClose, title, beforeImage, afterImage, stats, status }: ComparisonModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 px-8 py-6 flex justify-between items-center border-b border-white/10">
                                <motion.h2
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-3xl font-black text-white tracking-tight"
                                >
                                    {title.toUpperCase()} - COMPARISON
                                </motion.h2>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-all border border-white/20"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </motion.button>
                            </div>

                            {/* Content */}
                            <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    {/* Before Image */}
                                    <motion.div
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-3"
                                    >
                                        <h3 className="text-xl font-bold text-slate-800 text-center">Before</h3>
                                        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200 aspect-video">
                                            {beforeImage ? (
                                                <img
                                                    src={beforeImage}
                                                    alt="Before"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <p className="text-slate-400 font-semibold">No image captured</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* After Image */}
                                    <motion.div
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-3"
                                    >
                                        <h3 className="text-xl font-bold text-slate-800 text-center">After</h3>
                                        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200 aspect-video">
                                            {afterImage ? (
                                                <img
                                                    src={afterImage}
                                                    alt="After"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <p className="text-slate-400 font-semibold">No analysis performed</p>
                                                </div>
                                            )}

                                            {/* Annotations overlay - showing stats on the image */}
                                            {afterImage && !status && (
                                                <div className="absolute top-4 right-4 space-y-2">
                                                    {stats.scratches > 0 && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold"
                                                        >
                                                            scratch {stats.scratches}
                                                        </motion.div>
                                                    )}
                                                    {stats.dents > 0 && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.5 }}
                                                            className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold"
                                                        >
                                                            mark {stats.dents}
                                                        </motion.div>
                                                    )}
                                                    {stats.marks > 0 && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.6 }}
                                                            className="bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold"
                                                        >
                                                            mark {stats.marks}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Stats Summary or Status Display */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {status ? (
                                        <div className={`rounded-2xl p-8 text-center shadow-lg ${status === 'Bad'
                                                ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                : 'bg-gradient-to-br from-green-500 to-green-600'
                                            }`}>
                                            <p className="text-6xl font-black text-white mb-2">{status.toUpperCase()}</p>
                                            <p className="text-lg font-bold text-white/80 uppercase tracking-wider">Inspection Status</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-center shadow-lg">
                                                <p className="text-4xl font-black text-white mb-1">{stats.dents}</p>
                                                <p className="text-sm font-bold text-red-100 uppercase tracking-wider">Dents</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-4 text-center shadow-lg">
                                                <p className="text-4xl font-black text-white mb-1">{stats.scratches}</p>
                                                <p className="text-sm font-bold text-yellow-100 uppercase tracking-wider">Scratches</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg">
                                                <p className="text-4xl font-black text-white mb-1">{stats.marks}</p>
                                                <p className="text-sm font-bold text-purple-100 uppercase tracking-wider">Marks</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
