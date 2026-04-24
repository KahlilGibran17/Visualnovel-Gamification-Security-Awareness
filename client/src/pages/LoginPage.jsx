import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ShieldAlert, Lock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

// Particle animation on canvas
function ParticleCanvas() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const particles = []
        const count = 80

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.7 ? '#E63946' : Math.random() > 0.5 ? '#FFD60A' : '#4a90d9',
            })
        }

        let animId
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 120) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(74, 144, 217, ${(1 - dist / 120) * 0.15})`
                        ctx.lineWidth = 0.5
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }
            // Draw particles
            particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.globalAlpha = p.opacity
                ctx.fill()
                ctx.globalAlpha = 1
            })
            animId = requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

// Glitch text effect
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
    const [tab, setTab] = useState('login') // 'login' | 'forgot'
    const [nik, setNik] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingStep, setLoadingStep] = useState('') // teks status loading
    const [error, setError] = useState('')
    const [forgotNik, setForgotNik] = useState('')
    const [forgotSent, setForgotSent] = useState(false)

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
            <ParticleCanvas />

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
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Brand Header */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <motion.div
                            className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center relative"
                            animate={{ boxShadow: ['0 0 20px rgba(230,57,70,0.4)', '0 0 50px rgba(230,57,70,0.8)', '0 0 20px rgba(230,57,70,0.4)'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <ShieldAlert className="w-10 h-10 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-ping" />
                        </motion.div>
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
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${tab === 'login' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'
                                }`}
                        >
                            Masuk
                        </button>
                        <button
                            onClick={() => { setTab('forgot'); setError(''); setForgotSent(false) }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${tab === 'forgot' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'
                                }`}
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
                                {/* NPK Field */}
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

                                {/* Password Field */}
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

                                {/* Remember Me */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        id="remember-toggle"
                                        onClick={() => setRemember(!remember)}
                                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${remember ? 'bg-primary' : 'bg-card-border'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${remember ? 'left-5' : 'left-1'
                                            }`} />
                                    </button>
                                    <span className="text-sm text-muted">Ingat saya</span>
                                </div>

                                {/* Error */}
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

                                {/* Submit */}
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
