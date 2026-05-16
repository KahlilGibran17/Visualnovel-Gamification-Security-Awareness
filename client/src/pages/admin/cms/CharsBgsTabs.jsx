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

// ─── Image Crop Modal ────────────────────────────────────────────────────────
function CropModal({ image, onConfirm, onCancel }) {
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)
    const imageRef = useRef(null)

    const handleMouseDown = (e) => {
        setIsDragging(true)
        setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return
        setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y })
    }

    const handleMouseUp = () => setIsDragging(false)

    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(prev => Math.min(Math.max(0.1, prev + delta), 5))
    }

    const handleConfirm = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        // Use Portrait Aspect Ratio (3:4) to match character sprites
        const width = 450
        const height = 600
        canvas.width = width
        canvas.height = height

        if (imageRef.current) {
            const img = imageRef.current
            const container = containerRef.current
            const rect = container.getBoundingClientRect()
            
            // Inner crop area dimensions (rect.width - 80, rect.height - 80)
            const cropW = rect.width - 80
            const cropH = rect.height - 80
            
            // Scale to high-res canvas
            const scaleX = width / cropW
            const scaleY = height / cropH
            
            const drawWidth = img.clientWidth * zoom * scaleX
            const drawHeight = img.clientHeight * zoom * scaleY
            
            ctx.clearRect(0, 0, width, height)
            
            // Draw relative to center
            ctx.drawImage(
                img, 
                (width / 2 + (offset.x * scaleX)) - (drawWidth / 2),
                (height / 2 + (offset.y * scaleY)) - (drawHeight / 2),
                drawWidth,
                drawHeight
            )
        }

        canvas.toBlob((blob) => {
            if (blob) onConfirm(blob)
            else toast.error('Gagal memproses gambar')
        }, 'image/png')
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="glass-card max-w-2xl w-full overflow-hidden border-primary/20 shadow-2xl">
                <div className="p-4 border-b border-card-border flex justify-between items-center bg-card-bg/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-main text-sm">Character Sprite Slicer</h3>
                            <p className="text-[10px] text-dim font-medium uppercase tracking-wider">Potong & Posisikan Asset</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-input-bg text-dim hover:text-main transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div 
                        ref={containerRef}
                        className="aspect-[3/4] w-full bg-black/60 rounded-2xl border-2 border-primary/30 relative overflow-hidden cursor-move touch-none shadow-inner"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        <img 
                            ref={imageRef}
                            src={image} 
                            alt="To crop" 
                            className="absolute pointer-events-none select-none max-w-none origin-center"
                            style={{ 
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                                left: '50%',
                                top: '50%',
                                marginLeft: imageRef.current ? -(imageRef.current.clientWidth / 2) : 0,
                                marginTop: imageRef.current ? -(imageRef.current.clientHeight / 2) : 0,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                        />
                        {/* Interactive Overlay */}
                        <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none backdrop-grayscale-[0.5]" />
                        <div className="absolute inset-[40px] border-2 border-dashed border-primary/40 rounded-lg pointer-events-none">
                            <div className="absolute inset-0 border border-white/10" />
                        </div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary/80 text-white text-[8px] font-bold rounded uppercase tracking-tighter">Preview Area</div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card p-4 bg-input-bg/30 border-card-border space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-muted font-bold uppercase tracking-wider">
                                    <span>Magnification</span>
                                    <span className="text-primary">{Math.round(zoom * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="5" step="0.01" 
                                    value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full accent-primary bg-card-bg h-1.5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-dim font-bold uppercase">X Offset</label>
                                    <input type="number" value={Math.round(offset.x)} onChange={e => setOffset(p => ({ ...p, x: parseInt(e.target.value) || 0 }))} className="input-field w-full text-xs py-1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-dim font-bold uppercase">Y Offset</label>
                                    <input type="number" value={Math.round(offset.y)} onChange={e => setOffset(p => ({ ...p, y: parseInt(e.target.value) || 0 }))} className="input-field w-full text-xs py-1" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button onClick={onCancel} className="btn-secondary flex-1 py-3 text-sm">Batal</button>
                                <button onClick={handleConfirm} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Simpan Asset
                                </button>
                            </div>
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[10px] text-primary/80 leading-relaxed italic text-center">
                                    "Gunakan scroll mouse untuk zoom, dan klik-seret pada gambar untuk mengatur posisi X dan Y dengan lebih mudah."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}


function ExpressionSlot({ slot, existingExpr, character, onSaved, onDeleted }) {
    const [uploading, setUploading] = useState(false)
    const [cropImage, setCropImage] = useState(null)
    const fileRef = useRef()

    const onFileSelected = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setCropImage(reader.result)
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleUpload = async (blob) => {
        setCropImage(null)
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', blob, `${slot.name}.png`)
            fd.append('expression_name', slot.name)
            fd.append('emoji', slot.emoji)
            const res = await axios.post(`/api/cms/characters/${character.id}/expressions`, fd)
            onSaved(res.data)
            toast.success(`✅ "${slot.label}" expression saved`)
        } catch (err) {
            toast.error('❌ Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
        }
    }



    return (
        <div className="bg-card-bg border border-card-border rounded-xl p-3 flex flex-col gap-2 group relative overflow-hidden">
            <div className="flex justify-between items-center z-10 mb-1">
                <p className="text-xs font-bold text-main uppercase tracking-wider">{slot.label}</p>
                {existingExpr?.id && (
                    <button onClick={() => onDeleted(existingExpr.id)} className="p-1 rounded hover:bg-red-500/20 text-dim hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center bg-black/40 rounded-lg relative overflow-hidden border border-card-border">
                {existingExpr?.image_url ? (
                    <img src={existingExpr.image_url} alt={slot.name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform hover:scale-110" />
                ) : (
                    <div className="text-center p-2 opacity-30">
                        <div className="text-3xl mb-1">{slot.emoji}</div>
                        <p className="text-[10px] text-main">No sprite</p>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded text-[10px] text-white backdrop-blur flex justify-center items-center">
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : '📁 Upload & Slice'}
                    </button>
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />

            {cropImage && (
                <CropModal 
                    image={cropImage} 
                    onConfirm={handleUpload} 
                    onCancel={() => setCropImage(null)} 
                />
            )}
        </div>
    )
}

function FullBodySlot({ character, onSaved }) {
    const [uploading, setUploading] = useState(false)
    const [cropImage, setCropImage] = useState(null)
    const fileRef = useRef()

    const onFileSelected = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setCropImage(reader.result)
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleUpload = async (blob) => {
        setCropImage(null)
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', blob, `${character.key_name}_fullbody.png`)
            const res = await axios.post(`/api/cms/characters/${character.id}/full-body`, fd)
            onSaved(res.data)
            toast.success('✅ Full body sprite saved!')
        } catch (err) {
            toast.error('❌ Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
        }
    }

    const hasImage = !!character.full_body_url

    return (
        <div className="bg-gradient-to-b from-primary/10 to-card-bg border-2 border-primary/30 rounded-xl p-3 flex flex-col gap-2 group relative overflow-hidden col-span-2">
            <div className="flex justify-between items-center mb-1">
                <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">🖼️ Full Body</p>
                    <p className="text-[10px] text-dim">Digunakan untuk posisi Center / Middle</p>
                </div>
                {hasImage && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">Tersedia</span>
                )}
            </div>
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center bg-black/40 rounded-lg relative overflow-hidden border border-card-border">
                {hasImage ? (
                    <img src={character.full_body_url} alt="full_body" className="absolute inset-0 w-full h-full object-contain object-bottom transition-transform hover:scale-105" />
                ) : (
                    <div className="text-center p-4 opacity-40">
                        <div className="text-5xl mb-2">🧍</div>
                        <p className="text-[11px] text-main font-semibold">Belum ada sprite full body</p>
                        <p className="text-[10px] text-dim mt-1">Upload gambar karakter full body (tanpa latar)</p>
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex-1 py-1.5 bg-primary/80 hover:bg-primary rounded text-[10px] text-white backdrop-blur flex justify-center items-center gap-1">
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : '📁'} {hasImage ? 'Ganti Sprite' : 'Upload & Slice'}
                    </button>
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
            {cropImage && (
                <CropModal
                    image={cropImage}
                    onConfirm={handleUpload}
                    onCancel={() => setCropImage(null)}
                />
            )}
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
            <h3 className="font-bold text-main">{character?.id ? 'Edit Character' : 'New Character'}</h3>
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
                <div><h2 className="text-xl font-bold text-main">👥 Character Manager</h2><p className="text-muted text-sm">Manage VN characters and expression images</p></div>
                <button onClick={() => setEditingChar('new')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Character</button>
            </div>

            <div className="space-y-4">
                {chars.map(c => (
                    <div key={c.id} className="glass-card overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-input-bg rounded-2xl flex items-center justify-center text-3xl border border-card-border shrink-0">
                                {c.emoji}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-main text-lg">{c.name}</p>
                                    <span className="text-[10px] uppercase font-bold bg-input-bg text-muted px-2 py-0.5 rounded-full tracking-wider">{c.role}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-dim font-mono">key: {c.key_name}</span>
                                    <span className="text-xs text-dim">{(c.expressions || []).length} expressions</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setExpandedExprs(expandedExprs === c.id ? null : c.id)}
                                    className="btn-secondary text-xs flex items-center gap-1.5">
                                    {expandedExprs === c.id ? 'Close' : '🎬 Studio'}
                                </button>
                                <button onClick={() => setEditingChar(c)} className="p-2 rounded-lg bg-input-bg hover:bg-card-bg text-muted hover:text-main transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => deleteChar(c.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-dim hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {expandedExprs === c.id && (
                            <div className="border-t border-card-border p-5 bg-card-bg/50">
                                {/* Full Body slot — prominent, at top */}
                                <p className="text-xs font-semibold text-dim uppercase tracking-wider mb-3">Full Body Sprite (Center Position)</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
                                    <FullBodySlot
                                        character={c}
                                        onSaved={(updated) => setChars(prev => prev.map(ch => ch.id === updated.id ? { ...updated, expressions: c.expressions } : ch))}
                                    />
                                </div>
                                <p className="text-xs font-semibold text-dim uppercase tracking-wider mb-3">Expression Sprites (Left / Right Position)</p>
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
    const [editingBgId, setEditingBgId] = useState(null)

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
            fd.append('location_tag', form.location_tag)
            fd.append('time_of_day', form.time_of_day)
            
            if (!editingBgId) {
                fd.append('key_name', form.key_name || form.name.toLowerCase().replace(/\s+/g, '_'))
            }

            if (selectedFile) fd.append('image', selectedFile)

            if (editingBgId) {
                const res = await axios.put(`/api/cms/backgrounds/${editingBgId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setBgs(prev => prev.map(b => b.id === editingBgId ? res.data : b))
                toast.success('✅ Background updated successfully')
            } else {
                const res = await axios.post('/api/cms/backgrounds', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setBgs(prev => [...prev, res.data])
                toast.success('✅ Background saved successfully')
            }

            setShowForm(false)
            setEditingBgId(null)
            setForm({ name: '', key_name: '', location_tag: 'Office', time_of_day: 'Day' })
            setPreview(null)
            setSelectedFile(null)
            setFileInfo(null)
            if (fileRef.current) fileRef.current.value = ''
        } catch (err) {
            toast.error('❌ Action failed: ' + (err.response?.data?.error || err.response?.data?.detail || err.message))
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (bg) => {
        setEditingBgId(bg.id)
        setForm({
            name: bg.name,
            key_name: bg.key_name,
            location_tag: bg.location_tag || 'Office',
            time_of_day: bg.time_of_day || 'Day'
        })
        setPreview(bg.image_url)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
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
                <div><h2 className="text-xl font-bold text-main">🖼️ Background Library</h2><p className="text-muted text-sm">Upload and manage scene backgrounds</p></div>
                <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Background</button>
            </div>

            {showForm && (
                <div className="glass-card p-5 mb-6 space-y-4 border-primary/30">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-main">{editingBgId ? 'Edit Background' : 'New Background'}</h3>
                        {editingBgId && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-widest">ID: {editingBgId}</span>}
                    </div>
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
                        {editingBgId && (
                            <div>
                                <label className="label-xs">Key Name (Read-only)</label>
                                <input className="input-field w-full mt-1 opacity-50 cursor-not-allowed" value={form.key_name} disabled />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="label-xs">Background Image (Required)</label>
                        <div
                            className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging ? 'border-primary bg-primary/10' :
                                fileError ? 'border-red-500/50 bg-red-500/5' :
                                    preview ? 'border-green-500/30 bg-green-500/5' : 'border-card-border hover:border-muted cursor-pointer'
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
                                        <div className="mt-3 text-xs text-dim space-y-0.5">
                                            <p className="font-semibold text-main opacity-70">{fileInfo.name}</p>
                                            <p>{fileInfo.width} × {fileInfo.height} px • {(fileInfo.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : fileError ? 'text-red-400' : 'text-dim'}`} />
                                    <p className="font-semibold text-main opacity-80 mb-1">
                                        {isDragging ? 'Drop image here...' : 'Drag & drop image here'}
                                    </p>
                                    <p className="text-muted text-sm mb-3">or click to browse</p>
                                    <div className="text-xs text-dim space-y-0.5">
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
                        <button onClick={() => { setShowForm(false); setEditingBgId(null); clearFile({ stopPropagation: () => { } }) }} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                            {editingBgId ? 'Update Background' : 'Save Background'}
                        </button>
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
                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(bg)} className="p-1.5 bg-primary/80 hover:bg-primary rounded-lg text-white shadow-lg">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteBg(bg.id)} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white shadow-lg">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3">
                            <p className="font-semibold text-main text-sm">{bg.name}</p>
                            <p className="text-xs text-dim font-mono">{bg.key_name}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
