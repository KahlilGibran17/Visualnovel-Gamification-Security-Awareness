import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Plus, Eye, Globe, Loader2, List, CornerDownRight, GripVertical, Upload, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { SceneCard } from './SceneCard.jsx'

const STATUS_BADGE = {
    Published: 'bg-green-500/20 text-green-400 border-green-500/30',
    Draft: 'bg-input-bg text-muted border-card-border',
}

export default function ChapterEditor({ chapterId, onBack, onRefreshList }) {
    const navigate = useNavigate()
    const [chapter, setChapter] = useState(null)
    const [scenes, setScenes] = useState([])
    const [characters, setCharacters] = useState([])
    const [backgrounds, setBackgrounds] = useState([])
    const [uiTypes, setUiTypes] = useState([])
    const [badges, setBadges] = useState([])
    const [loading, setLoading] = useState(true)
    const [headerForm, setHeaderForm] = useState({})
    const [savingHeader, setSavingHeader] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [lastDraftSave, setLastDraftSave] = useState(null)
    const [uploadingBgm, setUploadingBgm] = useState(false)
    const [showSceneMap, setShowSceneMap] = useState(true)
    const [jumpTo, setJumpTo] = useState('')
    const [dragIdx, setDragIdx] = useState(null)
    const [dragOverIdx, setDragOverIdx] = useState(null)
    const [dragPosition, setDragPosition] = useState(null)
    const sceneRefs = useRef({})

    useEffect(() => { loadAll() }, [chapterId])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [chRes, chrRes, bgRes, uiRes, badgesRes] = await Promise.all([
                axios.get(`/api/cms/chapters/${chapterId}`),
                axios.get('/api/cms/characters'),
                axios.get('/api/cms/backgrounds'),
                axios.get('/api/cms/ui-types'),
                axios.get('/api/cms/badges')
            ])
            const ch = chRes.data
            setChapter(ch)
            setHeaderForm({ 
                title: ch.title, 
                subtitle: ch.subtitle, 
                icon: ch.icon, 
                location: ch.location, 
                status: ch.status, 
                music_theme: ch.music_theme,
                badge_id: ch.badge_id ? ch.badge_id.toString() : ''
            })
            setScenes(ch.relationalScenes || [])
            setCharacters(chrRes.data)
            setBackgrounds(bgRes.data)
            setUiTypes(uiRes.data)
            setBadges(badgesRes.data)
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

    const handleUploadBgm = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingBgm(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await axios.post('/api/cms/media/upload', fd)
            setHeaderForm(p => ({ ...p, music_theme: res.data.url }))
            toast.success('Music theme uploaded')
        } catch (err) {
            toast.error('Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploadingBgm(false)
            e.target.value = ''
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
            toast.success('Scene ditambahkan di akhir ✓')
            // Scroll to newly added scene
            setTimeout(() => {
                const key = res.data.id
                sceneRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 200)
        } catch (err) {
            toast.error('❌ Failed to add scene: ' + (err.response?.data?.error || err.message))
        }
    }

    // Insert a new scene immediately AFTER a given index
    const insertSceneAfter = async (afterIdx) => {
        try {
            const res = await axios.post(`/api/cms/chapters/${chapterId}/scenes`, {
                scene_name: `Scene ${afterIdx + 2}`,
                scene_type: 'dialogue', background: 'office',
            })
            const newScene = res.data
            // Insert into local state at afterIdx+1
            const updated = [...scenes]
            updated.splice(afterIdx + 1, 0, newScene)
            setScenes(updated)
            // Reorder on server
            await axios.put(`/api/cms/chapters/${chapterId}/scenes/reorder`, { orderedIds: updated.map(s => s.id) })
            toast.success(`✅ Scene sisipan ditambahkan di posisi ${afterIdx + 2}`)
            setTimeout(() => {
                sceneRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 200)
        } catch (err) {
            toast.error('❌ Gagal sisipkan scene: ' + (err.response?.data?.error || err.message))
            await refreshScenes()
        }
    }

    const jumpToScene = (num) => {
        const idx = parseInt(num) - 1
        if (idx < 0 || idx >= scenes.length) { toast.error('Nomor scene tidak valid'); return }
        const scene = scenes[idx]
        sceneRefs.current[scene.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleMapDragOver = (e, idx) => {
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        const midPoint = rect.left + rect.width / 2
        const position = e.clientX < midPoint ? 'before' : 'after'
        
        if (dragOverIdx !== idx || dragPosition !== position) {
            setDragOverIdx(idx)
            setDragPosition(position)
        }
    }

    const onMapDragEnd = async () => {
        if (dragIdx === null || dragOverIdx === null) {
            setDragIdx(null); setDragOverIdx(null); setDragPosition(null); return
        }
        
        let toIdx = dragOverIdx
        if (dragPosition === 'after') {
            toIdx += 1
        }

        if (dragIdx < toIdx) {
            toIdx -= 1
        }

        if (dragIdx === toIdx) {
            setDragIdx(null); setDragOverIdx(null); setDragPosition(null); return
        }

        const reordered = [...scenes]
        const [moved] = reordered.splice(dragIdx, 1)
        reordered.splice(toIdx, 0, moved)
        setScenes(reordered)
        
        const originalToIdx = toIdx
        
        setDragIdx(null)
        setDragOverIdx(null)
        setDragPosition(null)
        
        setTimeout(() => {
            sceneRefs.current[moved.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
        try {
            await axios.put(`/api/cms/chapters/${chapterId}/scenes/reorder`, { orderedIds: reordered.map(s => s.id) })
            toast.success(`↕️ Scene "${moved.scene_name || moved.scene_type}" dipindah ke posisi ${originalToIdx + 1}`)
        } catch (err) {
            toast.error('❌ Gagal reorder: ' + (err.response?.data?.error || err.message))
            await refreshScenes()
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

    const duplicateScene = async (scene, idx) => {
        try {
            const res = await axios.post(`/api/cms/chapters/${chapterId}/scenes`, {
                scene_name: scene.scene_name + ' (salinan)',
                scene_type: scene.scene_type, background: scene.background,
                char_left: scene.char_left, char_left_expr: scene.char_left_expr,
                char_right: scene.char_right, char_right_expr: scene.char_right_expr,
                speaker_name: scene.speaker_name, dialogue_text: scene.dialogue_text,
                question: scene.question, timer: scene.timer,
                ending_type: scene.ending_type, ending_title: scene.ending_title,
                ending_message: scene.ending_message, xp_bonus: scene.xp_bonus,
            })
            const newScene = res.data
            // Insert AFTER the original scene
            const updated = [...scenes]
            updated.splice(idx + 1, 0, newScene)
            setScenes(updated)
            await axios.put(`/api/cms/chapters/${chapterId}/scenes/reorder`, { orderedIds: updated.map(s => s.id) })
            toast.success('Scene diduplikasi tepat di bawahnya ✓')
            setTimeout(() => {
                sceneRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 200)
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
                    <h2 className="text-xl font-bold text-main truncate">{chapter?.title}</h2>
                    <p className="text-xs text-muted flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[headerForm.status] || STATUS_BADGE.Draft}`}>
                            {headerForm.status === 'Published' ? '🟢 LIVE' : '⚪ Draft'}
                        </span>
                        {lastDraftSave && <span className="text-dim">Last saved {lastDraftSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => navigate(`/admin/flow/${chapterId}`)}
                        className="btn-secondary flex items-center gap-2 text-sm bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                    >
                        <GitBranch className="w-4 h-4" />
                        Flow Editor
                    </button>
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
                    <button onClick={async () => {
                        await saveDraft();
                        window.open(`/play/${chapterId}?token=${sessionStorage.getItem('ake_token') || localStorage.getItem('ake_token') || ''}`, '_blank')
                    }} disabled={savingDraft}
                        className="btn-secondary flex items-center gap-2 text-sm">
                        {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Preview
                    </button>
                </div>
            </div>

            {/* Chapter Header Form */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">📋 Chapter Details</h3>
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
                    <div>
                        <label className="label-xs">Lencana Reward (Badge)</label>
                        <select 
                            className="input-field w-full mt-1 text-sm bg-card-bg border-card-border" 
                            value={headerForm.badge_id || ''} 
                            onChange={e => setHeaderForm(p => ({ ...p, badge_id: e.target.value || null }))}
                        >
                            <option value="">❌ Tanpa Lencana</option>
                            {badges.map(b => (
                                <option key={b.id} value={b.id.toString()}>
                                    {b.icon || '🏆'} {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="label-xs">Music Theme (URL)</label>
                        <div className="flex gap-2 mt-1">
                            <input className="input-field flex-1 text-sm" placeholder="/uploads/bgm.mp3 or URL" value={headerForm.music_theme || ''} onChange={e => setHeaderForm(p => ({ ...p, music_theme: e.target.value }))} />
                            <label className={`btn-primary cursor-pointer flex items-center justify-center px-3 ${uploadingBgm ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadingBgm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <input type="file" accept="audio/*" className="hidden" onChange={handleUploadBgm} />
                            </label>
                        </div>
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
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-main">🎬 Scene Builder</h3>
                        <p className="text-muted text-sm">{scenes.length} scene{scenes.length !== 1 ? 's' : ''} — perubahan otomatis sync dengan engine</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick jump to scene */}
                        {scenes.length > 0 && (
                            <form onSubmit={e => { e.preventDefault(); jumpToScene(jumpTo) }} className="flex items-center gap-1">
                                <input
                                    type="number" min="1" max={scenes.length}
                                    value={jumpTo} onChange={e => setJumpTo(e.target.value)}
                                    placeholder="#"
                                    className="input-field w-16 text-sm text-center py-1.5"
                                />
                                <button type="submit" className="btn-secondary text-xs py-1.5 px-3">Pergi</button>
                            </form>
                        )}
                        <button onClick={() => setShowSceneMap(s => !s)} className={`btn-secondary flex items-center gap-1 text-sm py-1.5 ${showSceneMap ? 'ring-1 ring-primary/50' : ''}`}>
                            <List className="w-4 h-4" /> Peta Scene
                        </button>
                        <button onClick={addScene} className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tambah Scene
                        </button>
                    </div>
                </div>

                {/* Scene Map — Native Drag & Drop (supports flex-wrap) */}
                <AnimatePresence>
                {showSceneMap && scenes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-4 mb-4 border-card-border overflow-hidden"
                    >
                        <p className="text-xs text-dim font-bold uppercase tracking-wider mb-1">Peta Scene — Seret badge untuk reorder</p>
                        <p className="text-[10px] text-dim/60 mb-3">Klik = scroll ke scene · Seret = ubah urutan</p>
                        <div className="flex flex-wrap gap-2">
                            {scenes.map((sc, idx) => {
                                const typeColor = {
                                    dialogue:    'bg-blue-500/20 text-blue-300 border-blue-500/40',
                                    choice:      'bg-amber-500/20 text-amber-300 border-amber-500/40',
                                    investigate: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                                    email:       'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                                    lesson:      'bg-green-500/20 text-green-300 border-green-500/40',
                                    terminal:    'bg-red-500/20 text-red-300 border-red-500/40',
                                    ending:      'bg-pink-500/20 text-pink-300 border-pink-500/40',
                                }[sc.scene_type] || 'bg-input-bg text-dim border-card-border'

                                const isDragging = dragIdx === idx
                                const isOver    = dragOverIdx === idx

                                return (
                                    <div
                                        key={sc.id}
                                        draggable
                                        onDragStart={e => {
                                            setDragIdx(idx)
                                            e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onDragOver={e => handleMapDragOver(e, idx)}
                                        onDragEnd={onMapDragEnd}
                                        onClick={() => sceneRefs.current[sc.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                        className={`
                                            relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold
                                            cursor-grab active:cursor-grabbing select-none transition-all
                                            ${typeColor}
                                            ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}
                                        `}
                                        title={sc.scene_name || `Scene ${idx + 1}`}
                                    >
                                        {/* Drop Indicator Before */}
                                        {isOver && dragPosition === 'before' && !isDragging && (
                                            <div className="absolute -left-[4px] top-0 bottom-0 w-[3px] bg-primary rounded-full z-10" />
                                        )}
                                        {/* Drop Indicator After */}
                                        {isOver && dragPosition === 'after' && !isDragging && (
                                            <div className="absolute -right-[4px] top-0 bottom-0 w-[3px] bg-primary rounded-full z-10" />
                                        )}
                                        <GripVertical className="w-3 h-3 opacity-40" />
                                        <span className="opacity-50 text-[10px]">{idx + 1}</span>
                                        <span className="truncate max-w-[72px]">{sc.scene_type}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {scenes.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <h3 className="text-main font-semibold text-lg mb-2">Belum ada scene</h3>
                        <p className="text-muted mb-6">Mulai build dengan menambahkan scene pertama</p>
                        <button onClick={addScene} className="btn-primary flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" /> Tambah Scene Pertama</button>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-1">
                            {scenes.map((scene, idx) => (
                                <div key={scene.id} ref={el => sceneRefs.current[scene.id] = el}>
                                    <SceneCard
                                        scene={scene}
                                        index={idx}
                                        scenes={scenes}
                                        characters={characters}
                                        backgrounds={backgrounds}
                                        uiTypes={uiTypes}
                                        badges={badges}
                                        onUpdate={updateScene}
                                        onDelete={deleteScene}
                                        onMoveUp={() => moveScene(idx, idx - 1)}
                                        onMoveDown={() => moveScene(idx, idx + 1)}
                                        onDuplicate={() => duplicateScene(scene, idx)}
                                    />
                                    {/* Insert After button — between scenes */}
                                    <div className="flex justify-center my-1 group">
                                        <button
                                            onClick={() => insertSceneAfter(idx)}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 hover:bg-primary/30 border border-primary/20 text-primary transition-all"
                                        >
                                            <CornerDownRight className="w-3 h-3" /> Sisipkan Scene di sini
                                        </button>
                                    </div>
                                </div>
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
                            <h3 className="text-xl font-bold text-main text-center mb-2">Publish Chapter?</h3>
                            <p className="text-muted text-sm text-center mb-2">
                                <span className="text-main font-semibold">"{headerForm.title}"</span> will be live for all employees immediately.
                            </p>
                            <p className="text-dim text-xs text-center mb-6">{scenes.length} scenes will be built into the game engine.</p>
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
