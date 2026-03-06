import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, BookOpen, MessageSquare, HelpCircle, Save, Loader2 } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import toast from 'react-hot-toast'
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
            toast.error('Failed to load chapters')
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
        // Validate JSON first before attempting save
        let parsedScenes
        try {
            parsedScenes = JSON.parse(jsonInput)
        } catch {
            toast.error('❌ Invalid JSON format — check syntax and try again')
            return
        }

        setIsSaving(true)
        try {
            const activeCh = chapters.find(c => c.id === selected)
            // Build payload with proper field names for the backend
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
            toast.success('✅ Chapter scenes updated successfully!')
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.error || err.message
            toast.error(`Failed to save: ${detail}`)
            console.error('Save error:', err.response?.data || err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-white">📝 Content Management</h1>
                    <p className="text-white/50 mt-1">Manage chapters, dialogue scenes, and quiz choices</p>
                </motion.div>

                {/* Chapter list */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <h2 className="font-bold text-white text-lg">Chapters</h2>
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Chapter
                        </button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {loading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                        ) : chapters.map((ch, i) => {
                            const sceneCount = Array.isArray(ch.scenes) ? ch.scenes.length : 0
                            const choiceCount = Array.isArray(ch.scenes) ? ch.scenes.filter(s => s.type === 'choice').length : 0

                            return (
                                <motion.div key={ch.id}
                                    className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${selected === ch.id ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                    onClick={() => handleSelect(selected === ch.id ? null : ch)}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary">
                                        {ch.id}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{ch.title}</p>
                                        <p className="text-white/50 text-sm">{ch.subtitle}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 text-sm text-white/40">
                                        <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {sceneCount} scenes</span>
                                        <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {choiceCount} choices</span>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${ch.status === 'Published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/50 border border-white/10'
                                        }`}>
                                        {ch.status}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={e => { e.stopPropagation(); handleSelect(ch) }}
                                            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); toast.error('Cannot delete base chapters') }}
                                            className="text-white/40 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Scene editor (shown when chapter selected) */}
                {selected && (
                    <motion.div className="glass-card p-6"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-white text-lg">✏️ Scene Editor — Chapter {selected}</h2>
                            <button className="btn-primary text-sm">
                                + Add Scene
                            </button>
                        </div>

                        <div className="bg-dark/40 rounded-xl p-4 mb-4">
                            <p className="text-white/50 text-sm mb-3">Raw JSON Configuration (Scenes & Choices Array)</p>
                            <textarea
                                className="input-field w-full h-[500px] text-xs font-mono resize-none leading-relaxed"
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                            />
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleSaveScenes} disabled={isSaving} className="btn-primary text-sm flex items-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save JSON Configuration
                                </button>
                                <button className="btn-secondary text-sm">Validating Preview coming soon</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
