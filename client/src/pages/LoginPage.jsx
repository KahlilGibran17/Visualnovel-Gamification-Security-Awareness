import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ShieldAlert, Lock, User, Mail, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import toast from '../utils/toast.js'

function CyberShieldIcon() {
    return (
        <svg width="52" height="60" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M26 2L4 11V29C4 42.5 13.8 55.2 26 58C38.2 55.2 48 42.5 48 29V11L26 2Z"
                stroke="#ff2a3b"
                strokeWidth="1.5"
                fill="url(#shieldFillRed)"
            />
            <path d="M26 2L4 11" stroke="#ff6b35" strokeWidth="0.75" opacity="0.7" />
            <path d="M26 2L48 11" stroke="#ff6b35" strokeWidth="0.75" opacity="0.7" />
            <path
                d="M26 8L9 15V29C9 39.5 16.5 49.2 26 52C35.5 49.2 43 39.5 43 29V15L26 8Z"
                stroke="#ff2a3b"
                strokeWidth="0.5"
                opacity="0.3"
                fill="none"
            />
            <path
                d="M17 30l7 7 11-13"
                stroke="#ff2a3b"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <linearGradient id="shieldFillRed" x1="26" y1="2" x2="26" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff2a3b" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#7f0011" stopOpacity="0.04" />
                </linearGradient>
            </defs>
        </svg>
    )
}

function HUDCorners() {
    const Corner = ({ rotation, pos }) => (
        <div style={{ position: 'absolute', ...pos }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${rotation}deg)` }}>
                <path d="M0 10 L0 0 L10 0" stroke="#ff2a3b" strokeWidth="1.5" opacity="0.7" />
            </svg>
        </div>
    )
    return (
        <>
            <Corner rotation={0}   pos={{ top: 0,    left: 0   }} />
            <Corner rotation={90}  pos={{ top: 0,    right: 0  }} />
            <Corner rotation={-90} pos={{ bottom: 0, left: 0   }} />
            <Corner rotation={180} pos={{ bottom: 0, right: 0  }} />
        </>
    )
}

export default function LoginPage() {
    const [nik, setNik]           = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    const [loading, setLoading]   = useState(false)
    const [loadingStep, setLoadingStep] = useState('')
    const [error, setError]       = useState('')

    const { login } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    useEffect(() => {
        const savedNik = localStorage.getItem('ake_remembered_nik')
        if (savedNik) {
            setNik(savedNik)
            setRemember(true)
        }
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!nik.trim() || !password.trim()) {
            setError('Silakan masukkan NPK dan kata sandi Anda.')
            return
        }
        setLoading(true)
        setLoadingStep('Memvalidasi kredensial...')
        setError('')

        const result = await login(nik.trim(), password, remember)

        setLoading(false)
        setLoadingStep('')
        if (result.success) {
            if (remember) localStorage.setItem('ake_remembered_nik', nik.trim())
            else localStorage.removeItem('ake_remembered_nik')
            
            toast.success(`Selamat datang, ${result.user.name.split(' ')[0]}! 🎮`)
            if (!result.user.setupDone) navigate('/setup')
            else if (['admin', 'super-admin'].includes(result.user.role)) navigate(`/${result.user.role}`)
            else navigate('/dashboard')
        } else {
            setError(result.error || 'NPK atau kata sandi salah.')
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-main flex items-center justify-center p-4 transition-colors duration-300">
            <style>{`
                @keyframes floatShield { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
                @keyframes redPulse { 0%, 100% { box-shadow: 0 0 10px rgba(255,42,59,0.1); border-color: rgba(255,42,59,0.2); } 50% { box-shadow: 0 0 25px rgba(255,42,59,0.3); border-color: rgba(255,42,59,0.5); } }
                @keyframes scanLineRed { 0% { top: 0%; opacity: 0; } 5% { opacity: 0.5; } 95% { opacity: 0.5; } 100% { top: 100%; opacity: 0; } }
            `}</style>

            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl glass-card border-card-border hover:bg-card-bg text-accent transition-all duration-300 shadow-xl"
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6 text-indigo-400" />}
                </button>
            </div>

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#ff2a3b' }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#ff6b35' }} />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex justify-center mb-6">
                        <div className="relative p-4">
                            <HUDCorners />
                            <div className="bg-dark/80 border border-primary/30 p-4 relative overflow-hidden" style={{ animation: 'redPulse 3s infinite' }}>
                                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" style={{ animation: 'scanLineRed 4s linear infinite' }} />
                                <div style={{ animation: 'floatShield 4s ease-in-out infinite' }}><CyberShieldIcon /></div>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-main tracking-widest mb-1 font-display">AAIJ</h1>
                    <div className="flex items-center gap-3 justify-center mb-2">
                        <div className="w-10 h-px bg-gradient-to-r from-transparent to-primary/50" />
                        <span className="text-[10px] font-mono text-primary tracking-[0.3em] uppercase">Cyber Academy</span>
                        <div className="w-10 h-px bg-gradient-to-l from-transparent to-primary/50" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[10px] text-dim font-black uppercase tracking-wider mb-1.5 block">NPK Karyawan</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                                <input type="text" value={nik} onChange={e => setNik(e.target.value)} placeholder="Contoh: 10001" className="input-field pl-10 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-dim font-black uppercase tracking-wider mb-1.5 block">Kata Sandi</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-10 pr-10 text-sm" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-main transition-colors"><Eye className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setRemember(!remember)} className={`w-9 h-5 rounded-full transition-all relative ${remember ? 'bg-primary' : 'bg-card-border'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${remember ? 'left-5' : 'left-1'}`} /></button>
                            <span className="text-[11px] text-dim font-medium">Ingat Saya</span>
                        </div>
                        {error && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[11px] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-bold tracking-wider">
                            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{loadingStep || 'Processing...'}</span></> : <><ShieldAlert className="w-4 h-4" /> MASUK KE AKADEMI</>}
                        </button>
                    </form>
                </motion.div>
                <p className="text-center text-[10px] text-dim/50 mt-6 tracking-[0.2em] font-medium uppercase">© 2026 AAIJ • V1.0</p>
            </div>
        </div>
    )
}