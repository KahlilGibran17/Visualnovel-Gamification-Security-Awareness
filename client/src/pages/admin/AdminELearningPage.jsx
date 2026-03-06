import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, GraduationCap, Clock, FileText, Save, Loader2 } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function AdminELearningPage() {
    const [courses, setCourses] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)

    // Form states
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [duration, setDuration] = useState('')
    const [level, setLevel] = useState('')
    const [content, setContent] = useState('')
    const [status, setStatus] = useState('Draft')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchModules()
    }, [])

    const fetchModules = async () => {
        try {
            const { data } = await axios.get('/api/elearning')
            setCourses(data)
        } catch (err) {
            toast.error('Failed to load modules')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (course) => {
        if (!course) {
            setSelected(null)
            return
        }
        setSelected(course.id)
        setTitle(course.title || '')
        setCategory(course.category || '')
        setDuration(course.duration || '')
        setLevel(course.level || 'Beginner')
        setContent(course.content || '')
        setStatus(course.status || 'Draft')
    }

    const handleCreate = async () => {
        const tempId = 'new-' + Date.now()
        const newCourse = {
            id: tempId,
            title: 'New Module',
            category: 'General',
            duration: '10 mins',
            level: 'Beginner',
            content: '',
            status: 'Draft',
            isNew: true
        }
        setCourses([newCourse, ...courses])
        handleSelect(newCourse)
    }

    const handleSave = async () => {
        if (!title.trim()) return toast.error('Title is required')

        setIsSaving(true)
        try {
            const payload = { title, category, duration, level, content, status }
            const activeCourse = courses.find(c => c.id === selected)

            if (activeCourse?.isNew || String(selected).startsWith('new-')) {
                // Create
                const { data } = await axios.post('/api/elearning', payload)
                setCourses(prev => prev.map(c => c.id === selected ? data : c))
                setSelected(data.id)
                toast.success('Module created successfully')
            } else {
                // Update
                const { data } = await axios.put(`/api/elearning/${selected}`, payload)
                setCourses(prev => prev.map(c => c.id === selected ? data : c))
                toast.success('Module updated successfully')
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save module')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this module?')) return

        if (String(id).startsWith('new-')) {
            setCourses(courses.filter(c => c.id !== id))
            if (selected === id) setSelected(null)
            return
        }

        try {
            await axios.delete(`/api/elearning/${id}`)
            setCourses(courses.filter(c => c.id !== id))
            if (selected === id) setSelected(null)
            toast.success('Module deleted')
        } catch (err) {
            toast.error('Failed to delete module')
        }
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-white">🎓 E-Learning Management</h1>
                    <p className="text-white/50 mt-1">Add, edit, and organize reading materials for employees before they play</p>
                </motion.div>

                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <h2 className="font-bold text-white text-lg">E-Learning Modules</h2>
                        <button
                            className="btn-primary text-sm flex items-center gap-2"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4" /> Add Module
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {courses.map((course, i) => (
                                <motion.div key={course.id}
                                    className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${selected === course.id ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                    onClick={() => handleSelect(selected === course.id ? null : course)}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>

                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{course.title || 'Untitled Module'}</p>
                                        <div className="flex items-center gap-3 text-white/50 text-sm mt-0.5">
                                            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {course.category || '-'}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.duration || '-'}</span>
                                        </div>
                                    </div>

                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${course.status === 'Published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/50 border border-white/10'}`}>
                                        {course.status || 'Draft'}
                                    </span>

                                    <div className="flex gap-2 ml-2">
                                        <button onClick={e => { e.stopPropagation(); handleSelect(course) }}
                                            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => handleDelete(e, course.id)}
                                            className="text-white/40 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            {courses.length === 0 && (
                                <div className="p-8 text-center text-white/40">
                                    No e-learning modules found. Click 'Add Module' to create one.
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Editor Panel */}
                {selected && (
                    <motion.div className="glass-card p-6"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-white text-lg flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-accent" /> Edit Module Content
                            </h2>
                            <button className="btn-primary text-sm flex items-center gap-2" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Saving...' : 'Save Module'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Module Title</label>
                                <input
                                    className="input-field w-full"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Category</label>
                                <input
                                    className="input-field w-full"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Status</label>
                                <select
                                    className="input-field w-full"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Duration (e.g. 15 mins)</label>
                                <input
                                    className="input-field w-full"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Difficulty Level</label>
                                <select
                                    className="input-field w-full"
                                    value={level}
                                    onChange={e => setLevel(e.target.value)}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">Learning Material (Markdown / HTML)</label>
                            <textarea
                                className="input-field w-full h-40 text-sm resize-none font-mono"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="## Your content here..."
                            />
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
