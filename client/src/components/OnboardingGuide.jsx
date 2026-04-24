import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    ShieldAlert, 
    GraduationCap, 
    Map, 
    Gamepad2, 
    Trophy, 
    ChevronRight, 
    CheckCircle2, 
    Info,
    X
} from 'lucide-react'

const STEPS = [
    {
        title: "Selamat Datang di Akebono Cyber Academy!",
        description: "Platform edukasi interaktif yang dirancang khusus untuk meningkatkan kesadaran keamanan siber Anda dengan cara yang menyenangkan.",
        icon: ShieldAlert,
        color: "#FFD60A",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Mulai dari E-Learning",
        description: "Sebelum terjun ke simulasi, pelajari materi dasar di menu E-Learning. Pengetahuan ini akan sangat membantu Anda dalam menyelesaikan misi.",
        icon: GraduationCap,
        color: "#60a5fa",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Peta Perjalanan (Roadmap)",
        description: "Lihat progres Anda di Roadmap. Selesaikan setiap level secara berurutan untuk membuka tantangan baru dan meningkatkan keahlian Anda.",
        icon: Map,
        color: "#a78bfa",
        image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Simulasi Visual Novel",
        description: "Uji kemampuan Anda melalui simulasi kasus nyata. Ambil keputusan yang tepat untuk melindungi perusahaan dari ancaman siber.",
        icon: Gamepad2,
        color: "#fb923c",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Poin & Papan Peringkat",
        description: "Kumpulkan XP dari setiap aktivitas, raih badge eksklusif, dan bersainglah dengan rekan kerja Anda di papan peringkat perusahaan.",
        icon: Trophy,
        color: "#22c55e",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
    }
]

export default function OnboardingGuide({ isOpen, onComplete, isForced = false }) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [understood, setUnderstood] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            setCurrentStep(0)
            setUnderstood(false)
        } else {
            setIsVisible(false)
        }
    }, [isOpen])

    const handleNext = () => {
        if (!understood) return
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
            setUnderstood(false)
        } else {
            onComplete()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
            setUnderstood(true) // Already seen
        }
    }

    if (!isVisible) return null

    const step = STEPS[currentStep]

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                {/* Close button - only if not forced */}
                {!isForced && (
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-card max-w-4xl w-full overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10"
                    style={{ minHeight: '500px' }}
                >
                    {/* Image Side */}
                    <div className="md:w-5/12 relative overflow-hidden bg-secondary">
                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={currentStep}
                                src={step.image} 
                                alt={step.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex gap-2">
                                {STEPS.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-white/60 text-[10px] mt-4 uppercase tracking-widest font-bold">
                                Langkah {currentStep + 1} dari {STEPS.length}
                            </p>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-between bg-card-bg">
                        <div>
                            <motion.div 
                                key={`icon-${currentStep}`}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
                                style={{ backgroundColor: `${step.color}20` }}
                            >
                                <step.icon className="w-8 h-8" style={{ color: step.color }} />
                            </motion.div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`text-${currentStep}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-3xl font-bold text-main mb-4 leading-tight">
                                        {step.title}
                                    </h2>
                                    <p className="text-muted text-lg leading-relaxed">
                                        {step.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-8 mt-12 pt-8 border-t border-card-border">
                            {/* Interaction to confirm understanding */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div 
                                    onClick={() => setUnderstood(!understood)}
                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${understood ? 'bg-primary border-primary text-white' : 'border-card-border group-hover:border-primary'}`}
                                >
                                    {understood && <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <span className={`text-sm transition-colors ${understood ? 'text-main font-semibold' : 'text-dim'}`}>
                                    Saya telah memahami poin ini
                                </span>
                            </label>

                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={handleBack}
                                    className={`px-6 py-2 text-sm font-semibold transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-dim hover:text-main'}`}
                                >
                                    Kembali
                                </button>

                                <button 
                                    onClick={handleNext}
                                    disabled={!understood}
                                    className={`px-8 py-3 flex items-center gap-2 text-sm transition-all ${!understood ? 'opacity-50 grayscale cursor-not-allowed' : 'btn-primary'}`}
                                >
                                    {currentStep === STEPS.length - 1 ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" /> Mulai Sekarang
                                        </>
                                    ) : (
                                        <>
                                            Lanjut <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
