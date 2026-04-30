import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, BookOpen, Gamepad2, TrendingUp, X } from 'lucide-react'

export default function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenOnboarding')
        if (!hasSeen) {
            setIsOpen(true)
        }
    }, [])

    const handleClose = () => {
        localStorage.setItem('hasSeenOnboarding', 'true')
        setIsOpen(false)
    }

    const handleStart = () => {
        localStorage.setItem('hasSeenOnboarding', 'true')
        setIsOpen(false)
        navigate('/chapters')
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-card max-w-lg w-full relative overflow-hidden flex flex-col"
                >
                    {/* Decorative Header */}
                    <div className="bg-primary/20 p-6 flex flex-col items-center text-center relative border-b border-white/10">
                        <button 
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(230,57,70,0.5)]">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black font-display text-white">Selamat Datang di Akebono!</h2>
                        <p className="text-white/70 mt-2 text-sm leading-relaxed">
                            Platform pelatihan keamanan siber interaktif yang akan melatih insting Anda dalam mendeteksi dan menghadapi ancaman digital.
                        </p>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-6">
                        <h3 className="text-sm font-bold text-accent uppercase tracking-widest text-center">Alur Pembelajaran</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">1. Selesaikan E-Learning</h4>
                                    <p className="text-xs text-white/50 mt-1">Modul ini wajib diselesaikan pertama kali untuk membekali Anda dengan teori dasar.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                                    <Gamepad2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">2. Mainkan Simulasi</h4>
                                    <p className="text-xs text-white/50 mt-1">Uji pemahaman Anda melalui skenario interaktif bergaya visual novel.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="p-2 rounded-lg bg-accent/20 text-accent shrink-0">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">3. Tingkatkan Progres</h4>
                                    <p className="text-xs text-white/50 mt-1">Selesaikan level secara berurutan untuk membuka level berikutnya, raih XP, dan pantau peringkat Anda.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0 flex gap-3 mt-auto">
                        <button 
                            onClick={handleClose} 
                            className="btn-secondary flex-1 py-3"
                        >
                            Lewati
                        </button>
                        <button 
                            onClick={handleStart} 
                            className="btn-primary flex-1 py-3 font-bold"
                        >
                            Mulai Sekarang
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
