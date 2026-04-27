import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { AvatarPicker } from '../components/AvatarDisplay.jsx'
import axios from 'axios'
import toast from '../utils/toast.js'

export default function CharacterSetupPage() {
    const { user, updateUser } = useAuth()
    const [displayName, setDisplayName] = useState(user?.name || '')
    const [avatarId, setAvatarId] = useState(user?.avatarId || 1)
    const [saving, setSaving] = useState(false)
    const [step, setStep] = useState(1) // 1=name, 2=avatar
    const navigate = useNavigate()

    const handleSave = async () => {
        if (!displayName.trim()) {
            toast.error('Silakan masukkan nama tampilan Anda')
            return
        }
        setSaving(true)
        try {
            await axios.put('/api/users/me', { displayName, avatarId })
        } catch {
            // demo mode — just update local state
        }
        updateUser({ name: displayName.trim(), avatarId, setupDone: true })
        toast.success('Karakter dibuat! Selamat datang di Akademi! 🎮')
        setTimeout(() => navigate('/dashboard'), 500)
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-main flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-hero-gradient opacity-50" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Header */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-main" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold font-display text-main mb-2">Buat Karakter Anda</h1>
                    <p className="text-muted">Pilih bagaimana Anda akan tampil di Akademi Siber</p>
                </motion.div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-primary text-main' : 'bg-white/10 text-main/40'
                                }`}>
                                {s}
                            </div>
                            {s === 1 && <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>

                <motion.div
                    className="glass-card p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-xl font-bold text-main mb-2">Siapa nama Anda?</h2>
                            <p className="text-muted text-sm mb-6">Ini akan ditampilkan di papan peringkat. Gunakan nama asli Anda untuk berkompetisi!</p>
                            <input
                                id="display-name-input"
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Nama lengkap Anda..."
                                className="input-field mb-6 text-lg"
                                maxLength={40}
                            />
                            <button
                                id="next-step-btn"
                                onClick={() => {
                                    if (!displayName.trim()) { toast.error('Masukkan nama Anda terlebih dahulu!'); return }
                                    setStep(2)
                                }}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                Selanjutnya: Pilih Avatar <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-xl font-bold text-main mb-2">Pilih avatar Anda</h2>
                            <p className="text-muted text-sm mb-6">Karakter Anda di papan peringkat dan dalam cerita.</p>
                            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                                    Kembali
                                </button>
                                <motion.button
                                    id="start-academy-btn"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-main border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        '🚀 Mulai Akademi!'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* AKE-BOT intro bubble */}
                <motion.div
                    className="mt-4 glass-card p-4 flex items-start gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xl flex-shrink-0">
                        🤖
                    </div>
                    <div>
                        <p className="text-accent font-bold text-sm mb-1">AKE-BOT</p>
                        <p className="text-muted text-sm leading-relaxed">
                            {step === 1
                                ? "Halo, rekrutan baru! Saya AKE-BOT, pemandu keamanan siber Anda di Akebono Brake Astra. Pertama, beri tahu saya nama Anda!"
                                : `Senang bertemu dengan Anda, ${displayName}! Sekarang pilih penampilan Anda — Anda akan membutuhkan identitas yang kuat untuk menghadapi peretas Ph1sh! 🔐`
                            }
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
