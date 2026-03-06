import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Plus, Eye, Globe, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { SceneCard } from './SceneCard.jsx'

const STATUS_BADGE = {
    Published: 'bg-green-500/20 text-green-400 border-green-500/30',
    Draft: 'bg-white/10 text-white/40 border-white/10',
}

export default function ChapterEditor({ chapterId, onBack, onRefreshList }) {
    const [chapter, setChapter] = useState(null)
    const [scenes, setScenes] = useState([])
    const [characters, setCharacters] = useState([])
    const [backgrounds, setBackgrounds] = useState([])
    const [loading, setLoading] = useState(true)
    const [headerForm, setHeaderForm] = useState({})
    const [savingHeader, setSavingHeader] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [lastDraftSave, setLastDraftSave] = useState(null)

    useEffect(() => { loadAll() }, [chapterId])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [chRes, chrRes, bgRes] = await Promise.all([
                axios.get(`/api/cms/chapters/${chapterId}`),
                axios.get('/api/cms/characters'),
                axios.get('/api/cms/backgrounds'),
            ])
            const ch = chRes.data
            setChapter(ch)
            setHeaderForm({ title: ch.title, subtitle: ch.subtitle, icon: ch.icon, location: ch.location, status: ch.status })
            setScenes(ch.relationalScenes || [])
            setCharacters(chrRes.data)
            setBackgrounds(bgRes.data)
        } catch (err) {
            toast.error('Failed to load chapter: ' + (err.response?.data?.error || err.message))
        } finally {
            setLoading(false)
        }
    }

    const refreshScenes = async () => {
        try {
            const res = await axios.get(`/api/cms/chapters/${chapterId}/scenes`)
            setScenes(res.data)
        } catch { /* silent refresh failure */ }
    }

    const saveHeader = async () => {
        setSavingHeader(true)
        try {
            const res = await axios.put(`/api/cms/chapters/${chapterId}`, headerForm)
            setChapter(res.data)
            onRefreshList()
            toast.success('✅ Chapter details saved!')
        } catch (err) {
            toast.error('❌ Failed to save: ' + (err.response?.data?.detail || err.response?.data?.error || err.message))
        } finally {
            setSavingHeader(false)
        }
    }

    const saveDraft = async () => {
        setSavingDraft(true)
        try {
            // Save header first, then rebuild VN JSON
            await axios.put(`/api/cms/chapters/${chapterId}`, headerForm)
            const res = await axios.post(`/api/cms/chapters/${chapterId}/save-draft`)
            // Refresh scenes from server to ensure sync
            if (res.data.scenes) setScenes(res.data.scenes)
            else await refreshScenes()
            setLastDraftSave(new Date())
            onRefreshList()
            toast.success(`✅ Draft saved — ${res.data.sceneCount} scenes built`)
        } catch (err) {
            toast.error('❌ Draft save failed: ' + (err.response?.data?.detail || err.response?.data?.error || err.message))
        } finally {
            setSavingDraft(false)
        }
    }

    const publish = async () => {
        setPublishing(true)
        setShowPublishModal(false)
        try {
            await axios.put(`/api/cms/chapters/${chapterId}`, { ...headerForm, status: 'Published' })
            const res = await axios.post(`/api/cms/chapters/${chapterId}/publish`)
            setHeaderForm(p => ({ ...p, status: 'Published' }))
            if (res.data.scenes) setScenes(res.data.scenes)
            else await refreshScenes()
            onRefreshList()
            toast.success(`🎉 Published! ${res.data.sceneCount} scenes are now live.`)
        } catch (err) {
            toast.error('❌ Publish failed: ' + (err.response?.data?.detail || err.response?.data?.error || err.message))
        } finally {
            setPublishing(false)
        }
    }

    const addScene = async () => {
        try {
            const res = await axios.post(`/api/cms/chapters/${chapterId}/scenes`, {
                scene_name: `Scene ${scenes.length + 1}`,
                scene_type: 'dialogue', background: 'office',
            })
            setScenes(prev => [...prev, res.data])
            toast.success('Scene added ✓')
        } catch (err) {
            toast.error('❌ Failed to add scene: ' + (err.response?.data?.error || err.message))
        }
    }

    const updateScene = async (sceneId, data) => {
        // Called by SceneCard after successful API save — update local state
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...data } : s))
    }

    const deleteScene = async (sceneId) => {
        try {
            await axios.delete(`/api/cms/scenes/${sceneId}`)
            setScenes(prev => prev.filter(s => s.id !== sceneId))
            toast.success('Scene deleted')
        } catch (err) {
            toast.error('❌ Delete failed: ' + (err.response?.data?.error || err.message))
        }
    }

    const moveScene = async (fromIdx, toIdx) => {
        if (toIdx < 0 || toIdx >= scenes.length) return
        const reordered = [...scenes]
        const [moved] = reordered.splice(fromIdx, 1)
        reordered.splice(toIdx, 0, moved)
        setScenes(reordered)
        try {
            await axios.put(`/api/cms/chapters/${chapterId}/scenes/reorder`, { orderedIds: reordered.map(s => s.id) })
        } catch (err) {
            toast.error('❌ Reorder failed: ' + (err.response?.data?.error || err.message))
            await refreshScenes() // revert to server state
        }
    }

    const duplicateScene = async (scene) => {
        try {
            const res = await axios.post(`/api/cms/chapters/${chapterId}/scenes`, {
                scene_name: scene.scene_name + ' (copy)',
                scene_type: scene.scene_type, background: scene.background,
                char_left: scene.char_left, char_left_expr: scene.char_left_expr,
                char_right: scene.char_right, char_right_expr: scene.char_right_expr,
                speaker_name: scene.speaker_name, dialogue_text: scene.dialogue_text,
                question: scene.question, timer: scene.timer,
                ending_type: scene.ending_type, ending_title: scene.ending_title,
                ending_message: scene.ending_message, xp_bonus: scene.xp_bonus,
            })
            setScenes(prev => [...prev, res.data])
            toast.success('Scene duplicated ✓')
        } catch (err) {
            toast.error('❌ Duplicate failed')
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">{chapter?.title}</h2>
                    <p className="text-xs text-white/40 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[headerForm.status] || STATUS_BADGE.Draft}`}>
                            {headerForm.status === 'Published' ? '🟢 LIVE' : '⚪ Draft'}
                        </span>
                        {lastDraftSave && <span className="text-white/30">Last saved {lastDraftSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={saveDraft} disabled={savingDraft}
                        className="btn-secondary flex items-center gap-2 text-sm">
                        {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Draft
                    </button>
                    <button onClick={() => setShowPublishModal(true)} disabled={publishing || scenes.length === 0}
                        className="btn-primary flex items-center gap-2 text-sm">
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        Publish
                    </button>
                    <a href={`/play/${chapterId}`} target="_blank" rel="noreferrer"
                        className="btn-secondary flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4" /> Preview
                    </a>
                </div>
            </div>

            {/* Chapter Header Form */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">📋 Chapter Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                        <label className="label-xs">Chapter Title *</label>
                        <input className="input-field w-full mt-1" placeholder="e.g. First Day" value={headerForm.title || ''} onChange={e => setHeaderForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label-xs">Subtitle / Topic</label>
                        <input className="input-field w-full mt-1" placeholder="e.g. Phishing Email" value={headerForm.subtitle || ''} onChange={e => setHeaderForm(p => ({ ...p, subtitle: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label-xs">Location</label>
                        <input className="input-field w-full mt-1" placeholder="e.g. Office Lobby" value={headerForm.location || ''} onChange={e => setHeaderForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label-xs">Icon (Emoji)</label>
                        <input className="input-field w-full mt-1 text-xl" placeholder="📧" value={headerForm.icon || ''} onChange={e => setHeaderForm(p => ({ ...p, icon: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label-xs">Status</label>
                        <select className="input-field w-full mt-1" value={headerForm.status || 'Draft'} onChange={e => setHeaderForm(p => ({ ...p, status: e.target.value }))}>
                            <option value="Draft">⚪ Draft</option>
                            <option value="Published">🟢 Published</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex items-end">
                        <button onClick={saveHeader} disabled={savingHeader} className="btn-primary text-sm flex items-center gap-2">
                            {savingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Chapter Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Scene Builder */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">🎬 Scene Builder</h3>
                        <p className="text-white/40 text-sm">{scenes.length} scene{scenes.length !== 1 ? 's' : ''} — changes auto-save</p>
                    </div>
                    <button onClick={addScene} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Scene</button>
                </div>

                {scenes.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <h3 className="text-white font-semibold text-lg mb-2">No scenes yet</h3>
                        <p className="text-white/40 mb-6">Start building by adding the first scene</p>
                        <button onClick={addScene} className="btn-primary flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" /> Add First Scene</button>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                            {scenes.map((scene, idx) => (
                                <SceneCard
                                    key={scene.id}
                                    scene={scene}
                                    index={idx}
                                    scenes={scenes}
                                    characters={characters}
                                    backgrounds={backgrounds}
                                    onUpdate={updateScene}
                                    onDelete={deleteScene}
                                    onMoveUp={() => moveScene(idx, idx - 1)}
                                    onMoveDown={() => moveScene(idx, idx + 1)}
                                    onDuplicate={duplicateScene}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* Publish Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPublishModal(false)}>
                        <motion.div className="glass-card p-8 max-w-md w-full" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
                            <div className="text-5xl text-center mb-4">🌐</div>
                            <h3 className="text-xl font-bold text-white text-center mb-2">Publish Chapter?</h3>
                            <p className="text-white/60 text-sm text-center mb-2">
                                <span className="text-white font-semibold">"{headerForm.title}"</span> will be live for all employees immediately.
                            </p>
                            <p className="text-white/30 text-xs text-center mb-6">{scenes.length} scenes will be built into the game engine.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowPublishModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={publish} className="btn-primary flex-1 flex items-center justify-center gap-2"><Globe className="w-4 h-4" /> Publish Now</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
