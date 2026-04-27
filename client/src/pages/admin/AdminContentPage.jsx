import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, MessageSquare, HelpCircle, Save, Loader2 } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import toast from '../../utils/toast.js'
import axios from 'axios'

export default function AdminContentPage() {
    const [chapters, setChapters] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [jsonInput, setJsonInput] = useState('')

    useEffect(() => {
        fetchChapters()
    }, [])

    const fetchChapters = async () => {
        try {
            const { data } = await axios.get('/api/content/chapters')
            setChapters(data)
        } catch (err) {
            toast.error('Gagal memuat chapter')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (ch) => {
        if (!ch) {
            setSelected(null)
            return
        }
        setSelected(ch.id)
        setJsonInput(JSON.stringify(ch.scenes || [], null, 2))
    }

    const handleSaveScenes = async () => {
        let parsedScenes
        try {
            parsedScenes = JSON.parse(jsonInput)
        } catch {
            toast.error('❌ Format JSON tidak valid')
            return
        }

        setIsSaving(true)
        try {
            const activeCh = chapters.find(c => c.id === selected)
            const payload = {
                title: activeCh.title,
                subtitle: activeCh.subtitle,
                icon: activeCh.icon,
                location: activeCh.location,
                status: activeCh.status,
                scenes: parsedScenes,
            }

            const { data } = await axios.put(`/api/content/chapters/${selected}`, payload)
            setChapters(prev => prev.map(c => c.id === selected ? data : c))
            toast.success('✅ Chapter berhasil diperbarui!')
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.error || err.message
            toast.error(`Gagal menyimpan: ${detail}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-main">📝 Content Management</h1>
                    <p className="text-muted mt-1">Kelola chapter, adegan dialog, dan pilihan kuis</p>
                </motion.div>

                {/* Chapter list */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="p-5 border-b border-card-border flex items-center justify-between">
                        <h2 className="font-bold text-main text-lg">Chapters</h2>
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Chapter Baru
                        </button>
                    </div>
                    <div className="divide-y divide-card-border">
                        {loading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                        ) : chapters.length === 0 ? (
                            <div className="p-10 text-center text-dim">Tidak ada chapter ditemukan.</div>
                        ) : chapters.map((ch, i) => {
                            const sceneCount = Array.isArray(ch.scenes) ? ch.scenes.length : 0
                            const choiceCount = Array.isArray(ch.scenes) ? ch.scenes.filter(s => s.type === 'choice').length : 0

                            return (
                                <motion.div key={ch.id}
                                    className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${selected === ch.id ? 'bg-primary/10' : 'hover:bg-input-bg'}`}
                                    onClick={() => handleSelect(selected === ch.id ? null : ch)}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary">
                                        {ch.id}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-main">{ch.title}</p>
                                        <p className="text-muted text-sm">{ch.subtitle}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 text-sm text-dim">
                                        <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {sceneCount} adegan</span>
                                        <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {choiceCount} pilihan</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ch.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-input-bg text-muted'}`}>
                                        {ch.status}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={e => { e.stopPropagation(); handleSelect(ch) }}
                                            className="text-dim hover:text-main p-1.5 rounded-lg hover:bg-input-bg transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); toast.error('Chapter dasar tidak bisa dihapus') }}
                                            className="text-dim hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Scene editor */}
                {selected && (
                    <motion.div className="glass-card p-6"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-main text-lg">✏️ Scene Editor — Chapter {selected}</h2>
                        </div>

                        <div className="bg-card-bg rounded-xl p-4 mb-4 border border-card-border">
                            <p className="text-muted text-xs mb-3">Konfigurasi JSON Mentah (Array Scenes & Choices)</p>
                            <textarea
                                className="input-field w-full h-[500px] text-[10px] font-mono resize-none leading-relaxed"
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                            />
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleSaveScenes} disabled={isSaving} className="btn-primary text-sm flex items-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Konfigurasi JSON
                                </button>
                                <button className="btn-secondary text-sm" onClick={() => setSelected(null)}>Tutup</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
