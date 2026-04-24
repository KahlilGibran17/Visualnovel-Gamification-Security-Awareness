import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash, Image as ImageIcon, Save, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LandingSlidesTab({ activeTab }) {
    const [slides, setSlides] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingSlide, setEditingSlide] = useState(null)
    const [formData, setFormData] = useState({ title: '', description: '', image: null })

    const fetchSlides = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/cms/landing-slides')
            if (Array.isArray(res.data)) {
                setSlides(res.data)
            }
        } catch (err) {
            toast.error('Failed to load slides')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'landing') {
            fetchSlides()
        }
    }, [activeTab])

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            const data = new FormData()
            data.append('title', formData.title)
            data.append('description', formData.description)
            if (formData.image) {
                data.append('image', formData.image)
            }

            if (editingSlide) {
                await axios.put(`/api/cms/landing-slides/${editingSlide}`, data)
                toast.success('Slide updated')
            } else {
                await axios.post('/api/cms/landing-slides', data)
                toast.success('Slide created')
            }
            setEditingSlide(null)
            setFormData({ title: '', description: '', image: null })
            fetchSlides()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save slide')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this slide?')) return
        try {
            await axios.delete(`/api/cms/landing-slides/${id}`)
            toast.success('Deleted')
            fetchSlides()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const handleMove = async (index, direction) => {
        const newSlides = [...slides]
        if (direction === 'up' && index > 0) {
            [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]]
        } else if (direction === 'down' && index < newSlides.length - 1) {
            [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]]
        }
        setSlides(newSlides)
        try {
            const orderedIds = newSlides.map(s => s.id)
            await axios.put('/api/cms/landing-slides/reorder/batch', { orderedIds })
        } catch (err) {
            toast.error('Failed to reorder')
        }
    }

    if (activeTab !== 'landing') return null

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-main">
                    <ImageIcon className="w-5 h-5 text-accent" />
                    {editingSlide ? 'Edit Slide' : 'Add New Slide'}
                </h3>
                <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-xs">Title</label>
                        <input 
                            type="text" 
                            required
                            className="input-field w-full text-sm"
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="label-xs">Image Upload (Frontend renders fallback if none)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            className="input-field w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-primary file:text-white"
                            onChange={e => setFormData({...formData, image: e.target.files[0]})} 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label-xs">Description</label>
                        <textarea 
                            className="input-field w-full text-sm"
                            rows="2"
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                        <button type="submit" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Slide
                        </button>
                        {editingSlide && (
                            <button type="button" onClick={() => { setEditingSlide(null); setFormData({title:'',description:'',image:null}) }} className="btn-secondary text-sm px-4 py-2">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((slide, idx) => (
                    <div key={slide.id} className="glass-card p-4 relative overflow-hidden group border-card-border">
                        {slide.image_url ? (
                            <img src={slide.image_url} alt={slide.title} className="w-full h-40 object-cover rounded mb-4 border border-card-border" />
                        ) : (
                            <div className="w-full h-40 bg-input-bg flex flex-col items-center justify-center rounded mb-4 border border-card-border">
                                <ImageIcon className="w-8 h-8 text-dim mb-2" />
                                <span className="text-xs text-dim">Default Component UI</span>
                            </div>
                        )}
                        <h4 className="font-bold text-lg mb-1 text-main">{slide.title}</h4>
                        <p className="text-xs text-muted mb-4 line-clamp-2">{slide.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex gap-1">
                                <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-1.5 bg-input-bg rounded disabled:opacity-30 hover:bg-card-border text-main transition-colors"><ArrowUp className="w-4 h-4" /></button>
                                <button onClick={() => handleMove(idx, 'down')} disabled={idx === slides.length - 1} className="p-1.5 bg-input-bg rounded disabled:opacity-30 hover:bg-card-border text-main transition-colors"><ArrowDown className="w-4 h-4" /></button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    setEditingSlide(slide.id)
                                    setFormData({ title: slide.title, description: slide.description, image: null })
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }} className="text-primary text-sm hover:underline font-semibold">Edit</button>
                                <button onClick={() => handleDelete(slide.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
