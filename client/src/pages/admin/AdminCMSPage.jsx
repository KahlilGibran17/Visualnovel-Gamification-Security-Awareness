import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Users, Image, Film, Plus, Edit3, Trash2, Globe, Clock, Loader2, Search, Upload, ArrowLeft, Home, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import ChapterEditor from './cms/ChapterEditor.jsx'
import { CharactersTab, BackgroundsTab } from './cms/CharsBgsTabs.jsx'
import { UITypesTab } from './cms/UITypesTab.jsx'

const TABS = [
    { id: 'chapters', label: 'Chapters', icon: BookOpen },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'backgrounds', label: 'Backgrounds', icon: Image },
    { id: 'ui-types', label: 'UI Types', icon: Monitor },
    { id: 'media', label: 'Media Library', icon: Film },
]

const STATUS_COLOR = {
    Published: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Draft: 'bg-white/5 text-white/40 border border-white/10',
}

// ─── Chapter List ────────────────────────────────────────────────────────────
function ChapterList({ onEdit }) {
    const [chapters, setChapters] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const r = await axios.get('/api/cms/chapters')
            setChapters(r.data)
        } catch (err) {
            toast.error('Failed to load chapters: ' + (err.response?.data?.error || err.message))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const createChapter = async () => {
        if (!newTitle.trim()) { toast.error('Enter a chapter title'); return }
        try {
            const res = await axios.post('/api/cms/chapters', { title: newTitle, icon: '📖', status: 'Draft' })
            setChapters(prev => [...prev, res.data])
            setNewTitle('')
            setCreating(false)
            toast.success(`✅ Chapter "${res.data.title}" created!`)
            onEdit(res.data.id)
        } catch (err) {
            toast.error('❌ Failed: ' + (err.response?.data?.error || err.message))
        }
    }

    const deleteChapter = async (id, title) => {
        if (!window.confirm(`Delete "${title}" and all its scenes? This cannot be undone.`)) return
        try {
            await axios.delete(`/api/cms/chapters/${id}`)
            setChapters(prev => prev.filter(c => c.id !== id))
            toast.success('Chapter deleted')
        } catch (err) {
            toast.error('❌ Delete failed: ' + (err.response?.data?.error || err.message))
        }
    }

    const filtered = chapters.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.subtitle || '').toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>

    return (
        <div>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input className="input-field w-full pl-9 text-sm" placeholder="Search chapters..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Chapter</button>
            </div>

            <AnimatePresence>
                {creating && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                        <div className="glass-card p-4 flex items-center gap-3">
                            <input autoFocus className="input-field flex-1 text-sm" placeholder="Chapter title (e.g. First Day)" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createChapter()} />
                            <button onClick={createChapter} className="btn-primary text-sm px-4">Create & Edit</button>
                            <button onClick={() => setCreating(false)} className="btn-secondary text-sm px-4">Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-white font-semibold text-lg mb-2">No chapters yet</h3>
                    <p className="text-white/40 mb-6">Create your first chapter to get started</p>
                    <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" /> Create Chapter</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map((ch, i) => (
                            <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-5 group hover:border-white/20 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="text-4xl">{ch.icon || '📖'}</div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[ch.status] || STATUS_COLOR.Draft}`}>
                                        {ch.status === 'Published' ? '🟢 Live' : '⚪ Draft'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-white text-lg leading-tight mb-1">{ch.title}</h3>
                                <p className="text-white/50 text-sm mb-4">{ch.subtitle || 'No subtitle'}</p>
                                <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                                    <span className="flex items-center gap-1"><Film className="w-3 h-3" />{ch.scene_count || 0} scenes</span>
                                    {ch.location && <span className="flex items-center gap-1">📍{ch.location}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(ch.id)} className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <a href={`/play/${ch.id}`} target="_blank" rel="noreferrer"
                                        className="btn-secondary flex items-center gap-1.5 text-sm px-3">
                                        <Globe className="w-3.5 h-3.5" /> Play
                                    </a>
                                    <button onClick={() => deleteChapter(ch.id, ch.title)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

// ─── Media Library ───────────────────────────────────────────────────────────
function MediaLibrary() {
    const [media, setMedia] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [filter, setFilter] = useState('all')

    const load = () => axios.get('/api/cms/media').then(r => setMedia(r.data)).catch(() => toast.error('Failed to load media')).finally(() => setLoading(false))
    useEffect(() => { load() }, [])

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return
        setUploading(true)
        try {
            for (const file of files) {
                const fd = new FormData()
                fd.append('file', file)
                const res = await axios.post('/api/cms/media/upload', fd)
                setMedia(prev => [res.data, ...prev])
            }
            toast.success(`✅ ${files.length} file(s) uploaded`)
        } catch (err) {
            toast.error('❌ Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const deleteMedia = async (id) => {
        if (!window.confirm('Delete this media file?')) return
        try {
            await axios.delete(`/api/cms/media/${id}`)
            setMedia(prev => prev.filter(m => m.id !== id))
            toast.success('File deleted')
        } catch { toast.error('Failed to delete') }
    }

    const filtered = filter === 'all' ? media : media.filter(m => m.file_type === filter)

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>

    return (
        <div>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex gap-2">
                    {['all', 'image', 'video'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-primary text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                            {f === 'all' ? 'All' : f === 'image' ? '🖼️ Images' : '🎬 Videos'}
                        </button>
                    ))}
                </div>
                <div className="ml-auto">
                    <label className={`btn-primary flex items-center gap-2 text-sm cursor-pointer ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload Files
                        <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p className="text-white/40">No media uploaded yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filtered.map(m => (
                        <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden group">
                            <div className="h-28 bg-white/5 relative overflow-hidden">
                                {m.file_type === 'image'
                                    ? <img src={m.url} alt={m.original_name} className="w-full h-full object-cover" />
                                    : <div className="flex items-center justify-center h-full text-4xl">🎬</div>
                                }
                                <button onClick={() => deleteMedia(m.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </button>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-white/60 truncate">{m.original_name}</p>
                                <p className="text-xs text-white/30">{Math.round((m.file_size || 0) / 1024)}KB</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main CMS Page ──────────────────────────────────────────────────────────
export default function AdminCMSPage() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('chapters')
    const [editingChapterId, setEditingChapterId] = useState(null)
    const [listKey, setListKey] = useState(0)

    const openEditor = (id) => {
        setEditingChapterId(id)
        setActiveTab('chapters')
    }

    return (
        <div className="min-h-screen bg-dark">
            {/* Persistent Top Navigation Bar */}
            <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => {
                        if (editingChapterId) setEditingChapterId(null)
                        else navigate('/admin')
                    }} className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm bg-black/20 hover:bg-black/40 border-transparent">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
                    </button>
                    <button onClick={() => navigate('/admin')} className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm bg-black/20 hover:bg-black/40 border-transparent text-primary hover:text-primary-dark">
                        <Home className="w-4 h-4" /> <span className="hidden sm:inline">Admin Dashboard</span>
                    </button>
                </div>
                <div className="flex items-center gap-1 md:gap-3">
                    <span className="text-white/40 text-sm font-semibold hidden lg:block mr-2">Content Studio</span>
                    <div className="flex overflow-x-auto no-scrollbar gap-1">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id && (!editingChapterId || tab.id !== 'chapters')
                            const isEditing = tab.id === 'chapters' && editingChapterId
                            return (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'chapters') setEditingChapterId(null) }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${isActive
                                        ? 'bg-primary/20 text-primary'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                        }`}>
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden md:inline">{tab.label}</span>
                                    {isEditing && <span className="w-2 h-2 bg-primary rounded-full hidden md:inline-block" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-display text-white">✏️ Content Studio</h1>
                    <p className="text-white/40 mt-1">Build and manage Visual Novel chapters without writing any code</p>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab + (editingChapterId || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                        {activeTab === 'chapters' && (
                            editingChapterId
                                ? <ChapterEditor
                                    chapterId={editingChapterId}
                                    onBack={() => setEditingChapterId(null)}
                                    onRefreshList={() => setListKey(k => k + 1)}
                                />
                                : <ChapterList key={listKey} onEdit={openEditor} />
                        )}
                        {activeTab === 'characters' && <CharactersTab />}
                        {activeTab === 'backgrounds' && <BackgroundsTab />}
                        {activeTab === 'ui-types' && <UITypesTab />}
                        {activeTab === 'media' && <MediaLibrary />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
