import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Eye, EyeOff, Shield, ShieldCheck, ShieldAlert, Zap, Clock, Check, X } from 'lucide-react'

export default function PasswordSetupDisplay({ scene, onComplete }) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const config = scene.config || {}
    const minLength = config.minLength || 8
    const requireUppercase = !!config.requireUppercase
    const requireSymbol = !!config.requireSymbol

    // Strength analysis
    const analysis = useMemo(() => {
        if (!password) return { strength: 0, category: 'Weak', feedback: 'Masukan password...', color: 'text-dim' }
        
        let score = 0
        const feedback = []

        // Length
        if (password.length >= minLength) score += 25
        else feedback.push(`Minimal ${minLength} karakter`)

        // Uppercase
        if (/[A-Z]/.test(password)) score += 25
        else if (requireUppercase) feedback.push('Gunakan huruf besar')

        // Numbers
        if (/[0-9]/.test(password)) score += 25
        else feedback.push('Tambahkan angka')

        // Symbols
        if (/[^A-Za-z0-9]/.test(password)) score += 25
        else if (requireSymbol) feedback.push('Gunakan simbol (@#$%...)')

        // Category mapping
        let category = 'Weak'
        let color = 'text-red-400'
        let barColor = 'bg-red-500'
        
        if (score >= 100) {
            category = 'Strong'
            color = 'text-green-400'
            barColor = 'bg-green-500'
        } else if (score >= 50) {
            category = 'Medium'
            color = 'text-yellow-400'
            barColor = 'bg-yellow-500'
        }

        // Crack time estimation (Visual only)
        let crackTime = 'Beberapa detik'
        if (score >= 100) crackTime = 'Ribuan tahun'
        else if (score >= 75) crackTime = 'Beberapa bulan'
        else if (score >= 50) crackTime = 'Beberapa jam'

        return { 
            score, 
            category, 
            color, 
            barColor, 
            feedback: feedback.length > 0 ? feedback[0] : 'Password Sangat Kuat!',
            crackTime
        }
    }, [password, minLength, requireUppercase, requireSymbol])

    const handleConfirm = () => {
        if (!password) return

        setIsSubmitting(true)
        // Add a slight delay for cinematic feel
        setTimeout(() => {
            onComplete({
                password, // Send to server for secure hashing
                category: analysis.category,
                strength: analysis.score,
                xp: analysis.category === 'Strong' ? config.xpStrong : (analysis.category === 'Medium' ? config.xpMedium : config.xpWeak),
                impactScore: config.impactScore
            })
        }, 1200)
    }

    return (
        <motion.div 
            className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
        >
            {/* Header Area */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Key className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white font-display">Sistem Keamanan Akun</h2>
                        <p className="text-sm text-dim">Konfigurasi kredensial akses workstation Anda</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Instruction / Dialogue */}
                {scene.dialogue && (
                    <motion.div 
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-muted text-sm leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        "{scene.dialogue}"
                    </motion.div>
                )}

                {/* Input Field Area */}
                <div className="space-y-4">
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-dim uppercase tracking-widest mb-2 block px-1">Tentukan Password Baru</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full h-16 bg-dark/60 border-2 border-white/10 rounded-2xl px-6 pr-16 text-xl text-white font-mono tracking-widest focus:border-indigo-500/50 focus:bg-dark transition-all outline-none shadow-inner"
                                placeholder="••••••••"
                                autoFocus
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-white/10 text-dim transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex gap-4">
                <button 
                    onClick={handleConfirm}
                    disabled={isSubmitting || password.length === 0}
                    className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                        password.length > 0 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                        : 'bg-white/10 text-dim cursor-not-allowed'
                    }`}
                >
                    {isSubmitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Zap className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            <span>Simpan Kredensial</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Animated Submission Overlay */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div 
                        className="absolute inset-0 z-50 bg-indigo-600 flex flex-col items-center justify-center"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        transition={{ duration: 0.5, ease: 'circOut' }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ShieldCheck className="w-20 h-20 text-white mb-4" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white font-display">ENCRYPTING DATA</h3>
                        <p className="text-white/60 text-sm mt-2">Menyimpan profil keamanan permanen...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
