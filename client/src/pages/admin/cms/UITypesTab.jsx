import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { FakeUIScaledWrapper } from '../../../components/FakeUIBackground.jsx'

export function UITypesTab() {
    const [uiTypes, setUiTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ id: null, name: '', key_name: '', custom_html: '' })
    const [previewMode, setPreviewMode] = useState(false)

    useEffect(() => {
        axios.get('/api/cms/ui-types')
            .then(r => setUiTypes(r.data))
            .catch(() => toast.error('Failed to load UI types'))
            .finally(() => setLoading(false))
    }, [])

    const openEdit = (t) => {
        setForm({ id: t.id, name: t.name, key_name: t.key_name, custom_html: t.custom_html || '' })
        setShowForm(true)
        setPreviewMode(false)
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
                toast.success('UI Type created!')
            }
            setShowForm(false)
            setForm({ id: null, name: '', key_name: '', custom_html: '' })
        } catch (err) {
            toast.error('❌ Save failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setSaving(false)
        }
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
                    <h2 className="text-xl font-bold text-white">🔎 Custom Target UI Types</h2>
                    <p className="text-white/40 text-sm">Create and manage custom layouts for the "Spot the Phish" mechanic using HTML and TailwindCSS.</p>
                </div>
                <button onClick={() => { setShowForm(s => !s); setForm({ id: null, name: '', key_name: '', custom_html: '<div className="w-full h-full bg-slate-900 text-white p-4 flex flex-col items-center justify-center">\n  <h1 className="text-2xl font-bold">Generated Custom UI</h1>\n</div>' }) }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New UI Type</button>
            </div>

            {showForm && (
                <div className="glass-card p-5 mb-6 space-y-4 border border-white/20 shadow-2xl">
                    <h3 className="font-bold text-white text-lg">{form.id ? 'Edit UI Type' : 'New UI Type'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-xs">Type Name *</label>
                            <input className="input-field w-full mt-1" placeholder="e.g. Mobile Banking App" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label-xs">Key Name (auto-generated if empty)</label>
                            <input className="input-field w-full mt-1 bg-white/5 opacity-50 cursor-not-allowed" disabled value={form.id ? form.key_name : form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')} />
                        </div>
                    </div>
                    
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="label-xs">Custom Template HTML (Supports TailwindCSS classes)</label>
                            <div className="flex gap-2">
                                <button onClick={() => setPreviewMode(false)} className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${!previewMode ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>Code</button>
                                <button onClick={() => setPreviewMode(true)} className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${previewMode ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}>Preview</button>
                            </div>
                        </div>

                        {!previewMode ? (
                            <textarea 
                                className="input-field w-full font-mono text-sm leading-relaxed whitespace-pre" 
                                rows={14} 
                                placeholder={'<div className="w-full h-full bg-white p-5">\n  <h1>My Custom UI</h1>\n</div>'}
                                value={form.custom_html} 
                                onChange={e => setForm(p => ({ ...p, custom_html: e.target.value }))} 
                            />
                        ) : (
                            <div className="bg-[#1a1a2e] p-4 rounded-xl border border-white/10 flex justify-center items-center overflow-x-auto">
                                <FakeUIScaledWrapper uiType={form.key_name} uiTypesData={[{...form, key_name: form.key_name || 'preview'}]} className="shadow-2xl border-4 border-gray-700 rounded-lg">
                                </FakeUIScaledWrapper>
                            </div>
                        )}
                        <p className="text-xs text-white/30 mt-2">Note: Only standard browser HTML and TailwindCSS utility classes are officially supported. Interactive JavaScript requires React modification.</p>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
                        <button onClick={save} disabled={saving} className="btn-primary px-6 flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save UI Type
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uiTypes.map(t => (
                    <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/5">
                            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <Search className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-base truncate">{t.name}</h3>
                                <p className="text-white/40 text-xs font-mono">{t.key_name}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => openEdit(t)} className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => deleteType(t.id, t.name)} className="p-2 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="p-4 bg-black/40 flex-1 relative overflow-hidden flex items-center justify-center h-48">
                            <div className="transform scale-50 origin-center pointer-events-none">
                                <FakeUIScaledWrapper uiType={t.key_name} uiTypesData={[t]} className="shadow-xl" />
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {uiTypes.length === 0 && !showForm && (
                     <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                        <h3 className="text-white font-semibold text-lg mb-2 mt-4">No Custom UI Types Yet</h3>
                        <p className="text-white/40 mb-6 text-sm">Add one to create advanced custom interfaces!</p>
                        <button onClick={() => setShowForm(true)} className="btn-primary mx-auto flex items-center gap-2"><Plus className="w-4 h-4" /> Create First Type</button>
                    </div>
                )}
            </div>
        </div>
    )
}
