import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronLeft, X, CheckCircle2, Info } from 'lucide-react'

const TOUR_STEPS = [
    {
        id: 'welcome',
        title: "Selamat Datang di Akebono Cyber Academy!",
        description: "Mari kita berkeliling sejenak untuk memahami fitur-fitur utama platform ini.",
        target: null, // Modal center
        route: '/dashboard'
    },
    {
        id: 'profile',
        title: "Profil & Progres Anda",
        description: "Di sini Anda bisa memantau level, XP, dan informasi profil Anda secara lengkap.",
        target: '#dashboard-profile',
        route: '/dashboard',
        placement: 'bottom'
    },
    {
        id: 'nav-chapters',
        title: "Mulai Petualangan",
        description: "Klik menu ini untuk masuk ke Peta Misi dan mulai bermain simulasi.",
        target: '#nav-chapters',
        route: '/dashboard',
        placement: 'right'
    },
    {
        id: 'roadmap',
        title: "Peta Misi (Roadmap)",
        description: "Ini adalah jalur pembelajaran Anda. Selesaikan setiap modul dari atas ke bawah.",
        target: '#roadmap-container',
        route: '/chapters',
        placement: 'bottom'
    },
    {
        id: 'first-node',
        title: "Langkah Pertama",
        description: "Mulailah dari titik ini. Selesaikan pelatihan awal untuk membuka tantangan berikutnya.",
        target: '#node-0',
        route: '/chapters',
        placement: 'right'
    },
    {
        id: 'leaderboard',
        title: "Papan Peringkat",
        description: "Lihat posisi Anda dibandingkan rekan kerja lainnya. Jadilah ahli siber terbaik di perusahaan!",
        target: '#leaderboard-podium',
        route: '/leaderboard',
        placement: 'bottom'
    }
]

export default function GuidedTour({ isActive, currentStep, onStepChange, onComplete }) {
    const [targetRect, setTargetRect] = useState(null)
    const [dontShowAgain, setDontShowAgain] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const requestRef = useRef()
    const lastStepRef = useRef(-1)

    const step = TOUR_STEPS[currentStep]

    // Update highlight box position
    const updateTargetRect = () => {
        if (!step.target) {
            setTargetRect(null)
            return
        }
        const el = document.querySelector(step.target)
        if (el) {
            const rect = el.getBoundingClientRect()
            setTargetRect(rect)
            
            // Scroll into view if needed (only once per step change)
            if (currentStep !== lastStepRef.current) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                lastStepRef.current = currentStep
            }
        } else {
            setTargetRect(null)
        }
        requestRef.current = requestAnimationFrame(updateTargetRect)
    }

    useEffect(() => {
        if (isActive) {
            requestRef.current = requestAnimationFrame(updateTargetRect)
        } else {
            cancelAnimationFrame(requestRef.current)
        }
        return () => cancelAnimationFrame(requestRef.current)
    }, [isActive, currentStep])

    // Handle route navigation
    useEffect(() => {
        if (isActive && step.route && location.pathname !== step.route) {
            navigate(step.route)
        }
    }, [isActive, currentStep, location.pathname])

    if (!isActive) return null

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            onStepChange(currentStep + 1)
        } else {
            onComplete(dontShowAgain)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1)
        }
    }

    const isLastStep = currentStep === TOUR_STEPS.length - 1

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* SVG Overlay with mask */}
            <div className="absolute inset-0 pointer-events-auto">
                <svg className="w-full h-full">
                    <defs>
                        <mask id="tour-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect 
                                    x={targetRect.x - 8} 
                                    y={targetRect.y - 8} 
                                    width={targetRect.width + 16} 
                                    height={targetRect.height + 16} 
                                    rx="12" 
                                    fill="black" 
                                />
                            )}
                        </mask>
                    </defs>
                    <rect 
                        x="0" 
                        y="0" 
                        width="100%" 
                        height="100%" 
                        fill="rgba(0,0,0,0.8)" 
                        mask="url(#tour-mask)" 
                        className="backdrop-blur-[1px]"
                    />
                </svg>
            </div>

            {/* Content Container */}
            <div className={`absolute inset-0 p-4 pointer-events-none flex ${!targetRect ? 'items-center justify-center' : ''}`}>
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            // Dynamic positioning
                            position: 'absolute',
                            left: targetRect ? Math.max(20, Math.min(window.innerWidth - 380, targetRect.x + targetRect.width / 2 - 180)) : 'auto',
                            top: targetRect ? (
                                targetRect.bottom + 300 > window.innerHeight 
                                ? Math.max(20, targetRect.top - 280) // Place above if no space below
                                : targetRect.bottom + 20 // Place below
                            ) : 'auto',
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-card p-6 w-full max-w-sm pointer-events-auto shadow-2xl border border-primary/30 relative"
                    >
                        {/* Skip Button */}
                        <button 
                            onClick={() => onComplete(dontShowAgain)}
                            className="absolute top-3 left-3 p-1 rounded-full text-dim hover:text-primary hover:bg-primary/10 transition-all"
                            title="Lewati Panduan"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Step Indicator */}
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-dark">
                            {currentStep + 1}
                        </div>

                        <h3 className="text-xl font-bold text-main mb-2 pr-6 ml-6">{step.title}</h3>
                        <p className="text-muted text-sm leading-relaxed mb-6 ml-6">
                            {step.description}
                        </p>

                        <div className="ml-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDontShowAgain(!dontShowAgain);
                                    }}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${dontShowAgain ? 'bg-accent border-accent text-dark' : 'border-card-border group-hover:border-accent'}`}
                                >
                                    {dontShowAgain && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-[10px] text-dim font-medium uppercase tracking-wider">Jangan tampilkan lagi</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <button 
                                onClick={handleBack}
                                className={`p-2 rounded-lg text-dim hover:text-main hover:bg-white/5 transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex gap-1.5">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentStep ? 'bg-primary w-4' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>

                            <button 
                                onClick={handleNext}
                                className="btn-primary px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                {isLastStep ? 'Selesai' : 'Lanjut'} 
                                {!isLastStep && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Global Highlight Overlay Border */}
            {targetRect && (
                <motion.div 
                    initial={false}
                    animate={{
                        x: targetRect.x - 8,
                        y: targetRect.y - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute border-2 border-primary rounded-xl shadow-[0_0_30px_rgba(230,57,70,0.5)] z-[101] pointer-events-none"
                />
            )}
        </div>
    )
}
