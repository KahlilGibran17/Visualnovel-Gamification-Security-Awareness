import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  NodeResizer,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { 
    Save, Plus, Trash2, ArrowLeft, GitBranch, 
    MessageSquare, HelpCircle, Flag, Search, 
    Terminal, Mail, BookOpen, Key, Shield,
    Clock, MousePointer2, ZoomIn, ZoomOut, Maximize,
    FileText, Layers, StickyNote, RefreshCw, Eye, X, Settings, Image as ImageIcon,
    User, Upload, Volume2, CheckCircle2, AlertCircle, Palette, Type, Music, Mic, ChevronRight, Layout,
    Undo, Redo, Copy, ClipboardPaste, Play
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../../../contexts/GameContext'

const SCENE_TYPE_CONFIG = {
    dialogue: { icon: MessageSquare, color: '#3b82f6', label: 'Dialogue' },
    choice: { icon: HelpCircle, color: '#fbbf24', label: 'Choice' },
    investigate: { icon: Search, color: '#f97316', label: 'Spot Phish' },
    terminal: { icon: Terminal, color: '#10b981', label: 'Terminal' },
    password_setup: { icon: Key, color: '#6366f1', label: 'Password' },
    email: { icon: Mail, color: '#a855f7', label: 'Email' },
    lesson: { icon: BookOpen, color: '#06b6d4', label: 'Lesson' },
    video: { icon: Play, color: '#ef4444', label: 'Video' },
    ending: { icon: Flag, color: '#ef4444', label: 'Ending' },
}

// ─── Shared UI Components ──────────────────────────────────────────────────

const DarkInput = (props) => (
    <input {...props} style={{ backgroundColor: '#1f1f33', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', width: '100%', fontSize: '13px', outline: 'none', ...props.style }} />
)
const DarkTextArea = (props) => (
    <textarea {...props} style={{ backgroundColor: '#1f1f33', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', width: '100%', fontSize: '13px', outline: 'none', resize: 'none', ...props.style }} />
)
const DarkSelect = (props) => (
    <select {...props} style={{ backgroundColor: '#1f1f33', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', width: '100%', fontSize: '13px', outline: 'none', cursor: 'pointer', ...props.style }}>{props.children}</select>
)

// ─── Nodes ───────────────────────────────────────────────────────────────

const SceneNode = ({ data, selected }) => {
    const config = SCENE_TYPE_CONFIG[data.scene_type] || SCENE_TYPE_CONFIG.dialogue
    const isChoice = data.scene_type === 'choice'
    const isChallenge = ['investigate', 'terminal'].includes(data.scene_type)
    const choices = data.choices || []

    return (
        <div style={{ width: 240, minHeight: isChoice ? 100 + (choices.length * 24) : 80 }} className={`group relative bg-[#1a1a2e] border-2 rounded-xl transition-all duration-300 shadow-2xl ${selected ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-white/10 hover:border-white/30'}`}>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    const chapterId = window.location.pathname.split('/').pop();
                    window.open(`/play/${chapterId}?startSceneId=${data.id}`, '_blank');
                }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 hover:bg-green-400 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-50"
                title="Play From Here"
            >
                <Play className="w-4 h-4 fill-current" />
            </button>
            <div className="h-2 w-full" style={{ backgroundColor: config.color }} />
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10"><config.icon className="w-3 h-3" style={{ color: config.color }} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">{config.label}</span>
                    </div>
                    {data.id_num && <span className="text-[9px] font-mono text-white/20">#{data.id_num}</span>}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-white truncate leading-tight">{data.scene_name || 'Untitled Scene'}</h3>
                    <p className="text-[10px] text-white/40 truncate mt-1 leading-relaxed">{data.dialogue_text || data.question || '(No content)'}</p>
                </div>
                
                {isChoice && choices.length > 0 && (
                    <div className="mt-2 space-y-0.5 border-t border-white/5 pt-2 pb-1">
                        {choices.map((c, i) => (
                            <div key={c.id} className="h-5 flex items-center justify-between gap-2 px-1 rounded hover:bg-white/5">
                                <span className="text-[9px] text-white/30 truncate flex-1">{String.fromCharCode(65 + i)}. {c.choice_text}</span>
                                <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: '#fbbf24' }} />
                            </div>
                        ))}
                    </div>
                )}

                {isChallenge && (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                            <span className="text-[8px] text-white/30 uppercase font-black">Success</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-white/30 uppercase font-black">Failure</span>
                            <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                        </div>
                    </div>
                )}
            </div>

            <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-[#1a1a2e] !-left-1.5" />
            
            {isChoice ? (
                choices.map((c, i) => {
                    const top = 78 + (i * 20.5) 
                    return (
                        <Handle 
                            key={c.id}
                            type="source" 
                            position={Position.Right} 
                            id={`choice-${c.id}`}
                            className="!w-2.5 !h-2.5 !bg-yellow-500 !border-2 !border-[#1a1a2e] !-right-1.5 !z-50 hover:!scale-150 transition-transform cursor-crosshair"
                            style={{ top }}
                        />
                    )
                })
            ) : isChallenge ? (
                <>
                    <Handle type="source" position={Position.Right} id="success" className="!w-2.5 !h-2.5 !bg-green-500 !border-2 !border-[#1a1a2e] !-right-1.5 hover:!scale-150 transition-transform" style={{ top: '78%' }} />
                    <Handle type="source" position={Position.Right} id="fail" className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-[#1a1a2e] !-right-1.5 hover:!scale-150 transition-transform" style={{ top: '88%' }} />
                </>
            ) : (
                <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-[#1a1a2e] !-right-1.5" />
            )}
        </div>
    )
}

const ZoneNode = ({ data, selected }) => (
    <>
        <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-purple-500" handleClassName="h-3 w-3 bg-white border-2 border-purple-500 rounded-full" />
        <div className={`relative group w-full h-full rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center ${selected ? 'ring-4 ring-white/10 scale-[1.01]' : ''}`} style={{ backgroundColor: `${data.color || '#3b82f6'}10`, borderColor: `${data.color || '#3b82f6'}40` }}>
            <div className="absolute -top-10 left-0 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl whitespace-nowrap">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color || '#3b82f6' }} />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{data.title || 'Untitled Zone'}</span>
            </div>
        </div>
    </>
)

const NoteNode = ({ data, selected }) => (
    <div className={`p-6 min-w-[200px] max-w-[300px] rounded-2xl shadow-2xl transition-all duration-300 relative group ${selected ? 'ring-4 ring-white/20 scale-105' : 'hover:scale-102'}`} style={{ backgroundColor: data.color || '#fbbf24', color: '#1a1a2e' }}>
        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{data.content || 'Take notes here...'}</p>
    </div>
)

const nodeTypes = { sceneNode: SceneNode, zoneNode: ZoneNode, noteNode: NoteNode }

// ─── Sidebar Components ──────────────────────────────────────────────────

function ChoiceRowEditor({ choice, index, scenes, currentSceneId, onUpdate, onDelete }) {
    const [local, setLocal] = useState(choice), debounce = useRef(null)
    
    // Only reset local state if the choice ID changes (e.g. switching nodes)
    // or if we're not currently editing and the data is fundamentally different
    useEffect(() => { 
        if (local.id !== choice.id) {
            setLocal(choice);
        }
    }, [choice.id])
    
    const doSave = async (data) => {
        try {
            const res = await axios.put(`/api/cms/choices/${data.id}`, data)
            onUpdate(res.data)
        } catch (err) {
            toast.error('Gagal simpan pilihan')
        }
    }

    const field = (k, v) => { 
        const upd = { ...local, [k]: v }; 
        setLocal(upd); 
        clearTimeout(debounce.current); 
        debounce.current = setTimeout(() => doSave(upd), 700) 
    }
    
    return (
        <div className={`p-4 rounded-xl border space-y-3 ${local.is_correct ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 bg-[#131325]'}`}>
            <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${local.is_correct ? 'bg-green-500 text-white' : 'bg-white/5 text-white/40'}`}>{String.fromCharCode(65 + index)}</span>
                <input className="flex-1 bg-transparent border-none text-xs text-white p-0 focus:ring-0" value={local.choice_text || ''} onChange={e => field('choice_text', e.target.value)} placeholder="Choice text..." />
                <button onClick={() => field('is_correct', !local.is_correct)} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${local.is_correct ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'}`}>{local.is_correct ? 'Correct' : 'Wrong'}</button>
                <button onClick={onDelete} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {!local.is_correct && (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[8px] text-white/20 uppercase font-black block mb-1">Consequence</label>
                        <textarea className="w-full bg-white/5 border border-white/5 rounded-lg p-2 text-[10px] text-white/60 focus:ring-1 focus:ring-purple-500 outline-none" rows={2} placeholder="Consequence..." value={local.consequence_text || ''} onChange={e => field('consequence_text', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[8px] text-white/20 uppercase font-black block mb-1">Lesson</label>
                        <textarea className="w-full bg-white/5 border border-white/5 rounded-lg p-2 text-[10px] text-white/60 focus:ring-1 focus:ring-purple-500 outline-none" rows={2} placeholder="Lesson..." value={local.lesson_text || ''} onChange={e => field('lesson_text', e.target.value)} />
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-1">
                    <span className="text-[10px] text-white/30">Next:</span>
                    <select className="bg-transparent border-none text-[10px] text-purple-400 p-0 focus:ring-0" value={local.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="" style={{ background: '#161622' }}>Default Order</option>
                        {scenes.filter(s => s.id !== currentSceneId).map(s => <option key={s.id} value={s.id} style={{ background: '#161622' }}>{s.scene_name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-red-500" />
                    <input 
                        type="number" 
                        className="w-10 bg-transparent border-none text-[10px] text-red-400 font-bold p-0" 
                        value={local.trust_impact ?? 0} 
                        onChange={e => {
                            const val = e.target.value;
                            if (val === "" || val === "-") {
                                setLocal(p => ({ ...p, trust_impact: val }));
                            } else {
                                field('trust_impact', parseInt(val) || 0);
                            }
                        }} 
                    />
                </div>
            </div>
        </div>
    )
}


function UniversalSidebar({ node, scenes, characters, backgrounds, uiTypes, badges = [], onClose, onUpdate }) {
    // We use the node.data directly as the source of truth to avoid stale state overwrites
    const [form, setForm] = useState(node.data), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false)
    
    // Sync local form when the selected node changes
    useEffect(() => { setForm(node.data) }, [node.id]) 

    const field = (k, v) => {
        const updated = { ...form, [k]: v };
        setForm(updated);
        // Important: Update the parent state immediately so the canvas and sidebar are in sync
        onUpdate(updated);
    }

    const cf = (k, v) => {
        const updatedCustom = { ...(form.custom_data || {}), [k]: v };
        field('custom_data', updatedCustom);
    }
    
    const save = async () => { 
        setSaving(true); 
        try { 
            let res; 
            if (node.type === 'sceneNode') {
                // Don't include choices in the scene update payload to prevent overwriting
                // choices with potentially stale local state. Choices are handled atomically.
                const { choices, ...sceneData } = form;
                res = await axios.put(`/api/cms/scenes/${node.data.id}`, sceneData); 
            }
            else if (node.type === 'zoneNode') res = await axios.put(`/api/cms/flow/zones/${node.data.id}`, form); 
            else if (node.type === 'noteNode') res = await axios.put(`/api/cms/flow/notes/${node.data.id}`, form); 
            
            const savedData = res.data;
            // Merge back the choices we have locally so they don't disappear from the UI
            const updatedForm = { ...savedData, choices: form.choices };
            setForm(updatedForm);
            onUpdate(updatedForm); 
            toast.success('Configuration saved permanently') 
        } catch (err) { 
            toast.error('Failed to save configuration') 
        } finally { 
            setSaving(false) 
        } 
    }
    
    const uploadMedia = async (e, key) => { 
        const file = e.target.files?.[0]; 
        if (!file) return; 
        setUploading(true); 
        try { 
            const fd = new FormData(); 
            fd.append('file', file); 
            const res = await axios.post('/api/cms/media/upload', fd); 
            if (key === 'videoUrl') cf('videoUrl', res.data.url);
            else field(key, res.data.url); 
            toast.success('Uploaded') 
        } catch (err) { 
            toast.error('Upload failed') 
        } finally { 
            setUploading(false); 
            e.target.value = '' 
        } 
    }

    const CharSelect = ({ label, ck, ek }) => {
        const selChar = characters.find(c => c.key_name === form[ck])
        return (
            <div style={{ backgroundColor: '#131325' }} className="rounded-xl p-3 border border-white/5">
                <label className="text-[9px] font-black text-white/20 uppercase mb-2 block">{label}</label>
                <select className="w-full bg-transparent text-xs border-none focus:ring-0 p-0 mb-1 text-white" value={form[ck] || ''} onChange={e => field(ck, e.target.value || null)}><option value="" style={{ background: '#161622' }}>— None —</option>{characters.map(c => <option key={c.key_name} value={c.key_name} style={{ background: '#161622' }}>{c.emoji} {c.name}</option>)}</select>
                {form[ck] && <select className="w-full bg-transparent text-[10px] text-purple-400 border-none focus:ring-0 p-0" value={form[ek] || 'normal'} onChange={e => field(ek, e.target.value)}>{(selChar?.expressions || []).map(e => <option key={e.expression_name} value={e.expression_name} style={{ background: '#161622' }}>{e.emoji || '😐'} {e.expression_name}</option>)}</select>}
            </div>
        )
    }

    return (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{ backgroundColor: '#161622' }} className="absolute right-0 top-0 bottom-0 w-[460px] border-l border-white/10 z-[999] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40"><div className="flex items-center gap-4"><div className="p-2.5 rounded-2xl bg-purple-500/20">{node.type === 'sceneNode' ? <Settings className="w-6 h-6 text-purple-400" /> : node.type === 'zoneNode' ? <Layers className="w-6 h-6 text-purple-400" /> : <StickyNote className="w-6 h-6 text-purple-400" />}</div><div><h3 className="font-bold text-white text-base">Edit {node.type === 'sceneNode' ? 'Scene' : node.type === 'zoneNode' ? 'Zone' : 'Note'}</h3><p className="text-[10px] text-white/30 font-mono">ID: {form.id}</p></div></div><button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40"><X /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {node.type === 'sceneNode' && (
                    <>
                        <section className="space-y-4"><label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Header & Type</label><DarkInput placeholder="Scene Name" value={form.scene_name || ''} onChange={e => field('scene_name', e.target.value)} /><div className="grid grid-cols-2 gap-3"><DarkSelect value={form.scene_type || 'dialogue'} onChange={e => field('scene_type', e.target.value)}>{Object.entries(SCENE_TYPE_CONFIG).map(([val, cfg]) => <option key={val} value={val} style={{ background: '#161622' }}>{cfg.label}</option>)}</DarkSelect><DarkSelect value={form.background || 'office'} onChange={e => field('background', e.target.value)}>{backgrounds.map(bg => <option key={bg.key_name} value={bg.key_name} style={{ background: '#161622' }}>{bg.name}</option>)}</DarkSelect></div></section>
                        <section className="space-y-4"><label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Characters</label><div className="grid grid-cols-3 gap-2"><CharSelect label="Left" ck="char_left" ek="char_left_expr" /><CharSelect label="Center" ck="char_center" ek="char_center_expr" /><CharSelect label="Right" ck="char_right" ek="char_right_expr" /></div></section>
                        <section className="space-y-4"><label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Audio & Media</label><div className="grid grid-cols-2 gap-3"><div className="bg-[#131325] p-3 rounded-xl border border-white/5 flex items-center gap-3"><Mic className="w-4 h-4 text-purple-400" /><div className="flex-1 overflow-hidden"><label className="text-[9px] text-white/30 uppercase block">Voice URL</label><input className="w-full bg-transparent border-none text-[10px] p-0 text-white truncate" value={form.va_url || ''} onChange={e => field('va_url', e.target.value)} /></div><label className="cursor-pointer p-1.5 hover:bg-white/5 rounded-lg"><Upload className="w-3.5 h-3.5 text-white/40" /><input type="file" className="hidden" accept="audio/*" onChange={e => uploadMedia(e, 'va_url')} /></label></div><div className="bg-[#131325] p-3 rounded-xl border border-white/5 flex items-center gap-3"><Music className="w-4 h-4 text-orange-400" /><div className="flex-1 overflow-hidden"><label className="text-[9px] text-white/30 uppercase block">SFX URL</label><input className="w-full bg-transparent border-none text-[10px] p-0 text-white truncate" value={form.sfx_url || ''} onChange={e => field('sfx_url', e.target.value)} /></div><label className="cursor-pointer p-1.5 hover:bg-white/5 rounded-lg"><Upload className="w-3.5 h-3.5 text-white/40" /><input type="file" className="hidden" accept="audio/*" onChange={e => uploadMedia(e, 'sfx_url')} /></label></div></div></section>
                        <section className="space-y-4 border-t border-white/5 pt-6">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Content Editor</label>
                            {form.scene_type === 'dialogue' && <div className="space-y-4"><DarkInput placeholder="Speaker Name" value={form.speaker_name || ''} onChange={e => field('speaker_name', e.target.value)} /><DarkTextArea rows={5} value={form.dialogue_text || ''} onChange={e => field('dialogue_text', e.target.value)} placeholder="Narrative or character dialogue..." /></div>}
                            {form.scene_type === 'choice' && (
                                <div className="space-y-4">
                                    <DarkTextArea rows={3} value={form.question || ''} onChange={e => field('question', e.target.value)} placeholder="Decision point question..." />
                                    <div className="space-y-3">
                                        {(form.choices || []).map((c, i) => (
                                            <ChoiceRowEditor 
                                                key={c.id} 
                                                choice={c} 
                                                index={i} 
                                                scenes={scenes} 
                                                currentSceneId={form.id} 
                                                onUpdate={upd => { 
                                                    const newChoices = form.choices.map(x => x.id === c.id ? upd : x); 
                                                    // Directly update form state and parent state without re-triggering save configurations
                                                    const updatedForm = { ...form, choices: newChoices };
                                                    setForm(updatedForm);
                                                    onUpdate(updatedForm);
                                                }} 
                                                onDelete={async () => { 
                                                    if (!confirm('Hapus?')) return; 
                                                    await axios.delete(`/api/cms/choices/${c.id}`); 
                                                    const newChoices = form.choices.filter(x => x.id !== c.id); 
                                                    const updatedForm = { ...form, choices: newChoices };
                                                    setForm(updatedForm);
                                                    onUpdate(updatedForm);
                                                }} 
                                            />
                                        ))}
                                        {form.choices?.length < 4 && (
                                            <button 
                                                onClick={async () => { 
                                                    if (saving) return; 
                                                    setSaving(true); 
                                                    try { 
                                                        const res = await axios.post(`/api/cms/scenes/${form.id}/choices`, { choice_text: 'New Choice' }); 
                                                        const newChoices = [...(form.choices || []), res.data]; 
                                                        const updatedForm = { ...form, choices: newChoices };
                                                        setForm(updatedForm);
                                                        onUpdate(updatedForm);
                                                    } finally { 
                                                        setSaving(false) 
                                                    } 
                                                }} 
                                                className="w-full py-3 bg-white/5 border border-dashed border-white/10 rounded-xl text-[11px] font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all"
                                            >
                                                Add Choice
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {form.scene_type === 'ending' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => field('ending_type', 'good')} className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase ${form.ending_type === 'good' ? 'bg-green-600 text-white' : 'bg-[#1f1f33] text-white/40'}`}>Good Ending</button>
                                        <button onClick={() => field('ending_type', 'bad')} className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase ${form.ending_type === 'bad' ? 'bg-red-600 text-white' : 'bg-[#1f1f33] text-white/40'}`}>Bad Ending</button>
                                    </div>
                                    <div className="bg-[#131325] p-4 rounded-xl border border-white/5 space-y-3">
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">🏆 Reward Badge on Ending</p>
                                        <DarkSelect 
                                            value={form.custom_data?.badgeId || ''} 
                                            onChange={e => cf('badgeId', e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="" style={{ background: '#161622' }}>❌ No Badge Awarded</option>
                                            {badges.map(b => (
                                                <option key={b.id} value={b.id} style={{ background: '#161622' }}>
                                                    {b.icon} {b.name}
                                                </option>
                                            ))}
                                        </DarkSelect>
                                    </div>
                                    <DarkInput placeholder="Ending Title" value={form.ending_title || ''} onChange={e => field('ending_title', e.target.value)} />
                                    <DarkTextArea rows={4} value={form.ending_message || ''} onChange={e => field('ending_message', e.target.value)} placeholder="Summary message..." />
                                </div>
                            )}
                            {form.scene_type === 'email' && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><DarkInput placeholder="From" value={form.custom_data?.email?.from || ''} onChange={e => cf('email', { ...form.custom_data?.email, from: e.target.value })} /><DarkInput placeholder="To" value={form.custom_data?.email?.to || ''} onChange={e => cf('email', { ...form.custom_data?.email, to: e.target.value })} /></div><DarkInput placeholder="Subject" value={form.custom_data?.email?.subject || ''} onChange={e => cf('email', { ...form.custom_data?.email, subject: e.target.value })} /><DarkTextArea rows={6} value={form.custom_data?.email?.body || ''} onChange={e => cf('email', { ...form.custom_data?.email, body: e.target.value })} /><DarkInput placeholder="Red Flags (comma separated)" value={(form.custom_data?.email?.redFlags || []).join(', ')} onChange={e => cf('email', { ...form.custom_data?.email, redFlags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>}
                            {form.scene_type === 'video' && (
                                <div className="space-y-4">
                                    <div className="bg-[#131325] p-4 rounded-xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Play className="w-5 h-5 text-red-500" />
                                            <div className="flex-1">
                                                <label className="text-[9px] font-bold text-white/40 uppercase block">Video Source URL</label>
                                                <input className="bg-transparent border-none text-white text-sm focus:ring-0 p-0 w-full" value={form.custom_data?.videoUrl || ''} onChange={e => cf('videoUrl', e.target.value)} placeholder="https://..." />
                                            </div>
                                            <label className="cursor-pointer p-1.5 hover:bg-white/5 rounded-lg">
                                                <Upload className="w-4 h-4 text-white/40" />
                                                <input type="file" className="hidden" accept="video/*" onChange={e => uploadMedia(e, 'videoUrl')} />
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!form.custom_data?.autoplay} onChange={e => cf('autoplay', e.target.checked)} />
                                                <span className="text-[10px] text-white/60">Autoplay</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!form.custom_data?.loop} onChange={e => cf('loop', e.target.checked)} />
                                                <span className="text-[10px] text-white/60">Loop</span>
                                            </label>
                                        </div>
                                    </div>
                                    <DarkTextArea rows={2} value={form.dialogue_text || ''} onChange={e => field('dialogue_text', e.target.value)} placeholder="Optional caption overlay..." />
                                </div>
                            )}
                            {form.scene_type === 'password_setup' && <div className="space-y-4"><div className="bg-[#131325] p-4 rounded-xl border border-white/5 space-y-4"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Policy</p><div className="flex items-center gap-4"><div><label className="text-[9px] text-white/30 block mb-1">Min Length</label><input type="number" className="w-12 bg-white/5 rounded border border-white/10 text-xs p-1 text-white" value={form.custom_data?.min_length || 8} onChange={e => cf('min_length', parseInt(e.target.value))} /></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.custom_data?.require_uppercase} onChange={e => cf('require_uppercase', e.target.checked)} /><span className="text-[10px] text-white/60">Uppercase</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.custom_data?.require_symbol} onChange={e => cf('require_symbol', e.target.checked)} /><span className="text-[10px] text-white/60">Symbol</span></label></div></div><DarkTextArea rows={3} placeholder="Instruction text..." value={form.dialogue_text || ''} onChange={e => field('dialogue_text', e.target.value)} /></div>}
                            {(form.scene_type === 'terminal' || form.scene_type === 'investigate') && <div className="space-y-4">{form.scene_type === 'investigate' && <div className="bg-[#131325] p-3 rounded-xl border border-white/5"><label className="text-[10px] text-white/30 uppercase block mb-2">UI Type</label><DarkSelect value={form.custom_data?.uiType || 'browser'} onChange={e => cf('uiType', e.target.value)}><option value="browser" style={{ background: '#161622' }}>Browser</option><option value="email" style={{ background: '#161622' }}>Email Client</option><option value="desktop" style={{ background: '#161622' }}>Desktop</option>{uiTypes?.map(ut => <option key={ut.id} value={ut.key_name} style={{ background: '#161622' }}>{ut.name}</option>)}</DarkSelect></div>}<DarkTextArea rows={3} value={form.question || form.dialogue_text || ''} onChange={e => field('question', e.target.value)} /><div className="bg-[#131325] p-4 rounded-xl border border-white/5 flex items-center gap-3"><Clock className="w-5 h-5 text-purple-400" /><div className="flex-1"><label className="text-[9px] font-bold text-white/40 uppercase block">Timer (seconds)</label><input type="number" className="bg-transparent border-none text-white text-sm focus:ring-0 p-0 w-full font-bold" value={form.timer || 0} onChange={e => field('timer', parseInt(e.target.value) || 0)} /></div></div></div>}
                        </section>
                        <section className="space-y-4 border-t border-white/5 pt-6 pb-6">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Logic & Next</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#131325] p-3 rounded-2xl border border-white/5">
                                    <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">XP Reward</label>
                                    <input 
                                        type="number" 
                                        className="bg-transparent border-none text-yellow-500 font-black text-sm p-0 w-full" 
                                        value={form.xp_reward ?? 0} 
                                        onChange={e => field('xp_reward', parseInt(e.target.value) || 0)} 
                                    />
                                </div>
                                <div className="bg-[#131325] p-3 rounded-2xl border border-white/5">
                                    <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">Trust Impact</label>
                                    <input 
                                        type="number" 
                                        className="bg-transparent border-none text-red-500 font-black text-sm p-0 w-full" 
                                        value={form.trust_impact ?? 0} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === "" || val === "-") {
                                                setForm(p => ({ ...p, trust_impact: val }));
                                            } else {
                                                field('trust_impact', parseInt(val) || 0);
                                            }
                                        }} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-[#131325] p-4 rounded-2xl border border-white/5">
                                    <label className="text-[9px] font-bold text-white/40 uppercase block mb-2">{['investigate', 'terminal'].includes(form.scene_type) ? 'Success Path' : 'Next Scene (Jump)'}</label>
                                    <DarkSelect value={form.next_scene_id || ''} onChange={e => field('next_scene_id', e.target.value ? parseInt(e.target.value) : null)}><option value="" style={{ background: '#161622' }}>Auto Next (Canvas Flow)</option>{scenes.filter(s => s.id !== node.data.id).map(s => <option key={s.id} value={s.id} style={{ background: '#161622' }}>{s.scene_name}</option>)}</DarkSelect>
                                </div>
                                {['investigate', 'terminal'].includes(form.scene_type) && (
                                    <div className="bg-[#131325] p-4 rounded-2xl border border-red-500/20">
                                        <label className="text-[9px] font-bold text-red-400 uppercase block mb-2">Failure Path</label>
                                        <DarkSelect value={form.custom_data?.failSceneId || ''} onChange={e => cf('failSceneId', e.target.value ? parseInt(e.target.value) : null)}><option value="" style={{ background: '#161622' }}>Default (Loop/End)</option>{scenes.filter(s => s.id !== node.data.id).map(s => <option key={s.id} value={s.id} style={{ background: '#161622' }}>{s.scene_name}</option>)}</DarkSelect>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
                {node.type === 'zoneNode' && (
                    <div className="space-y-6">
                        <section className="space-y-4"><label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Zone Properties</label><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Title</label><DarkInput value={form.title || ''} onChange={e => field('title', e.target.value)} /></div><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Color (Hex)</label><div className="flex gap-2"><div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: form.color }} /><DarkInput value={form.color || ''} onChange={e => field('color', e.target.value)} /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Width</label><DarkInput type="number" value={form.width || 400} onChange={e => field('width', parseInt(e.target.value))} /></div><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Height</label><DarkInput type="number" value={form.height || 300} onChange={e => field('height', parseInt(e.target.value))} /></div></div></section>
                    </div>
                )}
                {node.type === 'noteNode' && (
                    <div className="space-y-6">
                        <section className="space-y-4"><label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] block">Note Properties</label><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Content</label><DarkTextArea rows={15} value={form.content || ''} onChange={e => field('content', e.target.value)} /></div><div className="space-y-1"><label className="text-[11px] text-white/40 ml-1">Color (Hex)</label><div className="flex gap-2"><div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: form.color }} /><DarkInput value={form.color || ''} onChange={e => field('color', e.target.value)} /></div></div></section>
                    </div>
                )}
            </div>
            <div className="p-6 border-t border-white/10 bg-black/40"><button onClick={save} disabled={saving || uploading} className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 uppercase tracking-widest text-xs">{saving || uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Save Configuration</button></div>
        </motion.div>
    )
}

// ─── Flow Editor Inner ───────────────────────────────────────────────────

function FlowEditorInner() {
    const { chapterId } = useParams(), navigate = useNavigate(), { getViewport, screenToFlowPosition } = useReactFlow(), [uiTypes, setUiTypes] = useState([]), [backgrounds, setBackgrounds] = useState([]), [characters, setCharacters] = useState([]), [badges, setBadges] = useState([])
    const [chapter, setChapter] = useState(null), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [creating, setCreating] = useState(false), [nodes, setNodes, onNodesChange] = useNodesState([]), [edges, setEdges, onEdgesChange] = useEdgesState([]), [selectedNode, setSelectedNode] = useState(null)
    
    // Undo/Redo & Clipboard
    const [history, setHistory] = useState([]), [redoStack, setRedoStack] = useState([]), [clipboard, setClipboard] = useState(null)

    // 1. Memoized Utilities
    const getCenterPos = useCallback(() => { const { x, y, zoom } = getViewport(); return { x: -x / zoom + 400, y: -y / zoom + 300 } }, [getViewport])
    
    const pushToHistory = useCallback(() => { setHistory(h => [...h.slice(-19), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]); setRedoStack([]) }, [nodes, edges])
    
    const undo = useCallback(() => { if (!history.length) return; const prev = history[history.length - 1]; setRedoStack(r => [...r, { nodes, edges }]); setNodes(prev.nodes); setEdges(prev.edges); setHistory(h => h.slice(0, -1)) }, [history, nodes, edges, setNodes, setEdges])
    
    const redo = useCallback(() => { if (!redoStack.length) return; const next = redoStack[redoStack.length - 1]; setHistory(h => [...h, { nodes, edges }]); setNodes(next.nodes); setEdges(next.edges); setRedoStack(r => r.slice(0, -1)) }, [redoStack, nodes, edges, setNodes, setEdges])

    const copySelected = useCallback(() => { const selected = nodes.find(n => n.selected); if (selected && selected.type === 'sceneNode') { setClipboard(selected); toast.success('Scene copied') } }, [nodes])

    // 2. Action Handlers (MUST BE DEFINED BEFORE useEffect)
    const addScene = useCallback(async (type) => { 
        if (creating) return;
        setCreating(true);
        try { 
            pushToHistory(); 
            const pos = getCenterPos(), res = await axios.post(`/api/cms/chapters/${chapterId}/scenes`, { scene_name: 'New ' + type, scene_type: type }); 
            setNodes(nds => [...nds, { id: `scene-${res.data.id}`, type: 'sceneNode', position: pos, data: { ...res.data, id_num: res.data.id } }]); 
            await axios.put(`/api/cms/scenes/${res.data.id}/position`, { x: pos.x, y: pos.y }) 
        } catch (err) { 
            toast.error('Gagal') 
        } finally {
            setCreating(false);
        }
    }, [chapterId, creating, pushToHistory, setNodes, getCenterPos])

    const addZone = useCallback(async () => { 
        if (creating) return;
        setCreating(true);
        try { 
            pushToHistory(); 
            const pos = getCenterPos(), res = await axios.post(`/api/cms/chapters/${chapterId}/flow/zones`, { title: 'New Zone', color: '#3b82f6', x_pos: pos.x, y_pos: pos.y }); 
            setNodes(nds => [...nds, { id: `zone-${res.data.id}`, type: 'zoneNode', position: pos, data: res.data, zIndex: -1, width: 400, height: 300 }]) 
        } catch (err) { 
            toast.error('Gagal tambah zone') 
        } finally {
            setCreating(false);
        }
    }, [chapterId, creating, pushToHistory, setNodes, getCenterPos])

    const addNote = useCallback(async () => { 
        if (creating) return;
        setCreating(true);
        try { 
            pushToHistory(); 
            const pos = getCenterPos(), res = await axios.post(`/api/cms/chapters/${chapterId}/flow/notes`, { content: 'Note content...', color: '#fbbf24', x_pos: pos.x, y_pos: pos.y }); 
            setNodes(nds => [...nds, { id: `note-${res.data.id}`, type: 'noteNode', position: pos, data: res.data }]) 
        } catch (err) { 
            toast.error('Gagal tambah note') 
        } finally {
            setCreating(false);
        }
    }, [chapterId, creating, pushToHistory, setNodes, getCenterPos])

    const onDelete = useCallback(async () => { 
        const selected = nodes.filter(n => n.selected); 
        if (!selected.length || !confirm(`Hapus ${selected.length} item?`)) return; 
        pushToHistory(); 
        try { 
            for (const n of selected) { 
                if (n.id.startsWith('scene')) await axios.delete(`/api/cms/scenes/${n.data.id}`); 
                else if (n.id.startsWith('zone')) await axios.delete(`/api/cms/flow/zones/${n.data.id}`); 
                else if (n.id.startsWith('note')) await axios.delete(`/api/cms/flow/notes/${n.data.id}`) 
            }; 
            setNodes(nds => nds.filter(n => !n.selected)); 
            setSelectedNode(null); 
            toast.success('Terhapus') 
        } catch (err) { 
            toast.error('Gagal') 
        } 
    }, [nodes, pushToHistory, setNodes])

    const pasteScene = useCallback(async () => { 
        if (!clipboard || creating) return; 
        setCreating(true);
        try { 
            const pos = getCenterPos(), res = await axios.post(`/api/cms/scenes/${clipboard.data.id}/duplicate`); 
            setNodes(nds => [...nds, { id: `scene-${res.data.id}`, type: 'sceneNode', position: pos, data: { ...res.data, id_num: res.data.id } }]); 
            await axios.put(`/api/cms/scenes/${res.data.id}/position`, { x: pos.x, y: pos.y }); 
            toast.success('Scene pasted') 
        } catch (err) { 
            toast.error('Paste failed') 
        } finally {
            setCreating(false);
        }
    }, [clipboard, creating, getCenterPos, setNodes])

    const saveLayout = useCallback(async () => { 
        if (saving) return;
        setSaving(true); 
        try { 
            await Promise.all([
                ...nodes.filter(n => n.type === 'sceneNode').map(n => axios.put(`/api/cms/scenes/${n.data.id}/position`, { x: Math.round(n.position.x), y: Math.round(n.position.y) })), 
                ...nodes.filter(n => n.type === 'zoneNode').map(n => axios.put(`/api/cms/flow/zones/${n.data.id}`, { x_pos: Math.round(n.position.x), y_pos: Math.round(n.position.y), width: n.width, height: n.height })), 
                ...nodes.filter(n => n.type === 'noteNode').map(n => axios.put(`/api/cms/flow/notes/${n.data.id}`, { x_pos: Math.round(n.position.x), y_pos: Math.round(n.position.y) }))
            ]); 
            toast.success('All positions saved') 
        } catch (err) { 
            toast.error('Failed to save positions') 
        } finally { 
            setSaving(false) 
        } 
    }, [nodes, saving])

    const onConnect = useCallback(async (params) => { 
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target); 
        
        if (sourceNode?.type === 'sceneNode' && targetNode?.type === 'sceneNode') { 
            try { 
                pushToHistory(); 
                
                if (params.sourceHandle?.startsWith('choice-')) { 
                    const choiceId = params.sourceHandle.split('-')[1]; 
                    await axios.put(`/api/cms/choices/${choiceId}`, { next_scene_id: targetNode.data.id }); 
                    toast.success('Choice connection saved');
                } else if (params.sourceHandle === 'fail') {
                    const updatedCustom = { ...(sourceNode.data.custom_data || {}), failSceneId: targetNode.data.id };
                    await axios.put(`/api/cms/scenes/${sourceNode.data.id}`, { ...sourceNode.data, custom_data: updatedCustom });
                    toast.success('Failure path saved');
                } else { 
                    // handles 'success' or default
                    await axios.put(`/api/cms/scenes/${sourceNode.data.id}`, { ...sourceNode.data, next_scene_id: targetNode.data.id }); 
                    toast.success('Success/Next path saved');
                } 

                setEdges(eds => addEdge({ 
                    ...params, 
                    animated: true, 
                    markerEnd: { type: MarkerType.ArrowClosed, color: params.sourceHandle === 'fail' ? '#ef4444' : (params.sourceHandle?.startsWith('choice-') ? '#fbbf24' : '#8b5cf6') }, 
                    style: { 
                        stroke: params.sourceHandle === 'fail' ? '#ef4444' : (params.sourceHandle?.startsWith('choice-') ? '#fbbf24' : '#8b5cf6'), 
                        strokeWidth: 2,
                        strokeDasharray: params.sourceHandle === 'fail' ? '5,5' : 'none'
                    } 
                }, eds)); 
            } catch (err) { 
                toast.error('Gagal simpan koneksi');
            } 
        } 
    }, [nodes, setEdges, pushToHistory])

    // 3. Effects
    useEffect(() => { 
        Promise.all([
            axios.get('/api/cms/ui-types').catch(() => ({ data: [] })),
            axios.get('/api/cms/backgrounds').catch(() => ({ data: [] })),
            axios.get('/api/cms/characters').catch(() => ({ data: [] })),
            axios.get('/api/cms/badges').catch(() => ({ data: [] }))
        ]).then(([ui, bg, char, bdg]) => {
            setUiTypes(ui.data);
            setBackgrounds(bg.data);
            setCharacters(char.data);
            setBadges(bdg.data);
        });
    }, [])

    const loadFlowData = useCallback(async () => {
        setLoading(true); try {
            const [chRes, flowRes] = await Promise.all([axios.get(`/api/cms/chapters/${chapterId}`), axios.get(`/api/cms/chapters/${chapterId}/flow`)]); setChapter(chRes.data); const { scenes, zones, notes } = flowRes.data
            const nds = [...zones.map(z => ({ id: `zone-${z.id}`, type: 'zoneNode', position: { x: z.x_pos || 0, y: z.y_pos || 0 }, data: { ...z }, zIndex: -1, width: z.width || 400, height: z.height || 300 })), ...notes.map(n => ({ id: `note-${n.id}`, type: 'noteNode', position: { x: n.x_pos || 0, y: n.y_pos || 0 }, data: { ...n } })), ...scenes.map(s => ({ id: `scene-${s.id}`, type: 'sceneNode', position: { x: s.x_pos || 0, y: s.y_pos || 0 }, data: { ...s, id_num: s.id } }))];
            setNodes(nds);
            const eds = []; 
            scenes.forEach(s => { 
                // Default next path
                if (s.next_scene_id && s.scene_type !== 'choice') {
                    const isChallenge = ['investigate', 'terminal'].includes(s.scene_type);
                    eds.push({ 
                        id: `e-scene-${s.id}-next`, 
                        source: `scene-${s.id}`, 
                        sourceHandle: isChallenge ? 'success' : null,
                        target: `scene-${s.next_scene_id}`, 
                        markerEnd: { type: MarkerType.ArrowClosed, color: isChallenge ? '#22c55e' : '#8b5cf6' }, 
                        style: { stroke: isChallenge ? '#22c55e' : '#8b5cf6', strokeWidth: 2 }, 
                        animated: true 
                    });
                }
                // Failure path
                if (s.custom_data?.failSceneId) {
                    eds.push({
                        id: `e-scene-${s.id}-fail`,
                        source: `scene-${s.id}`,
                        sourceHandle: 'fail',
                        target: `scene-${s.custom_data.failSceneId}`,
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
                        style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
                        animated: true
                    });
                }
                // Choice paths
                if (s.choices) s.choices.forEach(c => { 
                    if (c.next_scene_id) eds.push({ 
                        id: `e-choice-${c.id}`, 
                        source: `scene-${s.id}`, 
                        sourceHandle: `choice-${c.id}`, 
                        target: `scene-${c.next_scene_id}`, 
                        label: c.choice_text.substring(0, 10), 
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' }, 
                        style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5,5' } 
                    }) 
                }) 
            }); 
            setEdges(eds);
        } catch (err) { toast.error('Gagal') } finally { setLoading(false) }
    }, [chapterId, setNodes, setEdges])

    useEffect(() => { loadFlowData() }, [loadFlowData])

    useEffect(() => {
        const handleKeys = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo() }
                if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) { e.preventDefault(); redo() }
                if (e.key === 'c') { e.preventDefault(); copySelected() }
                if (e.key === 'v') { e.preventDefault(); pasteScene() }
            } else {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const anySelected = nodes.some(n => n.selected);
                    if (anySelected) {
                        e.preventDefault();
                        onDelete();
                    }
                }
            }
        }
        window.addEventListener('keydown', handleKeys); 
        return () => window.removeEventListener('keydown', handleKeys)
    }, [undo, redo, copySelected, pasteScene, onDelete, nodes])

    // 4. Render
    return (
        <div className="fixed inset-0 bg-[#0d0d14] text-white flex flex-col font-sans overflow-hidden">
            <header className="h-20 border-b border-white/10 bg-[#161622] flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-6"><button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><ArrowLeft className="text-white" /></button><div><h1 className="text-xl font-bold text-white">{chapter?.title}</h1><span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{saving ? 'Syncing Layout...' : 'Layout ready'}</span></div></div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        <button onClick={undo} disabled={!history.length} className="p-2 hover:bg-white/5 rounded-lg transition-all disabled:opacity-20" title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
                        <button onClick={redo} disabled={!redoStack.length} className="p-2 hover:bg-white/5 rounded-lg transition-all disabled:opacity-20" title="Redo (Ctrl+Y)"><Redo className="w-4 h-4" /></button>
                    </div>
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        <button onClick={copySelected} className="p-2 hover:bg-white/5 rounded-lg transition-all" title="Copy Scene (Ctrl+C)"><Copy className="w-4 h-4" /></button>
                        <button onClick={pasteScene} disabled={!clipboard} className="p-2 hover:bg-white/5 rounded-lg transition-all disabled:opacity-20" title="Paste Scene (Ctrl+V)"><ClipboardPaste className="w-4 h-4" /></button>
                    </div>
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">{Object.entries(SCENE_TYPE_CONFIG).map(([type, cfg]) => (<button key={type} onClick={() => addScene(type)} className="p-2 hover:bg-white/5 rounded-lg transition-all" title={`Add ${cfg.label}`} style={{ color: cfg.color }}><cfg.icon className="w-5 h-5" /></button>))}</div>
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10"><button onClick={addZone} className="p-2 hover:bg-white/5 rounded-lg text-purple-400 transition-all" title="Add Zone"><Layers className="w-5 h-5" /></button><button onClick={addNote} className="p-2 hover:bg-white/5 rounded-lg text-yellow-400 transition-all" title="Add Note"><StickyNote className="w-5 h-5" /></button></div>
                    <div className="h-8 w-[1px] bg-white/10 mx-1" /><button onClick={onDelete} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 /></button>
                    <button onClick={saveLayout} disabled={saving} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl font-bold text-white transition-all uppercase tracking-widest text-xs border border-white/10">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layout className="w-4 h-4" />} Save Layout</button>
                    <button onClick={() => window.open(`/play/${chapterId}`)} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-xl font-black text-white shadow-lg shadow-purple-500/20 transition-all uppercase tracking-widest text-xs">Preview</button>
                </div>
            </header>
            <main className="flex-1 relative">
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={() => { pushToHistory(); }} onNodeDoubleClick={(e, node) => setSelectedNode(node)} nodeTypes={nodeTypes} colorMode="dark" fitView multiSelectionKeyCode="Shift" selectionMode="drag" selectNodesOnDrag={true} panOnScroll={true}>
                    <Background color="#ffffff05" gap={40} /><Controls /><MiniMap /><Panel position="bottom-center" className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-[11px] font-bold text-white/40 uppercase tracking-widest">Ctrl+C Copy · Ctrl+V Paste · Ctrl+Z Undo · Ctrl+Y Redo</Panel>
                </ReactFlow>
                <AnimatePresence>
                    {selectedNode && (
                        <UniversalSidebar 
                            node={selectedNode} 
                            scenes={nodes.filter(n => n.type === 'sceneNode').map(n => n.data)} 
                            characters={characters || []} 
                            backgrounds={backgrounds || []} 
                            uiTypes={uiTypes} 
                            badges={badges}
                            onClose={() => setSelectedNode(null)} 
                            onUpdate={(updatedData) => {
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...updatedData } } : n));
                                setSelectedNode(prev => prev ? ({ ...prev, data: { ...prev.data, ...updatedData } }) : null);
                            }} 
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

export default function StoryFlowEditor() { return <ReactFlowProvider><FlowEditorInner /></ReactFlowProvider> }
