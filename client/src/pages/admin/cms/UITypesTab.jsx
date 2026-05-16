import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, Loader2, Search, Upload, Image, Code, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { FakeUIScaledWrapper } from '../../../components/FakeUIBackground.jsx'

export function UITypesTab() {
    const [uiTypes, setUiTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({ id: null, name: '', key_name: '', custom_html: '', image_url: null, bg_offset_y: 0, is_scrollable: false })
    const [inputMode, setInputMode] = useState('image') // 'image' | 'html'
    const [previewMode, setPreviewMode] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [isDraggingPos, setIsDraggingPos] = useState(false)
    const fileRef = useRef()

    useEffect(() => {
        axios.get('/api/cms/ui-types')
            .then(r => setUiTypes(r.data))
            .catch(() => toast.error('Failed to load UI types'))
            .finally(() => setLoading(false))
    }, [])

    const openNew = () => {
        setForm({ id: null, name: '', key_name: '', custom_html: '', image_url: null, bg_offset_y: 0, is_scrollable: false })
        setInputMode('image')
        setPreviewMode(false)
        setShowForm(true)
    }

    const openEdit = (t) => {
        setForm({ id: t.id, name: t.name, key_name: t.key_name, custom_html: t.custom_html || '', image_url: t.image_url || null, bg_offset_y: t.bg_offset_y || 0, is_scrollable: !!t.is_scrollable })
        setInputMode(t.image_url ? 'image' : 'html')
        setPreviewMode(false)
        setShowForm(true)
    }

    const save = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return }
        setSaving(true)
        try {
            if (form.id) {
                const res = await axios.put(`/api/cms/ui-types/${form.id}`, form)
                setUiTypes(prev => prev.map(t => t.id === form.id ? res.data : t))
                toast.success('UI Type updated!')
            } else {
                const payload = { ...form, key_name: form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }
                const res = await axios.post('/api/cms/ui-types', payload)
                setUiTypes(prev => [...prev, res.data])
                toast.success('UI Type created! Now upload a background image.')
                // Auto-open for image upload
                setForm(f => ({ ...f, id: res.data.id, key_name: res.data.key_name, bg_offset_y: 0, is_scrollable: false }))
                return // stay open for image upload
            }
            setShowForm(false)
            setForm({ id: null, name: '', key_name: '', custom_html: '', image_url: null, bg_offset_y: 0, is_scrollable: false })
        } catch (err) {
            toast.error('❌ Save failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setSaving(false)
        }
    }

    const handleBgDrag = (e) => {
        if (!isDraggingPos) return
        const rect = e.currentTarget.getBoundingClientRect()
        const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100)
        setForm(f => ({ ...f, bg_offset_y: Math.round(y) }))
    }

    const handleImageUpload = async (file) => {
        if (!form.id) {
            toast.error('Simpan nama UI Type terlebih dahulu sebelum upload gambar.')
            return
        }
        if (!file.type.startsWith('image/')) {
            toast.error('Hanya file gambar yang diizinkan.')
            return
        }
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            const res = await axios.post(`/api/cms/ui-types/${form.id}/upload-image`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            // res.data will have the new image_url and custom_html
            setForm(f => ({ ...f, image_url: res.data.image_url, custom_html: res.data.custom_html, bg_offset_y: res.data.bg_offset_y || 0, is_scrollable: !!res.data.is_scrollable }))
            setUiTypes(prev => prev.map(t => t.id === form.id ? res.data : t))
            toast.success('✅ Gambar berhasil diupload!')
        } catch (err) {
            toast.error('Upload gagal: ' + (err.response?.data?.detail || err.message))
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleImageUpload(file)
    }

    const deleteType = async (id, name) => {
        if (!window.confirm(`Delete UI Type "${name}"? Chapters using this type will break!`)) return
        try {
            await axios.delete(`/api/cms/ui-types/${id}`)
            setUiTypes(prev => prev.filter(t => t.id !== id))
            toast.success('Deleted')
        } catch {
            toast.error('Failed to delete')
        }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-main">🔎 Custom Target UI Types</h2>
                    <p className="text-muted text-sm">Upload screenshot UI palsu sebagai background untuk mekanik "Spot the Phish". Tidak perlu coding!</p>
                </div>
                <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New UI Type</button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="glass-card p-5 mb-6 space-y-5 border-card-border shadow-2xl">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-main text-lg">{form.id ? 'Edit UI Type' : 'New UI Type'}</h3>
                        <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-input-bg text-dim hover:text-main"><X className="w-4 h-4" /></button>
                    </div>

                    {/* Name field */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-xs">Nama UI Type *</label>
                            <input className="input-field w-full mt-1" placeholder="Contoh: Email Outlook Palsu" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label-xs">Key Name (auto)</label>
                            <input className="input-field w-full mt-1 opacity-50 cursor-not-allowed" disabled value={form.id ? form.key_name : form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')} />
                        </div>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex gap-2 p-1 bg-input-bg rounded-xl w-fit">
                        <button onClick={() => setInputMode('image')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode==='image' ? 'bg-primary text-white shadow' : 'text-dim'}`}>
                            <Image className="w-3.5 h-3.5" /> Upload Gambar
                        </button>
                        <button onClick={() => setInputMode('html')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode==='html' ? 'bg-primary text-white shadow' : 'text-dim'}`}>
                            <Code className="w-3.5 h-3.5" /> Custom HTML
                        </button>
                    </div>

                    {inputMode === 'image' ? (
                        <div className="space-y-4">
                            {!form.id && (
                                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
                                    <span>💡</span>
                                    <span>Klik <strong>Simpan Nama</strong> terlebih dahulu, lalu upload gambar background-nya.</span>
                                </div>
                            )}

                            {/* Drop zone & Positioning */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => form.id && !form.image_url && fileRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center text-center p-8 cursor-pointer
                                        ${dragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-card-border hover:border-primary/50 bg-input-bg/40'}
                                        ${!form.id ? 'opacity-40 pointer-events-none' : ''}`}
                                    style={{ minHeight: 180 }}
                                >
                                    {form.image_url ? (
                                        <>
                                            <img src={form.image_url} alt="Preview" className="max-h-40 object-contain rounded-xl shadow-lg mb-3" />
                                            <p className="text-xs text-dim">Klik "Ganti Gambar" di bawah untuk mengganti</p>
                                        </>
                                    ) : (
                                        <>
                                            {uploading
                                                ? <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                                : <Upload className="w-10 h-10 text-dim mb-3" />
                                            }
                                            <p className="font-bold text-main text-sm mb-1">Seret gambar ke sini atau klik untuk pilih</p>
                                            <p className="text-xs text-dim">PNG, JPG, WebP — screenshot UI palsu</p>
                                        </>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-card-bg/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {form.image_url && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="label-xs">Posisi Background & Scroll</label>
                                            <label className="flex items-center gap-2 cursor-pointer group bg-input-bg px-3 py-1 rounded-lg border border-card-border">
                                                <input type="checkbox" className="w-4 h-4 rounded border-card-border bg-dark checked:bg-primary" 
                                                    checked={form.is_scrollable} 
                                                    onChange={e => setForm(f => ({ ...f, is_scrollable: e.target.checked }))} />
                                                <span className="text-xs text-dim group-hover:text-main transition-colors font-bold">Bisa Di-Scroll</span>
                                            </label>
                                        </div>
                                        
                                        <div 
                                            className={`relative h-44 bg-input-bg border-2 border-card-border rounded-xl overflow-hidden cursor-ns-resize group ${isDraggingPos ? 'border-primary' : ''}`}
                                            onPointerDown={() => setIsDraggingPos(true)}
                                            onPointerUp={() => setIsDraggingPos(false)}
                                            onPointerLeave={() => setIsDraggingPos(false)}
                                            onPointerMove={handleBgDrag}
                                        >
                                            <div 
                                                className="absolute inset-0 pointer-events-none select-none"
                                                style={{ 
                                                    backgroundImage: `url(${form.image_url})`,
                                                    backgroundSize: form.is_scrollable ? '100% auto' : 'cover',
                                                    backgroundPosition: `center ${form.bg_offset_y}%`,
                                                    backgroundRepeat: 'no-repeat'
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <p className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] font-bold">TAHAN & GESER UNTUK ATUR POSISI</p>
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded font-bold">Y: {form.bg_offset_y}%</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setForm(f => ({ ...f, bg_offset_y: 0 }))} className="text-[10px] font-bold text-dim hover:text-main">RESET POSISI</button>
                                            <button onClick={() => fileRef.current?.click()} className="text-[10px] font-bold text-primary hover:underline ml-auto flex items-center gap-1"><Upload className="w-3 h-3"/> GANTI GAMBAR</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); e.target.value='' }} />

                            {form.image_url && (
                                <div className="glass-card p-4 bg-input-bg/50 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs text-dim font-mono">Live Preview Engine (800x450):</p>
                                        {form.is_scrollable && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold animate-pulse">SCROLLABLE ENABLED</span>}
                                    </div>
                                    <div className="h-52 overflow-hidden rounded-lg border-2 border-card-border shadow-2xl">
                                        <FakeUIScaledWrapper uiType={form.key_name || 'preview'} uiTypesData={[{ ...form, key_name: form.key_name || 'preview' }]} className="shadow-inner" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setPreviewMode(false)} className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${!previewMode ? 'bg-primary text-white' : 'bg-input-bg text-muted'}`}>Code</button>
                                <button onClick={() => setPreviewMode(true)} className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${previewMode ? 'bg-primary text-white' : 'bg-input-bg text-muted'}`}>Preview</button>
                            </div>
                            {!previewMode ? (
                                <textarea
                                    className="input-field w-full font-mono text-sm leading-relaxed whitespace-pre"
                                    rows={12}
                                    placeholder={'<div class="w-full h-full bg-white p-5">\n  <h1>My Custom UI</h1>\n</div>'}
                                    value={form.custom_html}
                                    onChange={e => setForm(p => ({ ...p, custom_html: e.target.value }))}
                                />
                            ) : (
                                <div className="bg-input-bg p-4 rounded-xl border border-card-border flex justify-center items-center overflow-x-auto">
                                    <FakeUIScaledWrapper uiType={form.key_name || 'preview'} uiTypesData={[{ ...form, key_name: form.key_name || 'preview' }]} className="shadow-2xl border-4 border-card-border rounded-lg" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2 border-t border-card-border">
                        <button onClick={() => setShowForm(false)} className="btn-secondary px-6">Tutup</button>
                        {inputMode === 'html' || !form.id ? (
                            <button onClick={save} disabled={saving} className="btn-primary px-6 flex items-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {form.id ? 'Simpan Perubahan' : 'Simpan Nama'}
                            </button>
                        ) : (
                            <button onClick={save} disabled={saving} className="btn-primary px-6 flex items-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Simpan & Selesai
                            </button>
                        )}
                    </div>
                </motion.div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uiTypes.map(t => (
                    <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card flex flex-col overflow-hidden border-card-border shadow-lg">
                        <div className="flex items-center gap-3 p-4 border-b border-card-border bg-input-bg">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${t.image_url ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                {t.image_url ? <Image className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-main text-base truncate">{t.name}</h3>
                                <p className="text-muted text-xs font-mono">{t.key_name} {t.image_url ? '· 📷 Gambar' : '· 💻 HTML'}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => openEdit(t)} className="p-2 rounded hover:bg-card-border text-dim hover:text-main transition-colors"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => deleteType(t.id, t.name)} className="p-2 rounded hover:bg-red-500/20 text-dim hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Thumbnail preview */}
                        <div className="h-40 bg-input-bg relative overflow-hidden border-t border-card-border">
                            {t.image_url ? (
                                <img src={t.image_url} alt={t.name} className="w-full h-full object-cover object-top" />
                            ) : (
                                <div className="transform scale-50 origin-top-left pointer-events-none absolute top-0 left-0" style={{ width: '200%', height: '200%' }}>
                                    <FakeUIScaledWrapper uiType={t.key_name} uiTypesData={[t]} className="shadow-xl" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {uiTypes.length === 0 && !showForm && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-card-border rounded-xl bg-card-bg">
                        <Image className="w-12 h-12 text-dim mx-auto mb-4" />
                        <h3 className="text-main font-semibold text-lg mb-2">Belum Ada UI Type</h3>
                        <p className="text-muted mb-6 text-sm">Upload screenshot UI palsu untuk membuat "Spot the Phish" yang realistis!</p>
                        <button onClick={openNew} className="btn-primary mx-auto flex items-center gap-2"><Plus className="w-4 h-4" /> Buat UI Type</button>
                    </div>
                )}
            </div>
        </div>
    )
}
