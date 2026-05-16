import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, GripVertical, MessageSquare, HelpCircle, Flag, CheckCircle, Circle, X, Loader2, Clock, Mail, BookOpen, Search, Terminal, Upload, Eye, Key, Shield } from 'lucide-react'
import { useGame } from '../../../contexts/GameContext'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { FakeUIScaledWrapper } from '../../../components/FakeUIBackground'

export const SCENE_TYPES = [
    { value: 'dialogue', label: 'Dialogue', icon: MessageSquare, color: 'blue' },
    { value: 'choice', label: 'Choice', icon: HelpCircle, color: 'yellow' },
    { value: 'investigate', label: 'Spot the Phish', icon: Search, color: 'orange' },
    { value: 'terminal', label: 'Terminal CLI', icon: Terminal, color: 'green' },
    { value: 'ending', label: 'Ending', icon: Flag, color: 'red' },
    { value: 'email', label: 'Email', icon: Mail, color: 'purple' },
    { value: 'lesson', label: 'Lesson', icon: BookOpen, color: 'cyan' },
    { value: 'password_setup', label: 'Password Event', icon: Key, color: 'indigo' },
]

const PREVIEW_BACKGROUNDS = {
    office: {
        gradient: 'from-blue-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(15,52,96,0.8), rgba(26,26,46,0.95))',
    },
    desk: {
        gradient: 'from-indigo-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(49,46,129,0.7), rgba(26,26,46,0.95))',
    },
    server: {
        gradient: 'from-green-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(6,78,59,0.7), rgba(26,26,46,0.95))',
    },
    elevator: {
        gradient: 'from-gray-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(26,26,46,0.95))',
    },
    factory: {
        gradient: 'from-orange-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(120,53,15,0.6), rgba(26,26,46,0.95))',
    },
}

// ─── Scene Preview Modal ───────────────────────────────────────────────────
function ScenePreview({ scene, onClose }) {
    const { CHARACTERS, BACKGROUNDS: globalBackgrounds } = useGame()
    const { user } = useAuth()
    const vaRef = useRef(null)
    const sfxRef = useRef(null)

    const playerName = user?.name?.split(' ')[0] || 'Yusuf'
    const getText = (text) => text?.replace(/\{\{playerName\}\}/gi, playerName) || ''

    // Actual audio playing
    useEffect(() => {
        if (scene.va_url) {
            vaRef.current = new Audio(scene.va_url)
            vaRef.current.play().catch(e => console.warn('VA play blocked', e))
        }
        if (scene.sfx_url) {
            sfxRef.current = new Audio(scene.sfx_url)
            sfxRef.current.play().catch(e => console.warn('SFX play blocked', e))
        }
        return () => {
            vaRef.current?.pause()
            sfxRef.current?.pause()
        }
    }, [scene.va_url, scene.sfx_url])

    const getImgUrl = (charKey, expr) => {
        if (!charKey) return null
        const char = CHARACTERS?.find(c => c.key_name === charKey)
        if (!char) return null
        
        // If center, try full body first
        if (scene.char_center === charKey && char.full_body_url) return char.full_body_url
        
        const expression = char.expressions?.find(e => e.expression_name === expr)
        return expression?.image_url || expression?.sprite_url || null
    }

    const getEmoji = (charKey) => {
        if (!charKey) return '👤'
        const char = CHARACTERS?.find(c => c.key_name === charKey)
        return char?.emoji || '👤'
    }

    const localBg = PREVIEW_BACKGROUNDS[scene.background] || PREVIEW_BACKGROUNDS.office
    const customBg = globalBackgrounds?.find(b => b.key_name === scene.background)

    const bgStyle = customBg && customBg.image_url
        ? { backgroundImage: `url(${customBg.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: localBg.pattern }
    
    const bgGradient = customBg ? '' : localBg.gradient

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-5xl aspect-video bg-dark rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                {/* Background Layer */}
                <div className={`absolute inset-0 z-0 transition-all duration-700 ${bgGradient ? `bg-gradient-to-b ${bgGradient}` : ''}`} style={bgStyle}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                {/* Characters Layer */}
                <div className="absolute inset-0 z-10 flex items-end justify-between px-10 pointer-events-none">
                    {/* Left */}
                    <div className="w-1/3 h-[85%] flex justify-start items-end">
                        {scene.char_left && (
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="h-full w-full max-w-[320px]">
                                {getImgUrl(scene.char_left, scene.char_left_expr) ? (
                                    <img src={getImgUrl(scene.char_left, scene.char_left_expr)} 
                                        className="w-full h-full object-contain object-bottom" 
                                        style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.4))' }}
                                    />
                                ) : (
                                    <div className="h-full aspect-[2/3] bg-white/10 rounded-t-3xl flex items-center justify-center border-t border-x border-white/20 backdrop-blur">
                                        <span className="text-8xl">{getEmoji(scene.char_left)}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                    
                    {/* Right */}
                    <div className="w-1/3 h-[85%] flex justify-end items-end">
                        {scene.char_right && (
                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="h-full w-full max-w-[320px]">
                                {getImgUrl(scene.char_right, scene.char_right_expr) ? (
                                    <img src={getImgUrl(scene.char_right, scene.char_right_expr)} 
                                        className="w-full h-full object-contain object-bottom" 
                                        style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.4))' }}
                                    />
                                ) : (
                                    <div className="h-full aspect-[2/3] bg-white/10 rounded-t-3xl flex items-center justify-center border-t border-x border-white/20 backdrop-blur">
                                        <span className="text-8xl">{getEmoji(scene.char_right)}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Center Character (Priority) */}
                {scene.char_center && (
                    <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none overflow-hidden">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-[75%] w-full max-w-[400px]">
                            {getImgUrl(scene.char_center, scene.char_center_expr) ? (
                                <img src={getImgUrl(scene.char_center, scene.char_center_expr)} 
                                    className="w-full h-full object-contain object-bottom scale-110" 
                                    style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.5)) drop-shadow(0 0 2px rgba(255,255,255,0.4))' }}
                                />
                            ) : (
                                <div className="h-full aspect-[2/3] bg-white/10 rounded-t-3xl flex items-center justify-center border-t border-x border-white/20 backdrop-blur scale-110">
                                    <span className="text-9xl">{getEmoji(scene.char_center)}</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Dialogue Box */}
                <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-bold uppercase tracking-widest mb-3">
                            {getText(scene.speaker_name) || 'Narrator'}
                        </div>
                        <p className="text-lg md:text-xl text-white font-medium leading-relaxed drop-shadow-sm">
                            {getText(scene.dialogue_text) || '...'}
                        </p>
                        
                        {/* Fake UI Hint */}
                        <div className="mt-4 flex justify-end">
                            <span className="text-[10px] text-dim font-bold uppercase tracking-tighter opacity-50">Quick Preview Mode</span>
                        </div>
                    </motion.div>
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-[100] w-12 h-12 rounded-full bg-black/40 hover:bg-red-500/80 text-white flex items-center justify-center backdrop-blur transition-all border border-white/10">
                    <X className="w-6 h-6" />
                </button>
                
                {/* Header Info */}
                <div className="absolute top-6 left-6 z-[100] bg-black/40 backdrop-blur border border-white/10 rounded-xl px-4 py-2">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">LIVE PREVIEW</p>
                    <p className="text-xs text-white font-semibold">{scene.scene_name || 'Untitled Scene'}</p>
                </div>
            </motion.div>
        </div>
    )
}

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
        <div className={`rounded-xl border p-4 space-y-3 ${local.is_correct ? 'border-green-500/30 bg-green-500/5' : 'border-card-border bg-input-bg'}`}>
            <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${local.is_correct ? 'bg-green-500 text-white' : 'bg-card-border text-dim'}`}>{LETTERS[index]}</span>
                <input className="input-field flex-1 text-sm" placeholder="What the player sees..." value={local.choice_text || ''} onChange={e => field('choice_text', e.target.value)} />
                <button onClick={() => field('is_correct', !local.is_correct)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${local.is_correct ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'border-card-border text-dim hover:border-text-dim'}`}>
                    {local.is_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {local.is_correct ? 'Correct' : 'Wrong'}
                </button>
                {local.is_correct && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-dim">XP</span>
                        <input type="number" className="input-field w-14 text-xs py-1.5" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                    </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                    <Shield className="w-3 h-3 text-primary" />
                    <input type="number" className="input-field w-12 text-xs py-1.5" placeholder="Trust" title="Trust Impact (+/-)" value={local.trust_impact || 0} onChange={e => field('trust_impact', parseInt(e.target.value) || 0)} />
                </div>
                <button onClick={onDelete} className="text-dim hover:text-red-400 p-1.5 rounded flex-shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>

            {!local.is_correct && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-dim mb-1">💥 Consequence (what happened)</label>
                        <textarea className="input-field w-full text-xs resize-none" rows={2} placeholder="e.g. You clicked a phishing link..." value={local.consequence_text || ''} onChange={e => field('consequence_text', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-dim mb-1">📚 Lesson (what to remember)</label>
                        <textarea className="input-field w-full text-xs resize-none" rows={2} placeholder="e.g. Always verify sender email..." value={local.lesson_text || ''} onChange={e => field('lesson_text', e.target.value)} />
                    </div>
                </div>
            )}
            <div>
                <label className="block text-xs text-dim mb-1">➡️ Next Scene after this choice</label>
                <select className="input-field w-full text-xs" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">— Follow default order —</option>
                    {scenes.filter(s => s.id !== currentSceneId).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                </select>
            </div>
        </div>
    )
}

// ─── Target Visual Picker ──────────────────────────────────────────────────
function TargetVisualPicker({ uiType, targets, onAddTarget, uiTypesData = [] }) {
    const [dragStart, setDragStart] = useState(null)
    const [currentPos, setCurrentPos] = useState(null)

    const getCoords = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        // Get scale from rect vs internal 800px width
        const currentScale = rect.width / 800
        
        // Find scroll container if exists
        const scrollContainer = e.currentTarget.querySelector('.vn-scroll-container')
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0
        const totalHeight = scrollContainer ? scrollContainer.scrollHeight : 450

        const localX = (e.clientX - rect.left) / currentScale
        const localY = ((e.clientY - rect.top) / currentScale) + scrollTop

        return {
            x: Math.min(Math.max((localX / 800) * 100, 0), 100),
            y: Math.min(Math.max((localY / totalHeight) * 100, 0), 100)
        }
    }

    const handlePointerDown = (e) => {
        const pos = getCoords(e)
        setDragStart(pos)
        setCurrentPos(pos)
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e) => {
        if (!dragStart) return
        setCurrentPos(getCoords(e))
    }

    const handlePointerUp = (e) => {
        if (!dragStart || !currentPos) return
        e.currentTarget.releasePointerCapture(e.pointerId)

        const x = Math.round(Math.min(dragStart.x, currentPos.x))
        const y = Math.round(Math.min(dragStart.y, currentPos.y))
        const w = Math.round(Math.abs(currentPos.x - dragStart.x))
        const h = Math.round(Math.abs(currentPos.y - dragStart.y))

        if (w < 2 && h < 2) {
            onAddTarget(Math.min(x, 94), Math.min(y, 90), 6, 10)
        } else {
            onAddTarget(x, y, w, h)
        }

        setDragStart(null)
        setCurrentPos(null)
    }

    const drawDragBox = () => {
        if (!dragStart || !currentPos) return null
        const x = Math.min(dragStart.x, currentPos.x)
        const y = Math.min(dragStart.y, currentPos.y)
        const w = Math.abs(currentPos.x - dragStart.x)
        const h = Math.abs(currentPos.y - dragStart.y)
        return (
            <div className="absolute bg-blue-500/30 border border-blue-500 pointer-events-none z-50"
                 style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />
        )
    }

    return (
        <FakeUIScaledWrapper 
            uiType={uiType}
            uiTypesData={uiTypesData}
            className={`mt-3 mb-4 cursor-crosshair rounded-lg border-2 border-card-border shadow-lg ${dragStart ? 'touch-none' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
             {targets.map(t => {
                 const w = t.w || 6
                 const h = t.h || 10
                 return (
                     <div key={t.id} 
                          className="absolute bg-red-500/30 border-2 border-red-500 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm pointer-events-none z-10"
                          style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${w}%`, height: `${h}%` }}
                     >
                        <span className="text-[10px] font-bold text-white leading-none drop-shadow-md text-center max-w-full overflow-hidden text-clip px-1 leading-[1.2]">{t.description || `${t.x},${t.y}`}</span>
                     </div>
                 )
             })}
             
             {drawDragBox()}
             
             <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none z-50">
                 Click and drag to draw a bounding box
             </div>
        </FakeUIScaledWrapper>
    )
}

// ─── Scene Card ────────────────────────────────────────────────────────────
export function SceneCard({ scene, index, scenes, characters, backgrounds, uiTypes = [], onUpdate, onDelete, onMoveUp, onMoveDown, onDuplicate }) {
    const [expanded, setExpanded] = useState(false)
    const [local, setLocal] = useState(scene)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [newChoiceText, setNewChoiceText] = useState('')
    const [uploadingAudio, setUploadingAudio] = useState(false)
    const debounceRef = useRef(null)

    useEffect(() => { setLocal(scene) }, [scene])

    const handleUploadAudio = async (e, fieldKey) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingAudio(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await axios.post('/api/cms/media/upload', fd)
            field(fieldKey, res.data.url)
            toast.success('Audio uploaded')
        } catch (err) {
            toast.error('Upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploadingAudio(false)
            // Reset input so we can upload same file again if needed
            e.target.value = ''
        }
    }

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
        cyan: 'bg-cyan-500/20 text-cyan-400',
        indigo: 'bg-indigo-500/20 text-indigo-400'
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-input-bg transition-colors" onClick={() => setExpanded(e => !e)}>
                <GripVertical className="w-4 h-4 text-dim flex-shrink-0 cursor-grab" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[typeInfo.color]}`}>
                    <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-main truncate">{local.scene_name || `Scene ${index + 1}`}</p>
                    <p className="text-dim text-xs">{typeInfo.label} · {local.background || 'office'}</p>
                </div>
                <div className="flex items-center gap-1 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {saving && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                    {lastSaved && !saving && <span className="text-xs text-green-400/70 flex items-center gap-1"><Clock className="w-3 h-3" />{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    <button onClick={() => setShowPreview(true)} title="Quick Preview" className="p-1.5 rounded text-dim hover:text-primary hover:bg-primary/10 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1.5 rounded text-dim hover:text-main hover:bg-card-border disabled:opacity-20 transition-all"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onMoveDown(index)} disabled={index === scenes.length - 1} className="p-1.5 rounded text-dim hover:text-main hover:bg-card-border disabled:opacity-20 transition-all"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDuplicate(scene)} className="p-1.5 rounded text-dim hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm('Delete this scene?')) onDelete(scene.id) }} className="p-1.5 rounded text-dim hover:text-red-400 hover:bg-red-400/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {showPreview && <ScenePreview scene={local} onClose={() => setShowPreview(false)} />}

            {/* Expanded body */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-5 border-t border-card-border space-y-5">
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
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${local.background === bg.key_name ? 'bg-primary/20 border-primary/50 text-primary' : 'border-card-border bg-input-bg hover:border-white/20'}`}>
                                            {bg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Characters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[['Left', 'char_left', 'char_left_expr'], ['Center', 'char_center', 'char_center_expr'], ['Right', 'char_right', 'char_right_expr']].map(([side, ck, ek]) => {
                                    const selChar = characters.find(c => c.key_name === local[ck])
                                    return (
                                        <div key={side} className="bg-input-bg rounded-xl p-3 border border-card-border">
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

                            {/* Audio & Media */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-xs">🎤 Voice Acting URL</label>
                                    <div className="flex gap-2 mt-1">
                                        <input className="input-field flex-1 text-sm" placeholder="/uploads/voice.mp3 or URL" value={local.va_url || ''} onChange={e => field('va_url', e.target.value)} />
                                        <label className={`btn-primary cursor-pointer flex items-center justify-center px-3 ${uploadingAudio ? 'opacity-50' : ''}`}>
                                            {uploadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <input type="file" accept="audio/*" className="hidden" onChange={e => handleUploadAudio(e, 'va_url')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="label-xs">🔊 Sound Effect (SFX) URL</label>
                                    <div className="flex gap-2 mt-1">
                                        <input className="input-field flex-1 text-sm" placeholder="/uploads/sfx.mp3 or URL" value={local.sfx_url || ''} onChange={e => field('sfx_url', e.target.value)} />
                                        <label className={`btn-primary cursor-pointer flex items-center justify-center px-3 ${uploadingAudio ? 'opacity-50' : ''}`}>
                                            {uploadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <input type="file" accept="audio/*" className="hidden" onChange={e => handleUploadAudio(e, 'sfx_url')} />
                                        </label>
                                    </div>
                                </div>
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
                                            <label className="label-xs">🛡️ Trust Impact</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" placeholder="+/-" value={local.trust_impact || 0} onChange={e => field('trust_impact', parseInt(e.target.value) || 0)} />
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

                            {/* Password Setup fields */}
                            {local.scene_type === 'password_setup' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-input-bg border border-card-border rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">⚙️ Password Policy</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="label-xs">Min Length</label>
                                                    <input type="number" min="1" className="input-field w-full text-sm" value={local.custom_data?.min_length || 8} 
                                                        onChange={e => customField('min_length', parseInt(e.target.value) || 8)} />
                                                </div>
                                                <div className="flex flex-col justify-end gap-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-card-border bg-dark checked:bg-primary" 
                                                            checked={!!local.custom_data?.require_uppercase} 
                                                            onChange={e => customField('require_uppercase', e.target.checked)} />
                                                        <span className="text-xs text-dim group-hover:text-main transition-colors">Uppercase</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-card-border bg-dark checked:bg-primary" 
                                                            checked={!!local.custom_data?.require_symbol} 
                                                            onChange={e => customField('require_symbol', e.target.checked)} />
                                                        <span className="text-xs text-dim group-hover:text-main transition-colors">Symbol</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-xs">Crack Visualization</label>
                                                <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-card-border bg-dark checked:bg-primary" 
                                                        checked={local.custom_data?.show_crack_time !== false} 
                                                        onChange={e => customField('show_crack_time', e.target.checked)} />
                                                    <span className="text-xs text-dim">Tampilkan waktu bobol (Realtime)</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="bg-input-bg border border-card-border rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">💎 Reward & Impact</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="label-xs text-red-400">Weak</label>
                                                    <input type="number" className="input-field w-full text-sm" placeholder="XP" value={local.custom_data?.xp_weak || 10} 
                                                        onChange={e => customField('xp_weak', parseInt(e.target.value) || 0)} />
                                                </div>
                                                <div>
                                                    <label className="label-xs text-yellow-400">Medium</label>
                                                    <input type="number" className="input-field w-full text-sm" placeholder="XP" value={local.custom_data?.xp_medium || 50} 
                                                        onChange={e => customField('xp_medium', parseInt(e.target.value) || 0)} />
                                                </div>
                                                <div>
                                                    <label className="label-xs text-green-400">Strong</label>
                                                    <input type="number" className="input-field w-full text-sm" placeholder="XP" value={local.custom_data?.xp_strong || 150} 
                                                        onChange={e => customField('xp_strong', parseInt(e.target.value) || 0)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="label-xs">Base Score Impact</label>
                                                    <input type="number" className="input-field w-full text-sm" value={local.custom_data?.impact_score || 20} 
                                                        onChange={e => customField('impact_score', parseInt(e.target.value) || 0)} />
                                                </div>
                                                <div>
                                                    <label className="label-xs">Next Scene</label>
                                                    <select className="input-field w-full text-sm" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                                        <option value="">— Auto-next —</option>
                                                        {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label-xs">💬 Introduction / Instruction</label>
                                        <textarea className="input-field w-full text-sm resize-none mt-1" rows={3} 
                                            placeholder="e.g. Please set a strong password to secure your workstation..." 
                                            value={local.dialogue_text || ''} onChange={e => field('dialogue_text', e.target.value)} />
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
                                                {uiTypes.map(ut => (
                                                    <option key={ut.id} value={ut.key_name}>{ut.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-xs">⏱️ Timer (seconds, 0 = no timer)</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.timer || 0} onChange={e => field('timer', parseInt(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs">⭐ XP Reward on Success</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.xp_reward || 0} onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">🛡️ Trust Impact (Success)</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.trust_impact || 0} onChange={e => field('trust_impact', parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <label className="label-xs">❌ Max False Points</label>
                                            <input type="number" className="input-field w-full text-sm mt-1" value={local.custom_data?.maxFalsePoints || 3} onChange={e => field('custom_data', { ...local.custom_data, maxFalsePoints: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="label-xs">🎯 Target Items</label>
                                            <button onClick={() => {
                                                const currentTargets = (typeof local.custom_data?.targets === 'string' ? (() => { try { return JSON.parse(local.custom_data.targets) } catch { return [] } })() : local.custom_data?.targets) || [];
                                                field('custom_data', { ...local.custom_data, targets: [...currentTargets, { id: Date.now().toString(), x: 50, y: 50, description: '' }] });
                                            }} className="btn-primary text-xs px-2 py-1 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Target</button>
                                        </div>
                                        
                                        {/* Visual Picker Component */}
                                        <TargetVisualPicker 
                                            uiType={local.custom_data?.uiType || 'browser'} 
                                            uiTypesData={uiTypes}
                                            targets={(() => {
                                                const targetsList = (typeof local.custom_data?.targets === 'string' ? (() => { try { return JSON.parse(local.custom_data.targets) } catch { return [] } })() : local.custom_data?.targets) || [];
                                                return targetsList;
                                            })()}
                                            onAddTarget={(x, y, w, h) => {
                                                const currentTargets = (typeof local.custom_data?.targets === 'string' ? (() => { try { return JSON.parse(local.custom_data.targets) } catch { return [] } })() : local.custom_data?.targets) || [];
                                                field('custom_data', { ...local.custom_data, targets: [...currentTargets, { id: Date.now().toString(), x, y, w: w || 6, h: h || 10, description: '' }] });
                                            }}
                                        />

                                        <div className="space-y-2">
                                            {(() => {
                                                const targetsList = (typeof local.custom_data?.targets === 'string' ? (() => { try { return JSON.parse(local.custom_data.targets) } catch { return [] } })() : local.custom_data?.targets) || [];
                                                return targetsList.map((t, i) => (
                                                    <div key={t.id || i} className="flex items-center gap-2 bg-input-bg p-2 rounded border border-card-border">
                                                        <div className="flex flex-col gap-1 w-12">
                                                            <label className="text-[10px] text-dim">X (%)</label>
                                                            <input type="number" className="input-field text-xs py-1 px-1 text-center" value={t.x || 0} onChange={e => {
                                                                const newTargets = [...targetsList];
                                                                newTargets[i] = { ...t, x: parseInt(e.target.value) || 0 };
                                                                field('custom_data', { ...local.custom_data, targets: newTargets });
                                                            }} />
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-12">
                                                            <label className="text-[10px] text-dim">Y (%)</label>
                                                            <input type="number" className="input-field text-xs py-1 px-1 text-center" value={t.y || 0} onChange={e => {
                                                                const newTargets = [...targetsList];
                                                                newTargets[i] = { ...t, y: parseInt(e.target.value) || 0 };
                                                                field('custom_data', { ...local.custom_data, targets: newTargets });
                                                            }} />
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-12">
                                                            <label className="text-[10px] text-dim">W (%)</label>
                                                            <input type="number" className="input-field text-xs py-1 px-1 text-center" value={t.w || 6} onChange={e => {
                                                                const newTargets = [...targetsList];
                                                                newTargets[i] = { ...t, w: parseInt(e.target.value) || 0 };
                                                                field('custom_data', { ...local.custom_data, targets: newTargets });
                                                            }} />
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-12">
                                                            <label className="text-[10px] text-dim">H (%)</label>
                                                            <input type="number" className="input-field text-xs py-1 px-1 text-center" value={t.h || 10} onChange={e => {
                                                                const newTargets = [...targetsList];
                                                                newTargets[i] = { ...t, h: parseInt(e.target.value) || 0 };
                                                                field('custom_data', { ...local.custom_data, targets: newTargets });
                                                            }} />
                                                        </div>
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <label className="text-[10px] text-dim">Description</label>
                                                            <input className="input-field text-xs py-1 px-2" placeholder="e.g. Malicious link" value={t.description || ''} onChange={e => {
                                                                const newTargets = [...targetsList];
                                                                newTargets[i] = { ...t, description: e.target.value };
                                                                field('custom_data', { ...local.custom_data, targets: newTargets });
                                                            }} />
                                                        </div>
                                                        <button onClick={() => {
                                                            const newTargets = targetsList.filter((_, idx) => idx !== i);
                                                            field('custom_data', { ...local.custom_data, targets: newTargets });
                                                        }} className="text-dim hover:text-red-400 p-1 mt-4 rounded flex-shrink-0 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ));
                                            })()}
                                            {(!local.custom_data?.targets || (typeof local.custom_data.targets === 'string' ? (() => { try { return JSON.parse(local.custom_data.targets) } catch { return [] } })() : local.custom_data.targets).length === 0) && (
                                                <div className="text-xs text-dim italic p-2 border border-dashed border-card-border rounded text-center">No targets added yet.</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 border-t border-card-border pt-4 mt-2">
                                        <div>
                                            <label className="label-xs text-green-500 font-bold">✅ Success Next Scene</label>
                                            <select className="input-field w-full text-sm mt-1" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                                                <option value="">— Auto-next —</option>
                                                {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-xs text-red-500 font-bold">❌ Failure Next Scene</label>
                                            <select className="input-field w-full text-sm mt-1" value={local.custom_data?.failSceneId || ''} onChange={e => field('custom_data', { ...local.custom_data, failSceneId: e.target.value ? parseInt(e.target.value) : null })}>
                                                <option value="">— End Scene / Game Over —</option>
                                                {scenes.filter(s => s.id !== scene.id).map(s => <option key={s.id} value={s.id}>{s.scene_name}</option>)}
                                            </select>
                                        </div>
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
                                        <label className="label-xs">🛡️ Trust Impact (Success)</label>
                                        <input type="number" className="input-field w-full text-sm mt-1" value={local.trust_impact || 0} onChange={e => field('trust_impact', parseInt(e.target.value) || 0)} />
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
