import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Search, Loader2, Award, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const CURATED_COLORS = [
    { name: 'Phishing Red', value: '#E63946' },
    { name: 'Ocean Blue', value: '#3b82f6' },
    { name: 'Cyber Purple', value: '#8b5cf6' },
    { name: 'Secure Green', value: '#22c55e' },
    { name: 'Warning Orange', value: '#f97316' },
    { name: 'Gold Hero', value: '#FFD60A' },
    { name: 'Danger Crimson', value: '#ef4444' },
    { name: 'Deep Slate', value: '#475569' },
]

export default function BadgesTab() {
    const [badges, setBadges] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingBadge, setEditingBadge] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [badgeKey, setBadgeKey] = useState('')
    const [icon, setIcon] = useState('🏆')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#FFD60A')
    const [categoryId, setCategoryId] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [badgesRes, catsRes] = await Promise.all([
                axios.get('/api/cms/badges'),
                axios.get('/api/cms/badge-categories')
            ])
            setBadges(badgesRes.data)
            setCategories(catsRes.data)
            if (catsRes.data.length > 0) {
                setCategoryId(catsRes.data[0].category_id.toString())
            }
        } catch (err) {
            toast.error('Gagal memuat data Badge Studio')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenCreate = () => {
        setEditingBadge(null)
        setName('')
        setBadgeKey('')
        setIcon('🏆')
        setDescription('')
        setColor('#FFD60A')
        if (categories.length > 0) {
            setCategoryId(categories[0].category_id.toString())
        }
        setShowModal(true)
    }

    const handleOpenEdit = (badge) => {
        setEditingBadge(badge)
        setName(badge.name)
        setBadgeKey(badge.badge_key)
        setIcon(badge.icon || '🏆')
        setDescription(badge.description || '')
        setColor(badge.color || '#FFD60A')
        setCategoryId(badge.category_id ? badge.category_id.toString() : '')
        setShowModal(true)
    }

    const handleNameChange = (val) => {
        setName(val)
        // Auto-generate key from name if not manually edited yet
        if (!editingBadge) {
            const slug = val
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
            setBadgeKey(slug)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return toast.error('Nama lencana wajib diisi')
        if (!badgeKey.trim()) return toast.error('Key lencana wajib diisi')

        setSubmitting(true)
        const payload = {
            badge_key: badgeKey.trim(),
            name: name.trim(),
            description: description.trim(),
            icon: icon.trim(),
            color: color,
            category_id: categoryId ? parseInt(categoryId) : null
        }

        try {
            if (editingBadge) {
                const res = await axios.put(`/api/cms/badges/${editingBadge.id}`, payload)
                setBadges(prev => prev.map(b => b.id === editingBadge.id ? { ...res.data, category_name: categories.find(c => c.category_id === res.data.category_id)?.category_name } : b))
                toast.success('✅ Lencana berhasil diperbarui!')
            } else {
                const res = await axios.post('/api/cms/badges', payload)
                setBadges(prev => [...prev, { ...res.data, category_name: categories.find(c => c.category_id === res.data.category_id)?.category_name }])
                toast.success('🎉 Lencana baru berhasil dibuat!')
            }
            setShowModal(false)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan lencana')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Hapus lencana "${title}"? Tindakan ini akan menghapusnya dari semua riwayat perolehan siswa!`)) return
        try {
            await axios.delete(`/api/cms/badges/${id}`)
            setBadges(prev => prev.filter(b => b.id !== id))
            toast.success('🗑️ Lencana berhasil dihapus!')
        } catch (err) {
            toast.error('Gagal menghapus lencana')
        }
    }

    const filtered = badges.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                             (b.description || '').toLowerCase().includes(search.toLowerCase())
        const matchesCat = selectedCategoryFilter === 'all' || b.category_id?.toString() === selectedCategoryFilter
        return matchesSearch && matchesCat
    })

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>

    return (
        <div>
            {/* Header info */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-main flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" /> Badge Studio (Achievement Manager)
                    </h2>
                    <p className="text-sm text-muted">Kelola semua lencana gamifikasi terpusat untuk Visual Novel dan E-learning</p>
                </div>
                <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Buat Lencana Baru
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                    <input 
                        className="input-field w-full pl-9 text-sm" 
                        placeholder="Cari lencana berdasarkan nama/deskripsi..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setSelectedCategoryFilter('all')} 
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${selectedCategoryFilter === 'all' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card-bg text-muted border border-card-border hover:bg-input-bg'}`}
                    >
                        Semua Kategori
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat.category_id}
                            onClick={() => setSelectedCategoryFilter(cat.category_id.toString())} 
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${selectedCategoryFilter === cat.category_id.toString() ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card-bg text-muted border border-card-border hover:bg-input-bg'}`}
                        >
                            {cat.category_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Badges Grid */}
            {filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="text-6xl mb-4">🎖️</div>
                    <h3 className="text-main font-semibold text-lg mb-2">Tidak ada lencana ditemukan</h3>
                    <p className="text-muted mb-6">Mulai buat lencana gamifikasi pertama Anda di Badge Studio</p>
                    <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Buat Lencana
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filtered.map((badge, i) => (
                            <motion.div 
                                key={badge.id} 
                                initial={{ opacity: 0, y: 12 }} 
                                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-5 group flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Glowing colored background subtle circle */}
                                <div 
                                    className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-[40px] opacity-20 transition-all duration-300 group-hover:scale-125"
                                    style={{ backgroundColor: badge.color || '#FFD60A' }}
                                />

                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
                                            style={{ 
                                                backgroundColor: `${badge.color || '#FFD60A'}1A`, 
                                                borderColor: `${badge.color || '#FFD60A'}40`,
                                                color: badge.color || '#FFD60A' 
                                            }}
                                        >
                                            {badge.icon || '🏆'}
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-input-bg text-dim border border-card-border">
                                            {badge.category_name || 'Umum'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-main text-base mb-1 truncate">{badge.name}</h3>
                                    <p className="text-xs text-primary font-mono font-semibold mb-2 opacity-80">{badge.badge_key}</p>
                                    <p className="text-muted text-xs line-clamp-3 mb-4 leading-relaxed h-12">{badge.description || 'Tidak ada deskripsi.'}</p>
                                </div>

                                <div className="flex gap-2 border-t border-card-border/60 pt-3 mt-auto">
                                    <button 
                                        onClick={() => handleOpenEdit(badge)} 
                                        className="btn-secondary py-1.5 flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(badge.id, badge.name)} 
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-dim hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card w-full max-w-4xl p-6 overflow-hidden flex flex-col md:flex-row gap-6 bg-main ring-1 ring-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Left Side: Editor Form */}
                            <form onSubmit={handleSubmit} className="flex-1 space-y-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-main">
                                            {editingBadge ? '✏️ Edit Lencana' : '🎉 Buat Lencana Baru'}
                                        </h3>
                                        <button type="button" onClick={() => setShowModal(false)} className="text-dim hover:text-main">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="label-xs">Nama Lencana *</label>
                                            <input 
                                                className="input-field w-full mt-1 text-sm" 
                                                placeholder="e.g. Pembasmi Phishing" 
                                                value={name} 
                                                onChange={e => handleNameChange(e.target.value)} 
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="label-xs">Badge Key (Sistem) *</label>
                                            <input 
                                                className="input-field w-full mt-1 text-sm font-mono" 
                                                placeholder="e.g. phishing-hunter" 
                                                value={badgeKey} 
                                                onChange={e => setBadgeKey(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                                                disabled={!!editingBadge} 
                                            />
                                        </div>
                                        <div>
                                            <label className="label-xs">Ikon Emoji / Simbol</label>
                                            <input 
                                                className="input-field w-full mt-1 text-base text-center" 
                                                placeholder="🎣" 
                                                maxLength={4}
                                                value={icon} 
                                                onChange={e => setIcon(e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label className="label-xs">Kategori</label>
                                            <select 
                                                className="input-field w-full mt-1 text-sm"
                                                value={categoryId}
                                                onChange={e => setCategoryId(e.target.value)}
                                            >
                                                {categories.map(c => (
                                                    <option key={c.category_id} value={c.category_id.toString()}>
                                                        {c.category_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label-xs">Tema Warna</label>
                                            <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                                                {CURATED_COLORS.map(c => (
                                                    <button 
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setColor(c.value)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.name}
                                                    />
                                                ))}
                                                <input 
                                                    type="color" 
                                                    value={color}
                                                    onChange={e => setColor(e.target.value)}
                                                    className="w-6 h-6 rounded-full overflow-hidden border border-card-border cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label-xs">Deskripsi Lencana</label>
                                            <textarea 
                                                rows={3}
                                                className="input-field w-full mt-1 text-xs" 
                                                placeholder="Tuliskan pencapaian apa yang diperlukan untuk mendapatkan lencana ini..." 
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowModal(false)} 
                                        className="btn-secondary flex-1"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Lencana'}
                                    </button>
                                </div>
                            </form>

                            {/* Right Side: Interactive Real-Time Live Profile Preview */}
                            <div className="w-full md:w-80 bg-input-bg/40 border border-card-border/60 rounded-xl p-5 flex flex-col justify-center items-center relative overflow-hidden">
                                {/* Ambient backdrop glow */}
                                <div 
                                    className="absolute inset-0 blur-[60px] opacity-10 transition-all duration-500"
                                    style={{ backgroundColor: color }}
                                />

                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-5 uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Profile Preview
                                </div>

                                {/* Simulated User Profile Card */}
                                <div className="w-full glass-card p-5 border border-white/10 relative flex flex-col items-center text-center bg-card-bg shadow-2xl">
                                    {/* Mock Avatar */}
                                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary mb-3 shadow-inner">
                                        👨‍💻
                                    </div>
                                    <h4 className="font-bold text-main text-sm">Gibran ACA</h4>
                                    <p className="text-[10px] text-muted mb-4">Cyber Academy Student</p>

                                    <div className="w-full border-t border-card-border/50 my-3" />

                                    <p className="text-[10px] font-bold text-dim mb-3 uppercase tracking-wide">Earned Achievement</p>

                                    {/* Real-time preview badge itself! */}
                                    <div className="flex flex-col items-center">
                                        <div 
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-all duration-300 hover:rotate-6 mb-3 border"
                                            style={{ 
                                                backgroundColor: `${color}1A`, 
                                                borderColor: `${color}33`,
                                                boxShadow: `0 10px 25px -5px ${color}20` 
                                            }}
                                        >
                                            <span style={{ textShadow: `0 0 10px ${color}40` }}>{icon || '🏆'}</span>
                                        </div>
                                        <h5 className="font-extrabold text-main text-sm mb-1">{name || 'Nama Lencana'}</h5>
                                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
                                            {categories.find(c => c.category_id.toString() === categoryId)?.category_name || 'Kategori'}
                                        </span>
                                        <p className="text-[10px] text-muted max-w-[200px] leading-relaxed italic">
                                            "{description || 'Ini adalah deskripsi lencana yang menerangkan pencapaian luar biasa Anda.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
