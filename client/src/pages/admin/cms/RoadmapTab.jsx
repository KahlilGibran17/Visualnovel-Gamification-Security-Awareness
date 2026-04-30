import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Edit3, Trash2, Plus, GripVertical, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Image, Upload, XCircle } from 'lucide-react'

export default function RoadmapTab() {
    const [nodes, setNodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [chapters, setChapters] = useState([])
    const [uploading, setUploading] = useState(false)
    
    const [isEditing, setIsEditing] = useState(false)
    const [editNode, setEditNode] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        node_type: 'Game',
        chapter_id: '',
        xp_reward: 0,
        background_image_url: '',
        icon: 'Circle',
        location: 'Unknown'
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const [nodesRes, chRes] = await Promise.all([
                axios.get('/api/cms/roadmap-levels'),
                axios.get('/api/cms/chapters')
            ])
            setNodes(nodesRes.data)
            setChapters(chRes.data)
        } catch (err) {
            toast.error('Failed to load roadmap data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const handleDragEnd = async (result) => {
        if (!result.destination) return
        const items = Array.from(nodes)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)
        
        // Optimistic UI update
        setNodes(items)
        
        // Save order to backend
        try {
            const orderedIds = items.map(n => n.id)
            await axios.put('/api/cms/roadmap-levels/reorder/batch', { orderedIds })
            toast.success('Roadmap reordered!')
        } catch (err) {
            toast.error('Failed to save order')
            loadData() // Revert on fail
        }
    }

    const openEditModal = (node = null) => {
        if (node) {
            setEditNode(node)
            setFormData({
                title: node.title,
                subtitle: node.subtitle || '',
                node_type: node.node_type || 'Game',
                chapter_id: node.chapter_id || '',
                xp_reward: node.xp_reward || 0,
                background_image_url: node.background_image_url || '',
                icon: node.icon || 'Circle',
                location: node.location || 'Unknown'
            })
        } else {
            setEditNode(null)
            setFormData({
                title: '',
                subtitle: '',
                node_type: 'Game',
                chapter_id: '',
                xp_reward: 0,
                background_image_url: '',
                icon: 'Circle',
                location: 'Unknown'
            })
        }
        setIsEditing(true)
    }

    const saveNode = async (e) => {
        e.preventDefault()
        if (!formData.title) return toast.error('Title is required')
        try {
            if (editNode) {
                await axios.put(`/api/cms/roadmap-levels/${editNode.id}`, formData)
                toast.success('Node updated')
            } else {
                await axios.post('/api/cms/roadmap-levels', formData)
                toast.success('Node created')
            }
            setIsEditing(false)
            loadData()
        } catch (err) {
            toast.error('Failed to save node')
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        
        setUploading(true)
        try {
            const res = await axios.post('/api/cms/media/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setFormData(prev => ({ ...prev, background_image_url: res.data.url }))
            toast.success('Background uploaded!')
        } catch (err) {
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const deleteNode = async (id) => {
        if (!window.confirm('Delete this level from roadmap?')) return
        try {
            await axios.delete(`/api/cms/roadmap-levels/${id}`)
            toast.success('Node deleted')
            loadData()
        } catch (err) {
            toast.error('Failed to delete node')
        }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-muted">Drag and drop to reorder the progression path from top to bottom.</p>
                <button onClick={() => openEditModal()} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Level
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="roadmap-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {nodes.map((node, index) => (
                                <Draggable key={node.id.toString()} draggableId={node.id.toString()} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="glass-card p-4 flex items-center justify-between group bg-card-bg border border-card-border"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div {...provided.dragHandleProps} className="text-dim hover:text-muted cursor-grab active:cursor-grabbing">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-input-bg flex items-center justify-center text-xl">
                                                    {node.icon === 'BookOpen' ? '📖' : node.icon === 'MailWarning' ? '📧' : node.icon === 'ShieldCheck' ? '🛡️' : '🔘'}
                                                </div>
                                                <div>
                                                    <h3 className="text-main font-bold text-lg leading-none">{node.title}</h3>
                                                    <p className="text-muted text-sm mt-1">{node.subtitle}</p>
                                                </div>
                                                <div className="ml-6 px-3 py-1 rounded-full bg-input-bg text-xs font-semibold text-muted border border-card-border">
                                                    {node.node_type}
                                                </div>
                                                {node.node_type === 'Game' && node.chapter_title && (
                                                    <div className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                                        🔗 {node.chapter_title}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(node)} className="p-2 rounded-lg bg-input-bg hover:bg-card-bg text-dim hover:text-main transition-colors">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteNode(node.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-lg"
                        >
                            <h2 className="text-xl font-bold text-main mb-6">{editNode ? 'Edit Level' : 'New Level'}</h2>
                            <form onSubmit={saveNode} className="space-y-4">
                                <div>
                                    <label className="block text-muted text-xs mb-1">Title</label>
                                    <input type="text" className="input-field w-full text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-muted text-xs mb-1">Subtitle</label>
                                    <input type="text" className="input-field w-full text-sm" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-muted text-xs mb-1">Type</label>
                                        <select className="input-field w-full text-sm" value={formData.node_type} onChange={e => setFormData({ ...formData, node_type: e.target.value })}>
                                            <option value="E-Learning">E-Learning</option>
                                            <option value="Game">Game</option>
                                            <option value="Final">Final</option>
                                        </select>
                                    </div>
                                    {formData.node_type === 'Game' && (
                                        <div>
                                            <label className="block text-muted text-xs mb-1">Link to Chapter</label>
                                            <select className="input-field w-full text-sm" value={formData.chapter_id} onChange={e => setFormData({ ...formData, chapter_id: e.target.value })}>
                                                <option value="">Select Chapter...</option>
                                                {chapters.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-muted text-xs mb-1">XP Reward</label>
                                        <input type="number" className="input-field w-full text-sm" value={formData.xp_reward} onChange={e => setFormData({ ...formData, xp_reward: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-muted text-xs mb-1">Theme / Location</label>
                                        <select 
                                            className="input-field w-full text-sm" 
                                            value={formData.location} 
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="Office Lobby">Office Lobby</option>
                                            <option value="Workstation">Workstation</option>
                                            <option value="Elevator">Elevator</option>
                                            <option value="IT Room">IT Room</option>
                                            <option value="Server Room">Server Room</option>
                                            <option value="Data Center">Data Center</option>
                                            <option value="Unknown">Lainnya / Unknown</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-muted text-xs mb-1">Custom Background URL (Optional)</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" 
                                                className="input-field w-full text-sm pl-10" 
                                                placeholder="/uploads/bg.jpg" 
                                                value={formData.background_image_url} 
                                                onChange={e => setFormData({ ...formData, background_image_url: e.target.value })} 
                                            />
                                            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                                        </div>
                                        <label className={`btn-secondary px-3 py-2 text-sm flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {uploading ? '...' : 'Upload'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                    
                                    {formData.background_image_url && (
                                        <div className="mt-3 relative group w-full h-32 rounded-lg overflow-hidden border border-card-border bg-input-bg">
                                            <img 
                                                src={formData.background_image_url} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Invalid+URL'; }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({ ...formData, background_image_url: '' })}
                                                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                                                Preview Latar Belakang
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-card-border">
                                    <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                                    <button type="submit" className="btn-primary px-4 py-2 text-sm">Save Level</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
