import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ShieldAlert, Lock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Cyberpunk Red Shield Icon ────────────────────────────────────────────────
function CyberShieldIcon() {
    return (
        <svg width="52" height="60" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M26 2L4 11V29C4 42.5 13.8 55.2 26 58C38.2 55.2 48 42.5 48 29V11L26 2Z"
                stroke="#ff2a3b"
                strokeWidth="1.5"
                fill="url(#shieldFillRed)"
            />
            {/* Diagonal accent cuts */}
            <path d="M26 2L4 11" stroke="#ff6b35" strokeWidth="0.75" opacity="0.7" />
            <path d="M26 2L48 11" stroke="#ff6b35" strokeWidth="0.75" opacity="0.7" />
            {/* Inner secondary frame */}
            <path
                d="M26 8L9 15V29C9 39.5 16.5 49.2 26 52C35.5 49.2 43 39.5 43 29V15L26 8Z"
                stroke="#ff2a3b"
                strokeWidth="0.5"
                opacity="0.3"
                fill="none"
            />
            {/* Checkmark */}
            <path
                d="M17 30l7 7 11-13"
                stroke="#ff2a3b"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Corner cuts */}
            <path d="M4 11 L9 7" stroke="#ff2a3b" strokeWidth="1" opacity="0.5" />
            <path d="M48 11 L43 7" stroke="#ff2a3b" strokeWidth="1" opacity="0.5" />
            <defs>
                <linearGradient id="shieldFillRed" x1="26" y1="2" x2="26" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff2a3b" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#7f0011" stopOpacity="0.04" />
                </linearGradient>
            </defs>
        </svg>
    )
}

// ─── HUD Corner Brackets ──────────────────────────────────────────────────────
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

function GlitchText({ text, className }) {
    return (
        <span className={`relative inline-block ${className}`} data-text={text}>
            {text}
            <span
                className="absolute inset-0 text-primary"
                style={{
                    clipPath: 'inset(40% 0 55% 0)',
                    animation: 'glitch-anim 3s infinite linear alternate-reverse',
                    opacity: 0.7,
                }}
                aria-hidden
            >
                {text}
            </span>
            <span
                className="absolute inset-0 text-accent"
                style={{
                    clipPath: 'inset(60% 0 15% 0)',
                    animation: 'glitch-anim 2.5s infinite linear alternate',
                    opacity: 0.5,
                }}
                aria-hidden
            >
                {text}
            </span>
        </span>
    )
}

export default function LoginPage() {
    const [tab, setTab]           = useState('login')
    const [nik, setNik]           = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    const [loading, setLoading]   = useState(false)
    const [loadingStep, setLoadingStep] = useState('') // teks status loading
    const [error, setError]       = useState('')
    const [forgotNik, setForgotNik]   = useState('')
    const [forgotSent, setForgotSent] = useState(false)
    const [typedTag, setTypedTag] = useState('')

    const { login, forgotPassword } = useAuth()
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
            if (remember) {
                localStorage.setItem('ake_remembered_nik', nik.trim())
            } else {
                localStorage.removeItem('ake_remembered_nik')
            }
            toast.success(`Selamat datang, ${result.user.name.split(' ')[0]}! 🎮`)
            if (!result.user.setupDone) navigate('/setup')
            else if (result.user.role === 'admin') navigate('/admin')
            else if (result.user.role === 'super-admin') navigate('/super-admin')
            else navigate('/dashboard')
        } else {
            setError(result.error || 'NPK atau kata sandi salah.')
        }
    }

    const handleForgot = async (e) => {
        e.preventDefault()
        if (!forgotNik.trim()) {
            setError('Silakan masukkan NIK Anda.')
            return
        }
        setLoading(true)
        await forgotPassword(forgotNik.trim())
        setLoading(false)
        setForgotSent(true)
    }


    return (
        <div className="min-h-screen relative overflow-hidden bg-main flex items-center justify-center p-4 transition-colors duration-300">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

                @keyframes floatShield {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-5px); }
                }
                @keyframes redPulse {
                    0%, 100% { box-shadow: 0 0 10px rgba(255,42,59,0.2), inset 0 0 10px rgba(255,42,59,0.05); border-color: rgba(255,42,59,0.25); }
                    50%       { box-shadow: 0 0 28px rgba(255,42,59,0.5), inset 0 0 20px rgba(255,42,59,0.12); border-color: rgba(255,42,59,0.55); }
                }
                @keyframes blinkCursor {
                    50% { opacity: 0; }
                }
                @keyframes scanLineRed {
                    0%   { top: 0%;   opacity: 0; }
                    5%   { opacity: 0.7; }
                    95%  { opacity: 0.7; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes statusPulseRed {
                    0%, 100% { opacity: 1; box-shadow: 0 0 6px #ff2a3b; }
                    50%       { opacity: 0.3; box-shadow: none; }
                }
                @keyframes titleGlow {
                    0%, 100% { text-shadow: 0 0 20px rgba(255,42,59,0.25); }
                    50%       { text-shadow: 0 0 36px rgba(255,42,59,0.55), 0 0 60px rgba(255,42,59,0.15); }
                }
            `}</style>

            {/* Background grid */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,42,59,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,42,59,0.025) 1px, transparent 1px)
                `,
                backgroundSize: '44px 44px',
            }} />

            {/* Theme Toggle */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl glass-card border-card-border hover:bg-card-bg text-accent transition-all duration-300 shadow-xl"
                    title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6 text-indigo-400" />}
                </button>
            </div>

            {/* Background radial glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(255,42,59,0.08)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(255,107,53,0.04)' }} />
            </div>

            {/* Vignette */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 35%, #050a0f 100%)',
            }} />

            <div className="relative z-10 w-full max-w-md">

                {/* ── BRAND HEADER ── */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    {/* Shield box */}
                    <div className="flex justify-center mb-5">
                        <div style={{ position: 'relative', display: 'inline-block', padding: '16px' }}>
                            <HUDCorners />

                            <div style={{
                                backgroundColor: '#0f0508',
                                border: '1px solid rgba(255,42,59,0.25)',
                                padding: '14px 18px',
                                position: 'relative',
                                overflow: 'hidden',
                                animation: 'redPulse 3s ease-in-out infinite',
                            }}>
                                {/* Scan line */}
                                <div style={{
                                    position: 'absolute', left: 0, right: 0, height: '1px',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,42,59,0.6), transparent)',
                                    animation: 'scanLineRed 4s linear infinite',
                                    pointerEvents: 'none',
                                }} />

                                <div style={{ animation: 'floatShield 4s ease-in-out infinite' }}>
                                    <CyberShieldIcon />
                                </div>
                            </div>

                            {/* Status dot */}
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    backgroundColor: '#ff2a3b',
                                    animation: 'statusPulseRed 2s ease-in-out infinite',
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Classification label */}
                    <div style={{ marginBottom: '6px' }}>
                        <span style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '9px',
                            color: 'rgba(255,107,53,0.7)',
                            letterSpacing: '0.25em',
                            borderLeft: '2px solid rgba(255,107,53,0.5)',
                            borderRight: '2px solid rgba(255,107,53,0.5)',
                            padding: '2px 10px',
                        }}>
                            CYBER DIVISION
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold font-display mb-1">
                        <GlitchText text="AKEBONO" className="text-main" />
                    </h1>
                    <p className="text-muted text-sm font-medium tracking-widest uppercase mb-2">Brake Astra — Akademi Siber</p>
                    <motion.p
                        className="text-accent font-bold text-lg tracking-wide"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Apakah Anda Siap Menghadapi Siber? 🔐
                    </motion.p>
                </motion.div>
                {/* ── END BRAND HEADER ── */}

                {/* Main Card */}
                <motion.div
                    className="glass-card p-8"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 p-1 bg-card-bg rounded-lg">
                        <button
                            onClick={() => { setTab('login'); setError('') }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${tab === 'login' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'}`}
                        >
                            Masuk
                        </button>
                        <button
                            onClick={() => { setTab('forgot'); setError(''); setForgotSent(false) }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${tab === 'forgot' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'}`}
                        >
                            Lupa Kata Sandi
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'login' ? (
                            <motion.form
                                key="login"
                                onSubmit={handleLogin}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-sm text-muted font-medium mb-2 block">NPK / Nomor Pokok Karyawan</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                                        <input
                                            id="npk-input"
                                            type="text"
                                            value={nik}
                                            onChange={e => setNik(e.target.value)}
                                            placeholder="Masukkan NPK Anda"
                                            className="input-field pl-11"
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-muted font-medium mb-2 block">Kata Sandi</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                                        <input
                                            id="password-input"
                                            type={showPass ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Masukkan kata sandi Anda"
                                            className="input-field pl-11 pr-11"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        id="remember-toggle"
                                        onClick={() => setRemember(!remember)}
                                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${remember ? 'bg-primary' : 'bg-card-border'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${remember ? 'left-5' : 'left-1'}`} />
                                    </button>
                                    <span className="text-sm text-muted">Ingat saya</span>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-2 text-primary text-sm bg-primary/10 border border-primary/20 rounded-lg p-3"
                                        >
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    id="login-btn"
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 text-base"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                            <span className="text-sm">{loadingStep || 'Memproses...'}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-5 h-5" />
                                            Masuk ke Akademi
                                        </>
                                    )}
                                </motion.button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {!forgotSent ? (
                                    <form onSubmit={handleForgot} className="space-y-4">
                                        <div className="text-center mb-4">
                                            <Mail className="w-12 h-12 text-accent mx-auto mb-2" />
                                            <p className="text-muted text-sm">Masukkan NIK Anda dan kami akan mengirimkan tautan pengaturan ulang kata sandi ke email perusahaan Anda.</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-muted font-medium mb-2 block">NPK / Nomor Pokok Karyawan</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
                                                <input
                                                    id="forgot-npk-input"
                                                    type="text"
                                                    value={forgotNik}
                                                    onChange={e => setForgotNik(e.target.value)}
                                                    placeholder="Masukkan NPK Anda"
                                                    className="input-field pl-11"
                                                />
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 border border-primary/20 rounded-lg p-3">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}
                                        <button
                                            id="forgot-submit-btn"
                                            type="submit"
                                            disabled={loading}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Kirim Tautan Reset'}
                                        </button>
                                    </form>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >
                                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                        <h3 className="font-bold text-lg text-main mb-2">Tautan Reset Terkirim!</h3>
                                        <p className="text-muted text-sm">Periksa email perusahaan Anda untuk tautan pengaturan ulang kata sandi. Tautan ini akan kedaluwarsa dalam 24 jam.</p>
                                        <button
                                            onClick={() => { setTab('login'); setForgotSent(false) }}
                                            className="btn-secondary mt-4 w-full"
                                        >
                                            Kembali untuk Masuk
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <p className="text-center text-dim text-xs mt-4">
                    © 2026 Akebono Brake Astra • Cyber Academy v1.0
                </p>
            </div>
        </div>
    )
}