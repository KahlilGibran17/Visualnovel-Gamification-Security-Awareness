import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { AvatarPicker } from '../components/AvatarDisplay.jsx'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CharacterSetupPage() {
    const { user, updateUser } = useAuth()
    const [displayName, setDisplayName] = useState(user?.name || '')
    const [avatarId, setAvatarId] = useState(user?.avatarId || 1)
    const [saving, setSaving] = useState(false)
    const [step, setStep] = useState(1) // 1=name, 2=avatar
    const navigate = useNavigate()

    const handleSave = async () => {
        if (!displayName.trim()) {
            toast.error('Please enter your display name')
            return
        }
        setSaving(true)
        try {
            await axios.put('/api/users/me', { displayName, avatarId })
        } catch {
            // demo mode — just update local state
        }
        updateUser({ name: displayName.trim(), avatarId, setupDone: true })
        toast.success('Character created! Welcome to the Academy! 🎮')
        setTimeout(() => navigate('/dashboard'), 500)
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
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
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2">Create Your Character</h1>
                    <p className="text-white/50">Choose how you'll appear in the Cyber Academy</p>
                </motion.div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
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
                            <h2 className="text-xl font-bold text-white mb-2">What's your name?</h2>
                            <p className="text-white/50 text-sm mb-6">This will be shown on the leaderboard. Use your real name for competition!</p>
                            <input
                                id="display-name-input"
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Your full name..."
                                className="input-field mb-6 text-lg"
                                maxLength={40}
                            />
                            <button
                                id="next-step-btn"
                                onClick={() => {
                                    if (!displayName.trim()) { toast.error('Enter your name first!'); return }
                                    setStep(2)
                                }}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                Next: Choose Avatar <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-xl font-bold text-white mb-2">Choose your avatar</h2>
                            <p className="text-white/50 text-sm mb-6">Your character on the leaderboard and in the story.</p>
                            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                                    Back
                                </button>
                                <motion.button
                                    id="start-academy-btn"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        '🚀 Start the Academy!'
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
                        <p className="text-white/70 text-sm leading-relaxed">
                            {step === 1
                                ? "Hello, new recruit! I'm AKE-BOT, your cybersecurity guide at Akebono Brake Astra. First, tell me your name!"
                                : `Nice to meet you, ${displayName}! Now pick your look — you'll need a strong identity to face the hacker Ph1sh! 🔐`
                            }
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
