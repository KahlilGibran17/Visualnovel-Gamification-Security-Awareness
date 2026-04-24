import { motion } from 'framer-motion'
import { BookOpen, Gamepad2, TrendingUp, Trophy, Star, Target, ShieldCheck } from 'lucide-react'
import Layout from '../components/Layout.jsx'

export default function GuidePage() {
    return (
        <Layout>
            <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(230,57,70,0.3)]">
                        <BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black font-display text-main mb-4 drop-shadow-md">Panduan Pengguna</h1>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Pelajari cara menggunakan platform Akebono Cyber Academy untuk meningkatkan insting keamanan siber Anda.
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {/* Section 1: Konsep Dasar */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6 md:p-8"
                    >
                        <h2 className="text-2xl font-bold text-main flex items-center gap-3 mb-4">
                            <Target className="w-6 h-6 text-accent" /> Konsep Dasar
                        </h2>
                        <p className="text-muted leading-relaxed">
                            Akebono Cyber Academy menggunakan metode <strong>Gamifikasi</strong> dan <strong>Simulasi Berbasis Cerita</strong>. Anda tidak hanya membaca materi, tetapi Anda akan dihadapkan pada situasi sehari-hari di kantor (seperti menerima email mencurigakan atau bertemu orang asing) dan harus membuat keputusan untuk menjaga keamanan data perusahaan.
                        </p>
                    </motion.section>

                    {/* Section 2: Alur Pembelajaran */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6 md:p-8"
                    >
                        <h2 className="text-2xl font-bold text-main flex items-center gap-3 mb-6">
                            <ShieldCheck className="w-6 h-6 text-primary" /> Alur Pembelajaran
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border relative">
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">1</div>
                                <BookOpen className="w-8 h-8 text-blue-400 mb-3" />
                                <h3 className="font-bold text-main mb-2">E-Learning</h3>
                                <p className="text-sm text-muted">Selesaikan materi bacaan wajib terlebih dahulu. Ini adalah pondasi teori Anda.</p>
                            </div>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border relative">
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">2</div>
                                <Gamepad2 className="w-8 h-8 text-emerald-400 mb-3" />
                                <h3 className="font-bold text-main mb-2">Simulasi Game</h3>
                                <p className="text-sm text-muted">Masuk ke level game. Baca percakapan, dan pilih respons yang paling aman.</p>
                            </div>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border relative">
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">3</div>
                                <TrendingUp className="w-8 h-8 text-accent mb-3" />
                                <h3 className="font-bold text-main mb-2">Buka Level Baru</h3>
                                <p className="text-sm text-muted">Setelah berhasil menyelesaikan satu level, level berikutnya di Peta Misi akan terbuka.</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Section 3: Peta Misi & Roadmap */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6 md:p-8"
                    >
                        <h2 className="text-2xl font-bold text-main flex items-center gap-3 mb-4">
                            <Gamepad2 className="w-6 h-6 text-emerald-400" /> Peta Misi (Roadmap)
                        </h2>
                        <p className="text-muted leading-relaxed mb-4">
                            Di menu <strong>Mulai Main</strong>, Anda akan melihat Peta Misi. Ikuti alur jalur tersebut dari atas ke bawah. 
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-muted">
                            <li>Level yang masih digembok berarti Anda harus menyelesaikan level sebelumnya terlebih dahulu.</li>
                            <li>Tidak ada jalan pintas (lompat level). Keamanan dibangun selangkah demi selangkah!</li>
                            <li>Klik pada node (titik) yang menyala untuk memulai modul atau simulasi tersebut.</li>
                        </ul>
                    </motion.section>

                    {/* Section 4: Poin, Pangkat, dan Peringkat */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6 md:p-8"
                    >
                        <h2 className="text-2xl font-bold text-main flex items-center gap-3 mb-4">
                            <Trophy className="w-6 h-6 text-accent" /> Sistem Poin (XP) & Peringkat
                        </h2>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 space-y-4">
                                <p className="text-muted leading-relaxed">
                                    Setiap kali Anda menyelesaikan simulasi, Anda akan mendapatkan <strong>Experience Points (XP)</strong>.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-card-bg p-3 rounded-lg border border-card-border">
                                        <Star className="w-5 h-5 text-accent" />
                                        <div className="text-sm text-muted">Akhir yang baik memberikan XP lebih besar daripada akhir yang buruk.</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-card-bg p-3 rounded-lg border border-card-border">
                                        <Target className="w-5 h-5 text-green-400" />
                                        <div className="text-sm text-muted">Memilih jawaban yang tepat tanpa kesalahan memberikan Bonus XP.</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-card-bg p-3 rounded-lg border border-card-border">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        <div className="text-sm text-muted">Kumpulkan XP untuk naik Pangkat dan memanjat Leaderboard (Peringkat).</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>

                <div className="mt-12 text-center pb-10">
                    <p className="text-dim italic">Tetap waspada, tetap aman. Selamat bermain!</p>
                </div>
            </div>
        </Layout>
    )
}
