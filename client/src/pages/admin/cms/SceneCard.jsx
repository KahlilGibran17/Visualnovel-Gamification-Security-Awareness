import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, GripVertical, MessageSquare, HelpCircle, Flag, CheckCircle, Circle, X, Loader2, Clock, Mail, BookOpen, Search, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export const SCENE_TYPES = [
    { value: 'dialogue', label: 'Dialogue', icon: MessageSquare, color: 'blue' },
    { value: 'choice', label: 'Choice', icon: HelpCircle, color: 'yellow' },
    { value: 'investigate', label: 'Spot the Phish', icon: Search, color: 'orange' },
    { value: 'terminal', label: 'Terminal CLI', icon: Terminal, color: 'green' },
    { value: 'ending', label: 'Ending', icon: Flag, color: 'red' },
    { value: 'email', label: 'Email', icon: Mail, color: 'purple' },
    { value: 'lesson', label: 'Lesson', icon: BookOpen, color: 'cyan' },
]

// ─── Choice Row ────────────────────────────────────────────────────────────
function ChoiceRow({ choice, index, scenes, currentSceneId, onUpdate, onDelete }) {
    const [local, setLocal] = useState(choice)
    const debounce = useRef(null)
    const LETTERS = ['A', 'B', 'C', 'D']

    useEffect(() => { setLocal(choice) }, [choice])

    const field = (key, val) => {
        const updated = { ...local, [key]: val }
        setLocal(updated)
        clearTimeout(debounce.current)
        debounce.current = setTimeout(() => onUpdate(updated), 700)
    }

    return (
        <div className={`rounded-xl border p-4 space-y-3 ${local.is_correct ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/3'}`}>
            <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${local.is_correct ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'}`}>{LETTERS[index]}</span>
                <input className="input-field flex-1 text-sm" placeholder="What the player sees..." value={local.choice_text || ''} onChange={e => field('choice_text', e.target.value)} />
                <button onClick={() => field('is_correct', !local.is_correct)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${local.is_correct ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    {local.is_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {local.is_correct ? 'Correct' : 'Wrong'}
                </button>
                {local.is_correct && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-white/40">XP</span>
                        <input type="number" className="input-field w-14 text-xs py-1.5" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                    </div>
                )}
                <button onClick={onDelete} className="text-white/20 hover:text-red-400 p-1.5 rounded flex-shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>

            {!local.is_correct && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-white/40 mb-1">💥 Consequence (what happened)</label>
                        <textarea className="input-field w-full text-xs resize-none" rows={2} placeholder="e.g. You clicked a phishing link..." value={local.consequence_text || ''} onChange={e => field('consequence_text', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-white/40 mb-1">📚 Lesson (what to remember)</label>
                        <textarea className="input-field w-full text-xs resize-none" rows={2} placeholder="e.g. Always verify sender email..." value={local.lesson_text || ''} onChange={e => field('lesson_text', e.target.value)} />
                    </div>
                </div>
            )}
            <div>
                <label className="block text-xs text-white/40 mb-1">➡️ Next Scene after this choice</label>
                <select className="input-field w-full text-xs" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">— Follow default order —</option>
                    {scenes.filter(s => s.id !== currentSceneId).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                </select>
            </div>
        </div>
    )
}

// ─── Scene Card ────────────────────────────────────────────────────────────
export function SceneCard({ scene, index, scenes, characters, backgrounds, onUpdate, onDelete, onMoveUp, onMoveDown, onDuplicate }) {
    const [expanded, setExpanded] = useState(false)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [local, setLocal] = useState(scene)
    const [newChoiceText, setNewChoiceText] = useState('')
    const debounceRef = useRef(null)

    useEffect(() => { setLocal(scene) }, [scene])

    const field = (key, val) => {
        const updated = { ...local, [key]: val }
        setLocal(updated)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSave(updated), 900)
    }

    const doSave = useCallback(async (data) => {
        setSaving(true)
        try {
            const res = await axios.put(`/api/cms/scenes/${scene.id}`, data)
            onUpdate(scene.id, { ...res.data, choices: data.choices || res.data.choices || [] })
            setLastSaved(new Date())
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.error || err.message
            toast.error(`❌ Scene save failed: ${msg}`)
        } finally {
            setSaving(false)
        }
    }, [scene.id, onUpdate])

    const addChoice = async () => {
        try {
            const res = await axios.post(`/api/cms/scenes/${scene.id}/choices`, { choice_text: newChoiceText || 'New choice', is_correct: false })
            const newChoices = [...(local.choices || []), res.data]
            setLocal(prev => ({ ...prev, choices: newChoices }))
            onUpdate(scene.id, { ...local, choices: newChoices })
            setNewChoiceText('')
            toast.success('Choice added')
        } catch (err) {
            toast.error('Failed to add choice: ' + (err.response?.data?.error || err.message))
        }
    }

    const updateChoice = async (cId, data) => {
        try {
            const res = await axios.put(`/api/cms/choices/${cId}`, data)
            const newChoices = local.choices.map(c => c.id === cId ? res.data : c)
            setLocal(prev => ({ ...prev, choices: newChoices }))
            onUpdate(scene.id, { ...local, choices: newChoices })
        } catch (err) {
            toast.error('Choice save failed: ' + (err.response?.data?.error || err.message))
        }
    }

    const deleteChoice = async (cId) => {
        try {
            await axios.delete(`/api/cms/choices/${cId}`)
            const newChoices = local.choices.filter(c => c.id !== cId)
            setLocal(prev => ({ ...prev, choices: newChoices }))
            onUpdate(scene.id, { ...local, choices: newChoices })
        } catch { toast.error('Failed to delete choice') }
    }

    const typeInfo = SCENE_TYPES.find(t => t.value === local.scene_type) || SCENE_TYPES[0]
    const TypeIcon = typeInfo.icon
    const colorMap = {
        blue: 'bg-blue-500/20 text-blue-400',
        yellow: 'bg-yellow-500/20 text-yellow-400',
        green: 'bg-green-500/20 text-green-400',
        orange: 'bg-orange-500/20 text-orange-400',
        red: 'bg-red-500/20 text-red-400',
        purple: 'bg-purple-500/20 text-purple-400',
        cyan: 'bg-cyan-500/20 text-cyan-400'
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setExpanded(e => !e)}>
                <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0 cursor-grab" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[typeInfo.color]}`}>
                    <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{local.scene_name || `Scene ${index + 1}`}</p>
                    <p className="text-white/40 text-xs">{typeInfo.label} · {local.background || 'office'}</p>
                </div>
                <div className="flex items-center gap-1 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {saving && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                    {lastSaved && !saving && <span className="text-xs text-green-400/70 flex items-center gap-1"><Clock className="w-3 h-3" />{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onMoveDown(index)} disabled={index === scenes.length - 1} className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDuplicate(scene)} className="p-1.5 rounded text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm('Delete this scene?')) onDelete(scene.id) }} className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {/* Expanded body */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-5 border-t border-white/5 space-y-5">
                            {/* Row 1: Name + Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-xs">📍 Scene Name</label>
                                    <input className="input-field w-full text-sm mt-1" placeholder="e.g. Raka reads the suspicious email" value={local.scene_name || ''} onChange={e => field('scene_name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label-xs">🎬 Scene Type</label>
                                    <div className="flex gap-2 mt-1">
                                        {SCENE_TYPES.map(t => (
                                            <button key={t.value} onClick={() => field('scene_type', t.value)}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${local.scene_type === t.value ? colorMap[t.color] + ' border-current/40' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Background */}
                            <div>
                                <label className="label-xs">🖼️ Background Location</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {backgrounds.map(bg => (
                                        <button key={bg.key_name} onClick={() => field('background', bg.key_name)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${local.background === bg.key_name ? 'bg-primary/20 border-primary/50 text-primary' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                                            {bg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Characters */}
                            <div className="grid grid-cols-2 gap-4">
                                {[['Left', 'char_left', 'char_left_expr'], ['Right', 'char_right', 'char_right_expr']].map(([side, ck, ek]) => {
                                    const selChar = characters.find(c => c.key_name === local[ck])
                                    return (
                                        <div key={side} className="bg-white/3 rounded-xl p-3">
                                            <label className="label-xs">👤 Character ({side})</label>
                                            <select className="input-field w-full text-sm mt-1 mb-2" value={local[ck] || ''} onChange={e => field(ck, e.target.value || null)}>
                                                <option value="">— None —</option>
                                                {characters.map(c => <option key={c.key_name} value={c.key_name}>{c.emoji} {c.name}</option>)}
                                            </select>
                                            {local[ck] && (
                                                <select className="input-field w-full text-sm" value={local[ek] || 'normal'} onChange={e => field(ek, e.target.value)}>
                                                    {(selChar?.expressions || []).map(e => <option key={e.expression_name} value={e.expression_name}>{e.emoji || '😐'} {e.expression_name}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Dialogue fields */}
                            {local.scene_type === 'dialogue' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="label-xs">🗣️ Speaker Name</label>
                                            <input className="input-field w-full text-sm mt-1" placeholder="AKE-BOT" value={local.speaker_name || ''} onChange={e => field('speaker_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">⭐ XP Reward</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">➡️ Next Scene</label>
                                            <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                                <option value="">— Auto-next —</option>
                                                {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">💬 Dialogue Text</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={4} placeholder="What the character says... use {{playerName}} to personalize" value={local.dialogue_text || ''} onChange={e => field('dialogue_text', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Choice fields */}
                            {local.scene_type === 'choice' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs">❓ Question</label>
                                            <textarea className="input-field w-full text-sm resize-none mt-1" rows={3} placeholder="What must the player decide?" value={local.question || ''} onChange={e => field('question', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">⏱️ Timer (seconds, 0 = no timer)</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" min="0" max="60" value={local.timer || 15} onChange={e => field('timer', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs mb-2 block">🔀 Answer Choices</label>
                                        <div className="space-y-3">
                                            {(local.choices || []).map((ch, ci) => (
                                                <ChoiceRow key={ch.id} choice={ch} index={ci} scenes={scenes} currentSceneId={scene.id} onUpdate={data => updateChoice(ch.id, data)} onDelete={() => deleteChoice(ch.id)} />
                                            ))}
                                        </div>
                                        {(local.choices || []).length < 4 && (
                                            <div className="flex gap-2 mt-3">
                                                <input className="input-field flex-1 text-sm" placeholder="Type choice text..." value={newChoiceText} onChange={e => setNewChoiceText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChoice()} />
                                                <button onClick={addChoice} className="btn-primary text-sm px-4 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Ending fields */}
                            {local.scene_type === 'ending' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="label-xs">🏁 Ending Type</label>
                                            <div className="flex gap-2 mt-1">
                                                {['good', 'bad'].map(t => (
                                                    <button key={t} onClick={() => field('ending_type', t)} className={`flex-1 py-2 rounded-lg border text-xs font-bold capitalize transition-all ${local.ending_type === t ? (t === 'good' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400') : 'border-white/10 text-white/40'}`}>
                                                        {t === 'good' ? '🎉' : '💥'} {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-xs">⭐ XP Bonus</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.xp_bonus || 200} onChange={e => field('xp_bonus', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">🏆 Ending Title</label>
                                            <input className="input-field w-full text-sm mt-1" placeholder="e.g. Chapter Complete!" value={local.ending_title || ''} onChange={e => field('ending_title', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">💬 Ending Message</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={3} placeholder="Summary shown at chapter end..." value={local.ending_message || ''} onChange={e => field('ending_message', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Email fields */}
                            {local.scene_type === 'email' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs">✉️ From</label>
                                            <input className="input-field w-full text-sm mt-1" placeholder="e.g. IT-Support@akeb0n0.com" value={local.custom_data?.email?.from || ''} onChange={e => field('custom_data', { ...local.custom_data, email: { ...local.custom_data?.email, from: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="label-xs">✉️ To</label>
                                            <input className="input-field w-full text-sm mt-1" placeholder="e.g. {{playerName}}@akebono-brake.co.id" value={local.custom_data?.email?.to || ''} onChange={e => field('custom_data', { ...local.custom_data, email: { ...local.custom_data?.email, to: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">📌 Subject</label>
                                        <input className="input-field w-full text-sm mt-1" placeholder="URGENT: Verify your account" value={local.custom_data?.email?.subject || ''} onChange={e => field('custom_data', { ...local.custom_data, email: { ...local.custom_data?.email, subject: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">💬 Body</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={6} placeholder="Dear employee..." value={local.custom_data?.email?.body || ''} onChange={e => field('custom_data', { ...local.custom_data, email: { ...local.custom_data?.email, body: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">🚨 Red Flags (comma separated)</label>
                                        <input className="input-field w-full text-sm mt-1" placeholder="Wrong domain, Suspicious link" value={(local.custom_data?.email?.redFlags || []).join(', ')} onChange={e => field('custom_data', { ...local.custom_data, email: { ...local.custom_data?.email, redFlags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">➡️ Next Scene</label>
                                        <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                            <option value="">— Auto-next —</option>
                                            {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Lesson fields */}
                            {local.scene_type === 'lesson' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="label-xs">📚 Lesson Title</label>
                                        <input className="input-field w-full text-sm mt-1" placeholder="Phishing Red Flags" value={local.custom_data?.title || ''} onChange={e => field('custom_data', { ...local.custom_data, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">📝 Lesson Points (One per line)</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={5} placeholder="Always verify sender domain...&#10;Never click suspicious links..." value={(local.custom_data?.points || []).join('\n')} onChange={e => field('custom_data', { ...local.custom_data, points: e.target.value.split('\n').filter(Boolean) })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">➡️ Next Scene</label>
                                        <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                            <option value="">— Auto-next —</option>
                                            {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Investigate / Spot-The-Phish fields */}
                            {local.scene_type === 'investigate' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs">🔎 Target UI Type</label>
                                            <select className="input-field w-full text-sm mt-1" value={local.custom_data?.uiType || 'browser'} onChange={e => field('custom_data', { ...local.custom_data, uiType: e.target.value })}>
                                                <option value="browser">Web Browser</option>
                                                <option value="email">Email Client</option>
                                                <option value="desktop">PC Desktop</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-xs">⏱️ Timer (seconds, 0 = no timer)</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.timer || 0} onChange={e => field('timer', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">⭐ XP Reward on Success</label>
                                        <input type="number" className="input-field w-full text-sm mt-1" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="label-xs">🎯 Target Items (JSON Array)</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1 font-mono" rows={5} placeholder='[{"id":"url","x":20,"y":5,"description":"Fake domain name"},{"id":"attachment","x":50,"y":80,"description":"Suspicious .exe file"}]' value={typeof local.custom_data?.targets === 'string' ? local.custom_data.targets : JSON.stringify(local.custom_data?.targets || [], null, 2)} onChange={e => field('custom_data', { ...local.custom_data, targets: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label-xs">➡️ Next Scene</label>
                                        <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                            <option value="">— Auto-next —</option>
                                            {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Terminal fields */}
                            {local.scene_type === 'terminal' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="label-xs">💻 Terminal Prompt Message</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={3} placeholder="WARNING: Unidentified connection from 192.168.1.55! Type block to stop it." value={local.custom_data?.promptText || ''} onChange={e => field('custom_data', { ...local.custom_data, promptText: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs">⌨️ Correct Command</label>
                                            <input className="input-field w-full text-sm mt-1 font-mono" placeholder="sudo block 192.168.1.55" value={local.custom_data?.correctCommand || ''} onChange={e => field('custom_data', { ...local.custom_data, correctCommand: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label-xs">⏱️ Timer (seconds, 0 = no timer)</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.timer || 0} onChange={e => field('timer', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">⭐ XP Reward on Success</label>
                                        <input type="number" className="input-field w-full text-sm mt-1" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="label-xs">➡️ Next Scene (Success)</label>
                                        <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                            <option value="">— Auto-next —</option>
                                            {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-xs">➡️ Next Scene (Fail/Timeout)</label>
                                        <select className="input-field w-full text-sm mt-1" value={local.custom_data?.failSceneId || ''} onChange={e => field('custom_data', { ...local.custom_data, failSceneId: e.target.value })}>
                                            <option value="">— Auto-next —</option>
                                            {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
