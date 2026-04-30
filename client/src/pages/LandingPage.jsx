import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Target, TrendingUp, AlertTriangle, Play, Award, ChevronRight, Eye, ShieldAlert, Cpu, Sun, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import axios from 'axios'

export default function LandingPage() {
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const [currentSlide, setCurrentSlide] = useState(0)
    const [cmsSlides, setCmsSlides] = useState([])

    const handleStart = () => {
        if (user) {
            navigate('/dashboard')
        } else {
            navigate('/login')
        }
    }

    const handleLogin = () => {
        navigate('/login')
    }

    // Default fallback slide data
    const defaultSlides = [
        {
            title: 'Simulasi Email Phishing',
            desc: 'Tampilan kotak masuk interaktif untuk berlatih mengenali ancaman siber.',
            ui: (
                <div className="w-full bg-[#1A1A2E]/80 rounded-lg border border-white/10 p-4 text-left shadow-lg">
                    <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><ShieldAlert className="w-4 h-4 text-primary" /></div>
                        <div>
                            <div className="text-sm font-semibold">IT Support</div>
                            <div className="text-[10px] text-white/40">support@akeb0no-security.com</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-2.5 bg-white/20 rounded w-full"></div>
                        <div className="h-2.5 bg-white/10 rounded w-2/3"></div>
                        <div className="mt-6 p-3 bg-primary/10 border border-primary/30 rounded inline-flex items-center gap-2">
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                            <span className="text-xs text-primary font-medium">Tautan Mencurigakan Terdeteksi</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Temukan Kejanggalan',
            desc: 'Analisis setiap elemen email secara detail. Temukan semua kejanggalan sebelum terlambat dan amankan sistem!',
            ui: (
                <div className="w-full space-y-3">
                    <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-3 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                        <span className="text-sm text-accent font-black pl-2">Alamat Pengirim Palsu</span>
                        <Target className="w-5 h-5 text-accent animate-pulse" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm text-white/50 pl-2">Lampiran File (.exe)</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm text-white/50 pl-2">Karakter Mendesak (Urgent)</span>
                    </div>
                </div>
            )
        },
        {
            title: 'Papan Peringkat Global',
            desc: 'Kompetisi sedang berlangsung! Top 3 Global akan mendapatkan hadiah spesial setiap bulannya.',
            ui: (
                <div className="w-full space-y-2 relative">
                    <div className="absolute -top-6 right-0 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30 animate-pulse font-black uppercase">Kompetisi Aktif</div>
                    {[1, 2, 3].map((rank) => (
                        <div key={rank} className={`flex items-center justify-between p-3 rounded-lg border ${rank === 1 ? 'bg-[#FFD60A]/10 border-[#FFD60A]/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold w-4 ${rank === 1 ? 'text-[#FFD60A]' : 'text-white/50'}`}>#{rank}</span>
                                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                                <div>
                                    <div className="h-2 bg-white/20 rounded w-20 mb-1"></div>
                                    <div className="h-1.5 bg-white/10 rounded w-12"></div>
                                </div>
                            </div>
                            <div className={`text-sm font-mono font-bold ${rank === 1 ? 'text-[#FFD60A]' : 'text-white/70'}`}>{1000 - (rank * 150)} XP</div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Hadiah Eksklusif Menanti!',
            desc: 'Selesaikan semua tantangan dan raih hadiah AirPods atau Smartwatch untuk 3 peringkat tertinggi! Kompetisi ini nyata, hadiahnya pun nyata.',
            ui: (
                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-dark/60 border border-white/10 rounded-2xl p-0 text-center shadow-2xl relative group overflow-hidden aspect-square">
                        <img src="/airpods_reward_3d.png" alt="AirPods Pro" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 left-0 right-0 text-[11px] text-accent font-black relative z-10 uppercase tracking-widest">AirPods Pro</div>
                    </div>
                    <div className="bg-dark/60 border border-white/10 rounded-2xl p-0 text-center shadow-2xl relative group overflow-hidden aspect-square">
                        <img src="/smartwatch_reward_3d.png" alt="Smartwatch" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 left-0 right-0 text-[11px] text-accent font-black relative z-10 uppercase tracking-widest">Smartwatch</div>
                    </div>
                    <div className="bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30 border border-accent/40 rounded-xl p-4 text-center col-span-2 shadow-lg">
                        <div className="text-xs text-main font-black mb-1 uppercase tracking-tighter">REWARD UNTUK TOP 3 GLOBAL</div>
                        <div className="text-sm text-accent font-black tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(230,57,70,0.5)]">Kompetisi Sedang Aktif!</div>
                    </div>
                </div>
            )
        }
    ]

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await axios.get('/api/cms/landing-slides')
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setCmsSlides(res.data)
                } else {
                    setCmsSlides(defaultSlides) // fallback
                }
            } catch (err) {
                setCmsSlides(defaultSlides)
            }
        }
        fetchSlides()
    }, [])

    const displaySlides = cmsSlides.length > 0 ? cmsSlides : defaultSlides

    useEffect(() => {
        if (displaySlides.length === 0) return
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % displaySlides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [displaySlides.length])

    return (
        <div className="min-h-screen bg-main text-main font-sans overflow-x-hidden selection:bg-primary/30 selection:text-white transition-colors duration-300">

            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 w-full h-[600px] bg-primary/5 blur-[150px] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-transparent -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-card-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide uppercase text-main">Akebono Cyber Academy</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-card-bg hover:bg-input-bg text-accent transition-colors mr-2"
                        title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                    </button>
                    {user ? (
                        <button onClick={handleStart} className="btn-secondary text-sm px-6 py-2">Dasbor</button>
                    ) : (
                        <button onClick={handleLogin} className="btn-secondary text-sm px-6 py-2">Masuk</button>
                    )}
                </div>
            </nav>

            <main className="relative z-10 px-4 pb-20">

                {/* Hero Section - Centered and focused on text */}
                <section className="max-w-4xl mx-auto pt-24 pb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-card-border bg-card-bg text-muted text-sm font-medium mb-8 backdrop-blur-sm">
                            <ShieldCheck className="w-4 h-4 text-accent" />
                            <span>Platform Pelatihan Keamanan Internal</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 text-main">
                            Latih Keterampilan Identifikasi <br className="hidden md:block" /> <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Ancaman Digital</span>
                        </h2>

                        <p className="text-lg md:text-xl text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
                            Platform pembelajaran berbasis simulasi untuk mengedukasi seluruh karyawan mengenai bahaya serangan identitas dan rekayasa sosial di lingkungan kerja modern.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={handleStart}
                                className="btn-primary w-full sm:w-auto px-10 py-4 text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-primary/20"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Mulai Simulasi
                            </button>
                            {!user && (
                                <button
                                    onClick={handleLogin}
                                    className="w-full sm:w-auto px-8 py-4 text-lg text-muted hover:text-main font-medium flex items-center justify-center gap-2 transition-colors border-2 border-card-border rounded-lg hover:bg-card-bg"
                                >
                                    Panduan Login
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* Visual Preview Section (Slider) */}
                {displaySlides.length > 0 && (
                    <section className="max-w-7xl mx-auto py-12 relative w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="relative"
                        >
                            <div className="glass-card border-card-border relative overflow-hidden backdrop-blur-2xl rounded-3xl shadow-2xl">

                                {/* Progress Bar */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-card-bg z-20">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-accent"
                                        key={currentSlide}
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                    />
                                </div>

                                <div className="grid lg:grid-cols-5 gap-0">
                                    {/* Text Side */}
                                    <div className="lg:col-span-2 p-10 md:p-14 flex flex-col justify-center border-r border-card-border bg-card-bg/50">
                                        <h3 className="text-3xl md:text-4xl font-bold text-main mb-6 leading-tight">{displaySlides[currentSlide].title}</h3>
                                        <p className="text-muted text-xl leading-relaxed mb-12 min-h-[100px]">
                                            {displaySlides[currentSlide].description || displaySlides[currentSlide].desc}
                                        </p>

                                        <div className="flex gap-2 mt-auto">
                                            {displaySlides.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentSlide(idx)}
                                                    className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-primary w-8' : 'bg-muted/20 w-2.5 hover:bg-muted/40'}`}
                                                    aria-label={`Go to slide ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Visual Side */}
                                    <div className="lg:col-span-3 bg-input-bg relative min-h-[400px] md:min-h-[600px] flex items-center justify-center p-12 overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentSlide}
                                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
                                                transition={{ duration: 0.4 }}
                                                className="w-full max-w-xl mx-auto flex justify-center items-center h-full"
                                            >
                                                {displaySlides[currentSlide].image_url ? (
                                                    <img
                                                        src={displaySlides[currentSlide].image_url}
                                                        alt={displaySlides[currentSlide].title}
                                                        className="w-full h-auto max-h-[400px] object-contain rounded-xl shadow-2xl"
                                                    />
                                                ) : (
                                                    <div className="w-full transform scale-110">
                                                        {displaySlides[currentSlide].ui || defaultSlides[currentSlide]?.ui || defaultSlides[0].ui}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* Platform Explanation */}
                <section className="bg-card-bg/50 py-24 border-y border-card-border mt-16 rounded-3xl mx-4">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-accent/20">
                            <ShieldCheck className="w-10 h-10 text-accent" />
                        </div>
                        <h3 className="text-3xl font-bold mb-6 text-main">Pengenalan Akebono Cyber Academy</h3>
                        <p className="text-xl text-muted leading-relaxed">
                            Aplikasi ini dirancang sebagai platform edukasi berkelanjutan untuk melatih kemampuan personel
                            dalam membedakan komunikasi elektronik yang sah dari upaya pencurian kredensial (phishing).
                            Karyawan akan menghadapi berbagai skenario dan belajar mengambil keputusan yang aman.
                        </p>
                    </div>
                </section>

                {/* Why It's Important */}
                <section className="max-w-6xl mx-auto py-24 px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold mb-4 text-main">Tujuan Organisasi</h3>
                        <p className="text-lg text-muted">Meningkatkan ketahanan dari bahaya rekayasa sosial.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass-card p-8 bg-transparent border-card-border hover:bg-card-bg/50 transition-colors rounded-2xl">
                            <AlertTriangle className="w-10 h-10 text-dim mb-6" />
                            <h4 className="text-xl font-bold mb-4 text-main">Mitigasi Risiko Utama</h4>
                            <p className="text-muted leading-relaxed text-base">
                                Serangan siber modern seringkali mengeksploitasi kelengahan staf dibandingkan sistem komputer. Mengenali email berbahaya adalah langkah pertahanan pertama yang vital.
                            </p>
                        </div>

                        <div className="glass-card p-8 bg-transparent border-card-border hover:bg-card-bg/50 transition-colors rounded-2xl">
                            <Cpu className="w-10 h-10 text-dim mb-6" />
                            <h4 className="text-xl font-bold mb-4 text-main">Simulasi Interaktif</h4>
                            <p className="text-muted leading-relaxed text-base">
                                Pemahaman teoritis diperkuat dengan metode latihan mandiri lewat contoh nyata, memungkinkan adaptasi yang lebih cepat tanpa risiko pada data perusahaan yang sesungguhnya.
                            </p>
                        </div>

                        <div className="glass-card p-8 bg-transparent border-card-border hover:bg-card-bg/50 transition-colors rounded-2xl">
                            <ShieldCheck className="w-10 h-10 text-dim mb-6" />
                            <h4 className="text-xl font-bold mb-4 text-main">Perlindungan Data</h4>
                            <p className="text-muted leading-relaxed text-base">
                                Kepatuhan setiap individu dalam mematuhi standar keamanan siber akan melindungi aset perusahaan, menjaga kredibilitas dan stabilitas operasional.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="max-w-4xl mx-auto text-center py-20 px-4">
                    <div className="glass-card p-12 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none">
                            <ShieldAlert className="w-64 h-64" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-main">Konfirmasi Pemahaman Anda</h2>
                            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
                                Silakan lakukan otentikasi menggunakan kredensial karyawan internal untuk memulai sesi modul pelatihan perdana Anda.
                            </p>
                            <button
                                onClick={handleStart}
                                className="btn-primary px-10 py-4 text-lg inline-flex items-center justify-center gap-3 shadow-xl"
                            >
                                {user ? 'Lanjut ke Dashboard' : 'Login ke Platform'}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-dim text-sm border-t border-card-border bg-card-bg/20">
                <p className="mb-2">© 2026 Akebono Brake Astra. Hak Cipta Dilindungi Undang-Undang.</p>
                <p className="font-mono text-xs opacity-50 tracking-wider uppercase">Sistem Keamanan Informasi & Teknologi</p>
            </footer>
        </div>
    )
}
