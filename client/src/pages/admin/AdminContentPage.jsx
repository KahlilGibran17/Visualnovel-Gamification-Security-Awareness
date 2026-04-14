import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, BookOpen, MessageSquare, HelpCircle } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import toast from '../../utils/toast.js'

const DEMO_CHAPTERS_CONFIG = [
    { id: 1, title: 'First Day', subtitle: 'Phishing Email', scenes: 16, choices: 2, status: 'Published' },
    { id: 2, title: 'The Open Desk', subtitle: 'Clean Desk Policy', scenes: 12, choices: 2, status: 'Draft' },
    { id: 3, title: 'Stranger in the Elevator', subtitle: 'Social Engineering', scenes: 14, choices: 3, status: 'Draft' },
    { id: 4, title: 'Change Your Password', subtitle: 'Password Security', scenes: 10, choices: 4, status: 'Draft' },
    { id: 5, title: 'Incident!', subtitle: 'Incident Reporting', scenes: 13, choices: 2, status: 'Draft' },
    { id: 6, title: 'Showdown with Ph1sh', subtitle: 'FINALE', scenes: 20, choices: 6, status: 'Draft' },
]

export default function AdminContentPage() {
    const [selected, setSelected] = useState(null)
    const [editMode, setEditMode] = useState(false)

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-white">📝 Content Management</h1>
                    <p className="text-white/50 mt-1">Manage chapters, dialogue scenes, and quiz choices</p>
                </motion.div>

                {/* Chapter list */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <h2 className="font-bold text-white text-lg">Chapters</h2>
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Chapter
                        </button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {DEMO_CHAPTERS_CONFIG.map((ch, i) => (
                            <motion.div key={ch.id}
                                className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${selected === ch.id ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                                onClick={() => setSelected(selected === ch.id ? null : ch.id)}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary">
                                    {ch.id}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{ch.title}</p>
                                    <p className="text-white/50 text-sm">{ch.subtitle}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-sm text-white/40">
                                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {ch.scenes} scenes</span>
                                    <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {ch.choices} choices</span>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${ch.status === 'Published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/50 border border-white/10'
                                    }`}>
                                    {ch.status}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={e => { e.stopPropagation(); toast.success(`Editing Chapter ${ch.id} (Demo)`) }}
                                        className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); toast.error('Cannot delete published chapters') }}
                                        className="text-white/40 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Scene editor (shown when chapter selected) */}
                {selected && (
                    <motion.div className="glass-card p-6"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-white text-lg">✏️ Scene Editor — Chapter {selected}</h2>
                            <button className="btn-primary text-sm">
                                + Add Scene
                            </button>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                            <p className="text-white/50 text-sm mb-3">Scene Preview (Chapter {selected} — Scene 1)</p>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded">DIALOGUE</span>
                                    <span className="text-white/60 text-sm">Speaker: <strong className="text-white">AKE-BOT</strong></span>
                                </div>
                                <textarea
                                    className="input-field w-full h-20 text-sm resize-none"
                                    defaultValue="Welcome aboard, {{playerName}}! I'm AKE-BOT, your cybersecurity guide here at Akebono."
                                />
                                <div className="flex gap-3">
                                    <select className="input-field text-sm">
                                        <option>office</option>
                                        <option>desk</option>
                                        <option>server</option>
                                        <option>elevator</option>
                                        <option>factory</option>
                                    </select>
                                    <select className="input-field text-sm">
                                        <option>AKE-BOT</option>
                                        <option>Player</option>
                                        <option>Ph1sh</option>
                                        <option>Manager</option>
                                    </select>
                                    <select className="input-field text-sm">
                                        <option>happy</option>
                                        <option>worried</option>
                                        <option>proud</option>
                                        <option>shocked</option>
                                        <option>evil</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.success('Scene saved (Demo)')} className="btn-primary text-sm">
                                        Save Scene
                                    </button>
                                    <button className="btn-secondary text-sm">Preview</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
