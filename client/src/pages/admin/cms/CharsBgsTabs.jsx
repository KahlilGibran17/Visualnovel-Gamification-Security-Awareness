import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, Trash2, Edit3, X, Loader2, Save, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

// Predefined expression slots every character should have
const PRESET_EXPRESSIONS = [
    { name: 'neutral', emoji: '😐', label: 'Neutral' },
    { name: 'happy', emoji: '😊', label: 'Happy' },
    { name: 'worried', emoji: '😟', label: 'Worried' },
    { name: 'shocked', emoji: '😮', label: 'Shocked' },
    { name: 'angry', emoji: '😠', label: 'Angry' },
    { name: 'thinking', emoji: '🤔', label: 'Thinking' },
    { name: 'confident', emoji: '😎', label: 'Confident' },
    { name: 'sad', emoji: '😢', label: 'Sad' },
]

function ExpressionSlot({ slot, existingExpr, character, onSaved, onDeleted }) {
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef()

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('expression_name', slot.name)
            fd.append('emoji', slot.emoji)
            const res = await axios.post(`/api/cms/characters/${character.id}/expressions`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            onSaved(res.data)
            toast.success(`✅ "${slot.label}" expression saved`)
        } catch (err) {
            toast.error('❌ Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }



    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 group relative overflow-hidden">
            <div className="flex justify-between items-center z-10 mb-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider">{slot.label}</p>
                {existingExpr?.id && (
                    <button onClick={() => onDeleted(existingExpr.id)} className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center bg-black/40 rounded-lg relative overflow-hidden border border-white/5">
                {existingExpr?.image_url ? (
                    <img src={existingExpr.image_url} alt={slot.name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform hover:scale-110" />
                ) : (
                    <div className="text-center p-2 opacity-30">
                        <div className="text-3xl mb-1">{slot.emoji}</div>
                        <p className="text-[10px] text-white">No sprite</p>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded text-[10px] text-white backdrop-blur flex justify-center items-center">
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : '📁 Upload'}
                    </button>
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>
    )
}

function CharacterForm({ character, onSaved, onCancel }) {
    const [form, setForm] = useState({ name: character?.name || '', key_name: character?.key_name || '', role: character?.role || 'NPC', emoji: character?.emoji || '👤' })
    const [saving, setSaving] = useState(false)

    const save = async () => {
        if (!form.name.trim()) { toast.error('Character name is required'); return }
        setSaving(true)
        try {
            let res
            if (character?.id) {
                res = await axios.put(`/api/cms/characters/${character.id}`, form)
            } else {
                res = await axios.post('/api/cms/characters', form)
            }
            toast.success(`✅ Character "${form.name}" saved!`)
            onSaved(res.data)
        } catch (err) {
            toast.error('❌ Save failed: ' + (err.response?.data?.detail || err.message))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-white">{character?.id ? 'Edit Character' : 'New Character'}</h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="label-xs">Character Name *</label>
                    <input className="input-field w-full mt-1" placeholder="e.g. AKE-BOT" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                    <label className="label-xs">Key Name (no spaces)</label>
                    <input className="input-field w-full mt-1" placeholder="e.g. akebot" value={form.key_name} onChange={e => setForm(p => ({ ...p, key_name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} />
                </div>
                <div>
                    <label className="label-xs">Role</label>
                    <select className="input-field w-full mt-1" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                        <option>Protagonist</option><option>Guide</option><option>Antagonist</option><option>NPC</option>
                    </select>
                </div>
                <div>
                    <label className="label-xs">Icon Emoji</label>
                    <input className="input-field w-full mt-1 text-2xl" placeholder="🤖" value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} />
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Character
                </button>
            </div>
        </div>
    )
}

export function CharactersTab() {
    const [chars, setChars] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingChar, setEditingChar] = useState(null) // null=list, 'new'=create, char=edit
    const [expandedExprs, setExpandedExprs] = useState(null)

    useEffect(() => {
        axios.get('/api/cms/characters').then(r => setChars(r.data)).catch(() => toast.error('Failed to load characters')).finally(() => setLoading(false))
    }, [])

    const onCharSaved = (saved) => {
        setChars(prev => {
            const idx = prev.findIndex(c => c.id === saved.id)
            if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
            return [...prev, saved]
        })
        setEditingChar(null)
    }

    const deleteChar = async (id) => {
        if (!window.confirm('Delete this character?')) return
        try {
            await axios.delete(`/api/cms/characters/${id}`)
            setChars(prev => prev.filter(c => c.id !== id))
            toast.success('Character deleted')
        } catch { toast.error('Failed to delete') }
    }

    const onExprSaved = (charId, expr) => {
        setChars(prev => prev.map(c => {
            if (c.id !== charId) return c
            const exprs = c.expressions || []
            const idx = exprs.findIndex(e => e.expression_name === expr.expression_name)
            const newExprs = idx >= 0 ? exprs.map((e, i) => i === idx ? expr : e) : [...exprs, expr]
            return { ...c, expressions: newExprs }
        }))
    }

    const deleteExpr = async (charId, exprId) => {
        try {
            await axios.delete(`/api/cms/characters/${charId}/expressions/${exprId}`)
            setChars(prev => prev.map(c => c.id === charId ? { ...c, expressions: c.expressions.filter(e => e.id !== exprId) } : c))
        } catch { toast.error('Failed to delete expression') }
    }



    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>

    if (editingChar) {
        return <CharacterForm character={editingChar === 'new' ? null : editingChar} onSaved={onCharSaved} onCancel={() => setEditingChar(null)} />
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-xl font-bold text-white">👥 Character Manager</h2><p className="text-white/40 text-sm">Manage VN characters and expression images</p></div>
                <button onClick={() => setEditingChar('new')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Character</button>
            </div>

            <div className="space-y-4">
                {chars.map(c => (
                    <div key={c.id} className="glass-card overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/10 shrink-0">
                                {c.emoji}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-white text-lg">{c.name}</p>
                                    <span className="text-[10px] uppercase font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full tracking-wider">{c.role}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-white/40 font-mono">key: {c.key_name}</span>
                                    <span className="text-xs text-white/40">{(c.expressions || []).length} expressions</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setExpandedExprs(expandedExprs === c.id ? null : c.id)}
                                    className="btn-secondary text-xs flex items-center gap-1.5">
                                    {expandedExprs === c.id ? 'Close' : '🎬 Studio'}
                                </button>
                                <button onClick={() => setEditingChar(c)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => deleteChar(c.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {expandedExprs === c.id && (
                            <div className="border-t border-white/5 p-5 bg-black/20">
                                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Sprite Previews</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                                    {PRESET_EXPRESSIONS.map(slot => {
                                        const existing = (c.expressions || []).find(e => e.expression_name === slot.name)
                                        return (
                                            <ExpressionSlot
                                                key={slot.name}
                                                slot={slot}
                                                existingExpr={existing}
                                                character={c}
                                                onSaved={expr => onExprSaved(c.id, expr)}
                                                onDeleted={exprId => deleteExpr(c.id, exprId)}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Backgrounds Tab ─────────────────────────────────────────────────────────
const LOCATION_TAGS = ['Office', 'Server Room', 'Factory', 'Elevator', 'Outdoor', 'Meeting Room', 'Custom']
const TIME_TAGS = ['Day', 'Night', 'Dusk', 'None']
const BG_GRADIENTS = {
    office: 'linear-gradient(135deg, rgba(15,52,96,0.8), rgba(26,26,46,0.95))',
    desk: 'linear-gradient(135deg, rgba(49,46,129,0.7), rgba(26,26,46,0.95))',
    server: 'linear-gradient(135deg, rgba(6,78,59,0.7), rgba(26,26,46,0.95))',
    elevator: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(26,26,46,0.95))',
    factory: 'linear-gradient(135deg, rgba(120,53,15,0.6), rgba(26,26,46,0.95))',
}

export function BackgroundsTab() {
    const [bgs, setBgs] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', key_name: '', location_tag: 'Office', time_of_day: 'Day' })
    const [preview, setPreview] = useState(null)
    const [fileInfo, setFileInfo] = useState(null)
    const [saving, setSaving] = useState(false)
    const [fileError, setFileError] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileRef = useRef()
    const [selectedFile, setSelectedFile] = useState(null)

    useEffect(() => {
        axios.get('/api/cms/backgrounds').then(r => setBgs(r.data)).catch(() => toast.error('Failed to load backgrounds')).finally(() => setLoading(false))
    }, [])

    const handleFile = (e) => {
        const f = e.target.files?.[0] || e.dataTransfer?.files?.[0]
        if (!f) return

        setFileError(null)

        // Validate Type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validTypes.includes(f.type)) {
            setFileError('Invalid file type. Please upload a JPG, PNG, or WEBP image.')
            return
        }

        // Validate Size (5MB = 5 * 1024 * 1024 bytes)
        if (f.size > 5 * 1024 * 1024) {
            setFileError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Max size is 5MB.`)
            return
        }

        setSelectedFile(f)
        const objectUrl = URL.createObjectURL(f)
        setPreview(objectUrl)

        // Read image dimensions
        const img = new globalThis.Image()
        img.onload = () => setFileInfo({ size: f.size, width: img.width, height: img.height, name: f.name })
        img.src = objectUrl
    }

    const clearFile = (e) => {
        e.stopPropagation()
        setSelectedFile(null)
        setPreview(null)
        setFileInfo(null)
        setFileError(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const onDragLeave = () => setIsDragging(false)
    const onDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFile(e)
    }

    const save = async () => {
        if (!form.name.trim()) { toast.error('Background name required'); return }
        setSaving(true)
        try {
            const fd = new FormData()
            fd.append('name', form.name)
            fd.append('key_name', form.key_name || form.name.toLowerCase().replace(/\s+/g, '_'))
            fd.append('location_tag', form.location_tag)
            fd.append('time_of_day', form.time_of_day)
            if (selectedFile) fd.append('image', selectedFile)
            const res = await axios.post('/api/cms/backgrounds', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setBgs(prev => [...prev, res.data])
            setShowForm(false)
            setForm({ name: '', key_name: '', location_tag: 'Office', time_of_day: 'Day' })
            setPreview(null)
            setSelectedFile(null)
            setFileInfo(null)
            if (fileRef.current) fileRef.current.value = ''
            toast.success('✅ Background saved successfully')
        } catch (err) {
            toast.error('❌ Failed to upload background: ' + (err.response?.data?.error || err.response?.data?.detail || err.message))
        } finally {
            setSaving(false)
        }
    }

    const deleteBg = async (id) => {
        if (!window.confirm('Delete this background?')) return
        try {
            await axios.delete(`/api/cms/backgrounds/${id}`)
            setBgs(prev => prev.filter(b => b.id !== id))
            toast.success('Background deleted')
        } catch { toast.error('Failed to delete') }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-xl font-bold text-white">🖼️ Background Library</h2><p className="text-white/40 text-sm">Upload and manage scene backgrounds</p></div>
                <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Background</button>
            </div>

            {showForm && (
                <div className="glass-card p-5 mb-6 space-y-4">
                    <h3 className="font-bold text-white">New Background</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2">
                            <label className="label-xs">Background Name *</label>
                            <input className="input-field w-full mt-1" placeholder="e.g. Office Lobby — Day" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label-xs">Location Tag</label>
                            <select className="input-field w-full mt-1" value={form.location_tag} onChange={e => setForm(p => ({ ...p, location_tag: e.target.value }))}>
                                {LOCATION_TAGS.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-xs">Time of Day</label>
                            <select className="input-field w-full mt-1" value={form.time_of_day} onChange={e => setForm(p => ({ ...p, time_of_day: e.target.value }))}>
                                {TIME_TAGS.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label-xs">Background Image (Required)</label>
                        <div
                            className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging ? 'border-primary bg-primary/10' :
                                fileError ? 'border-red-500/50 bg-red-500/5' :
                                    preview ? 'border-green-500/30 bg-green-500/5' : 'border-white/20 hover:border-white/40 cursor-pointer'
                                }`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => !preview && fileRef.current?.click()}
                        >
                            {preview ? (
                                <div>
                                    <div className="relative inline-block">
                                        <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain shadow-lg" />
                                        <button onClick={clearFile} className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {fileInfo && (
                                        <div className="mt-3 text-xs text-white/50 space-y-0.5">
                                            <p className="font-semibold text-white/70">{fileInfo.name}</p>
                                            <p>{fileInfo.width} × {fileInfo.height} px • {(fileInfo.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : fileError ? 'text-red-400' : 'text-white/30'}`} />
                                    <p className="font-semibold text-white/80 mb-1">
                                        {isDragging ? 'Drop image here...' : 'Drag & drop image here'}
                                    </p>
                                    <p className="text-white/40 text-sm mb-3">or click to browse</p>
                                    <div className="text-xs text-white/30 space-y-0.5">
                                        <p>Supported: JPG, PNG, WEBP</p>
                                        <p>Max size: 5MB</p>
                                        <p>Recommended: 1920 × 1080px (16:9)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {fileError && <p className="text-red-400 text-xs mt-2 font-semibold flex items-center gap-1">❌ {fileError}</p>}
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => { setShowForm(false); clearFile({ stopPropagation: () => { } }) }} className="btn-secondary flex-1">Cancel</button>
                        {selectedFile && (
                            <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Background
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bgs.map(bg => (
                    <motion.div key={bg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden group">
                        <div className="h-28 w-full relative overflow-hidden">
                            {bg.image_url
                                ? <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full" style={{ background: BG_GRADIENTS[bg.key_name] || BG_GRADIENTS.office }} />
                            }
                            <button onClick={() => deleteBg(bg.id)} className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="p-3">
                            <p className="font-semibold text-white text-sm">{bg.name}</p>
                            <p className="text-xs text-white/40 font-mono">{bg.key_name}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
