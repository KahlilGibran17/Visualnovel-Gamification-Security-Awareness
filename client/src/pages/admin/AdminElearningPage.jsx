import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout.jsx'
import {
    Plus, Trash2, Upload, Film, HelpCircle, ChevronDown,
    ChevronUp, Save, Edit2, X, Check, Clock, Star,
    BookOpen, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft,
    FolderPlus, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (!bytes) return '-'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function secondsToMMSS(s) {
    if (!s && s !== 0) return ''
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function mmssToSeconds(str) {
    if (!str) return 0
    const parts = str.split(':')
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0)
    return parseInt(str) || 0
}

// ── Empty templates ────────────────────────────────────────────────────────

const emptyOption   = () => ({ _id: Math.random(), option_text: '', is_correct: false })
const emptyQuestion = () => ({
    _id: Math.random(),
    question_text:    '',
    timestamp_input:  '',
    timestamp_seconds: 0,
    xp_reward:        25,
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
})
const emptyLesson = () => ({
    chapter_id:       '',
    title:            '',
    description:      '',
    duration: '',
    xp_reward:        100,
    is_active:        true,
    video_url:        '',
    questions:        [],
})

// ── Option Row ─────────────────────────────────────────────────────────────

function OptionRow({ opt, index, onChange, onRemove, canRemove }) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onChange({ ...opt, is_correct: true })}
                title="Jawaban benar"
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    opt.is_correct
                        ? 'border-green-400 bg-green-400'
                        : 'border-white/20 hover:border-green-400/60'
                }`}
            >
                {opt.is_correct && <Check className="w-3 h-3 text-white" />}
            </button>

            <input
                type="text"
                value={opt.option_text}
                onChange={e => onChange({ ...opt, option_text: e.target.value })}
                placeholder={`Pilihan ${index + 1}`}
                className="flex-1 input-field text-sm py-2"
            />

            {canRemove && (
                <button type="button" onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

// ── Question Card ──────────────────────────────────────────────────────────

function QuestionCard({ question, index, onChange, onRemove }) {
    const [open, setOpen] = useState(true)

    const updateOption = (_id, newOpt) => {
        const updated = question.options.map(o => {
            if (o._id === _id) return newOpt
            if (newOpt.is_correct) return { ...o, is_correct: false }
            return o
        })
        onChange({ ...question, options: updated.map(o => o._id === _id ? newOpt : o) })
    }

    const handleTimestamp = val => {
        onChange({ ...question, timestamp_input: val, timestamp_seconds: mmssToSeconds(val) })
    }

    const hasCorrect = question.options.some(o => o.is_correct)

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {question.question_text || <span className="text-white/30 italic">Pertanyaan belum diisi</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{question.timestamp_input || '00:00'}
                        </span>
                        <span className="text-xs text-accent flex items-center gap-1">
                            <Star className="w-3 h-3" />{question.xp_reward} XP
                        </span>
                        {!hasCorrect && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />Belum ada jawaban benar
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={e => { e.stopPropagation(); onRemove() }} className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 space-y-4 border-t border-white/5 pt-4">
                            <div>
                                <label className="label-text">Teks Pertanyaan</label>
                                <textarea rows={2} value={question.question_text}
                                    onChange={e => onChange({ ...question, question_text: e.target.value })}
                                    placeholder="Tulis pertanyaan di sini..."
                                    className="input-field text-sm w-full resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label-text flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Muncul di (MM:SS)
                                    </label>
                                    <input
                                        type="text"
                                        value={question.timestamp_input}
                                        onChange={e => {
                                            // Hanya angka
                                            const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                                            // Format jadi MM:SS
                                            const formatted = raw.length <= 2
                                                ? raw
                                                : raw.slice(0, 2) + ':' + raw.slice(2)
                                            handleTimestamp(formatted)
                                        }}
                                        placeholder="00:00"
                                        maxLength={5}
                                        className="input-field text-sm w-full font-mono"
                                    />
                                    <p className="text-xs text-white/30 mt-1">= {question.timestamp_seconds} detik</p>
                                </div>
                                <div>
                                    <label className="label-text flex items-center gap-1">
                                        <Star className="w-3 h-3 text-accent" /> XP Reward
                                    </label>
                                    <input type="number" min={0} value={question.xp_reward}
                                        onChange={e => onChange({ ...question, xp_reward: parseInt(e.target.value) || 0 })}
                                        className="input-field text-sm w-full" />
                                </div>
                            </div>

                            <div>
                                <label className="label-text flex items-center gap-1.5 mb-2">
                                    Pilihan Jawaban <span className="text-white/30 font-normal text-xs">(● = benar)</span>
                                </label>
                                <div className="space-y-2">
                                    {question.options.map((opt, oi) => (
                                        <OptionRow key={opt._id} opt={opt} index={oi}
                                            onChange={newOpt => updateOption(opt._id, newOpt)}
                                            onRemove={() => onChange({ ...question, options: question.options.filter(o => o._id !== opt._id) })}
                                            canRemove={question.options.length > 2} />
                                    ))}
                                </div>
                                {question.options.length < 6 && (
                                    <button type="button"
                                        onClick={() => onChange({ ...question, options: [...question.options, emptyOption()] })}
                                        className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                                        <Plus className="w-3 h-3" /> Tambah pilihan
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ── Video Upload ───────────────────────────────────────────────────────────

function VideoUploadSection({ lessonId, currentVideoPath, pendingFile, onSelectFile, onUploaded, onDurationDetected }) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress]   = useState(0)
    const [dragOver, setDragOver]   = useState(false)
    const inputRef = useRef(null)

    const displayName = pendingFile?.name || currentVideoPath
    const displaySize = pendingFile?.size

    const handleFile = async (file) => {
        if (!file) return
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        if (!allowed.includes(file.type)) { toast.error('Format tidak didukung. Gunakan MP4, WebM, atau MOV.'); return }

       const duration = await new Promise((resolve) => {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src)
                const totalSeconds = Math.round(video.duration)
                const m = Math.floor(totalSeconds / 60)
                const s = totalSeconds % 60
                resolve(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
            }
            video.onerror = () => resolve('00:00')
            video.src = URL.createObjectURL(file)
        })
        onDurationDetected?.(duration)

        if (!lessonId) {
            onSelectFile?.(file)
            return
        }

        setUploading(true); setProgress(0)
        const form = new FormData()
        form.append('video', file)

        try {
            const res = await axios.post(`/api/elearning/admin/lessons/${lessonId}/upload-video`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: e => setProgress(Math.round((e.loaded / e.total) * 100)),
            })
            toast.success('Video berhasil diupload!')
            onUploaded?.(res.data)
        } catch {
            toast.error('Gagal mengupload video')
        } finally {
            setUploading(false); setProgress(0)
        }
    }

    return (
        <div>
            <label className="label-text flex items-center gap-1.5 mb-2">
                <Film className="w-3.5 h-3.5" /> File Video
            </label>

            {displayName && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mb-3 text-xs">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-300 font-medium truncate">{String(displayName).split(/[\\/]/).pop()}</span>
                    {displaySize != null && (
                        <span className="text-white/30 ml-auto flex-shrink-0">{formatBytes(displaySize)}</span>
                    )}
                </div>
            )}

            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-white/30 hover:bg-white/5'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                {uploading ? (
                    <div>
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-white/60 mb-2">Mengupload... {progress}%</p>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-sm text-white/50">
                            {displayName ? 'Ganti video — ' : ''}Drag & drop atau klik untuk pilih
                        </p>
                        <p className="text-xs text-white/25 mt-1">MP4, WebM, MOV — maks. 2 GB</p>
                    </>
                )}
            </div>

            {!lessonId && pendingFile && (
                <p className="text-xs text-white/40 mt-2">Video akan diupload setelah lesson disimpan.</p>
            )}

            <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
    )
}

// ── Add Chapter Modal ──────────────────────────────────────────────────────

function AddChapterModal({ onClose, onSaved }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [badgeName, setBadgeName] = useState('')
    const [badgeKey, setBadgeKey] = useState('')
    const [badgeIcon, setBadgeIcon] = useState('🏆')
    const [badgeDescription, setBadgeDescription] = useState('')
    const [badgeColor, setBadgeColor] = useState('#FFD60A')
    const [saving, setSaving] = useState(false)
    const [categoryId, setCategoryId] = useState('')

    const handleSave = async () => {
        if (!title.trim()) { toast.error('Judul chapter wajib diisi'); return }
        if (!badgeName.trim()) { toast.error('Nama badge wajib diisi'); return }
        if (!badgeKey.trim()) { toast.error('Badge key wajib diisi'); return }
        setSaving(true)
        try {
            const res = await axios.post('/api/elearning/admin/chapters', {
                title: title.trim(),
                description: description.trim(),
                badge_name: badgeName.trim(),
                badge_key: badgeKey.trim().toLowerCase().replace(/\s+/g, '-'),
                badge_icon: badgeIcon,
                badge_description: badgeDescription.trim(),
                badge_color: badgeColor,
                category_id: categoryId || null,
            })
            toast.success('Chapter & badge berhasil dibuat!')
            onSaved({
                        id: res.data?.chapter?.id || res.data?.chapter?.ch_id,
                        title: res.data?.chapter?.ch_title || title.trim(),
                        badge_key: badgeKey.trim().toLowerCase().replace(/\s+/g, '-'),
                    })
        } catch {
            toast.error('Gagal membuat chapter')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md glass-card p-6 overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                            <FolderPlus className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Tambah Chapter Baru</h2>
                            <p className="text-xs text-white/40">Isi detail chapter dan badge</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="nav-item p-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* CHAPTER */}
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Detail Chapter</p>
                    <div>
                        <label className="label-text">Judul Chapter</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="cth: Keamanan Siber Dasar"
                            className="input-field text-sm w-full" autoFocus />
                    </div>
                    <div>
                        <label className="label-text">Deskripsi Chapter <span className="text-white/30">(opsional)</span></label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="cth: Membahas konsep dasar keamanan siber..."
                            rows={2} className="input-field text-sm w-full resize-none" />
                    </div>

                    {/* BADGE */}
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mt-2">Detail Badge</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-text">Nama Badge</label>
                            <input type="text" value={badgeName} onChange={e => setBadgeName(e.target.value)}
                                placeholder="cth: Cyber Hero"
                                className="input-field text-sm w-full" />
                        </div>
                        <div>
                            <label className="label-text">Badge Key</label>
                            <input type="text" value={badgeKey} onChange={e => setBadgeKey(e.target.value)}
                                placeholder="cth: cyber-hero"
                                className="input-field text-sm w-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-text">Icon Badge</label>
                            <input type="text" value={badgeIcon} onChange={e => setBadgeIcon(e.target.value)}
                                placeholder="cth: 🏆"
                                className="input-field text-sm w-full" />
                        </div>
                        <div>
                            <label className="label-text">Warna Badge</label>
                            <input type="color" value={badgeColor} onChange={e => setBadgeColor(e.target.value)}
                                className="input-field text-sm w-full h-10 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="label-text">Deskripsi Badge <span className="text-white/30">(opsional)</span></label>
                        <input type="text" value={badgeDescription} onChange={e => setBadgeDescription(e.target.value)}
                            placeholder="cth: Menyelesaikan semua lesson chapter 1"
                            className="input-field text-sm w-full" />
                    </div>
                   <div>
                        <label className="label-text">Kategori Badge</label>
                        <select
                            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent appearance-none cursor-pointer"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="" disabled className="bg-gray-900 text-white/40">-- Pilih Kategori --</option>
                            <option value="1" className="bg-gray-900 text-white">Badge Game</option>
                            <option value="2" className="bg-gray-900 text-white">Badge E-Learning</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 nav-item py-2.5 text-sm font-semibold">
                            Batal
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving || !title.trim() || !badgeName.trim()}
                            className="flex-1 btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                                : <><Save className="w-4 h-4" />Simpan</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── Lesson Form Modal ──────────────────────────────────────────────────────

function LessonFormModal({ lesson, chapters, defaultChapterId, onClose, onSaved }) {
    const isEdit = !!lesson?.id
    const [form, setForm] = useState(() => {
        if (!lesson) return { ...emptyLesson(), chapter_id: defaultChapterId || '' }
        return {
            ...lesson,
            questions: (lesson.questions || []).map(q => ({
                ...q,
                _id: Math.random(),
                timestamp_input: secondsToMMSS(q.timestamp_seconds),
                options: (q.options || []).map(o => ({ ...o, _id: Math.random() })),
            })),
        }
    })
    const [saving, setSaving]               = useState(false)
    const [savedLessonId, setSavedLessonId] = useState(lesson?.id || null)
    const [pendingVideo, setPendingVideo]   = useState(null)

    const uploadVideo = async (lessonId, file) => {
        const formData = new FormData()
        formData.append('video', file)
        try {
            const res = await axios.post(`/api/elearning/admin/lessons/${lessonId}/upload-video`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const videoPath = res.data?.video_path || res.data?.filename || res.data?.videoUrl
            if (videoPath) setForm(f => ({ ...f, video_path: videoPath }))
            toast.success('Video berhasil diupload!')
            return true
        } catch {
            toast.error('Gagal mengupload video')
            throw new Error('upload_failed')
        }
    }

    const validate = () => {
        if (!form.chapter_id)    { toast.error('Pilih chapter terlebih dahulu'); return false }
        if (!form.title.trim())  { toast.error('Judul lesson wajib diisi'); return false }
        for (const q of form.questions) {
            if (!q.question_text.trim()) { toast.error('Semua teks pertanyaan harus diisi'); return false }
            if (!q.options.some(o => o.is_correct)) { toast.error(`Pertanyaan "${q.question_text.slice(0,30)}..." belum punya jawaban benar`); return false }
            if (q.options.filter(o => o.option_text.trim()).length < 2) { toast.error('Setiap pertanyaan minimal 2 pilihan'); return false }
        }
        return true
    }

    const buildPayload = () => ({
        chapterId: form.chapter_id,
        chapter_id: form.chapter_id,
        title: form.title,
        description: form.description,
        duration: form.duration || 0,
        xpReward: form.xp_reward,
        isActive: form.is_active,
        questions: form.questions.map((q, qi) => ({
            id: q.id || undefined,
            questionText: q.question_text,      // ← fix: dari q.question_text
            timestampSeconds: q.timestamp_seconds,
            xpReward: q.xp_reward,
            orderIndex: qi + 1,
            options: q.options
                .filter(o => o.option_text.trim())
                .map((o, oi) => ({
                    id: o.id || undefined,      // ← fix: tambahkan id
                    optionText: o.option_text,
                    isCorrect: o.is_correct,
                    orderIndex: oi + 1,
                })),
        })),
    })
    const handleSave = async () => {
        if (!validate()) return
        setSaving(true)
        try {
            let lessonId = lesson?.id
            if (isEdit) {
                await axios.put(`/api/elearning/admin/lessons/${lesson.id}`, buildPayload())
                toast.success('Lesson berhasil diperbarui!')
            } else {
                const res = await axios.post('/api/elearning/admin/lessons', buildPayload())
                toast.success('Lesson berhasil dibuat!')
                lessonId = res.data.lesson.id
            }

            setSavedLessonId(lessonId)

            if (pendingVideo) {
                try {
                    await uploadVideo(lessonId, pendingVideo)
                    setPendingVideo(null)
                } catch { /* keep pending video */ }
            }

            onSaved()
        } catch {
            toast.error('Gagal menyimpan lesson')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="min-h-screen py-8 px-4 flex items-start justify-center">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-2xl">

                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-white">{isEdit ? 'Edit Lesson' : 'Tambah Lesson Baru'}</h2>
                            <p className="text-xs text-white/40 mt-0.5">{isEdit ? `ID: ${lesson.id}` : 'Isi data, lalu upload video'}</p>
                        </div>
                        <button onClick={onClose} className="nav-item p-2"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-card p-5 space-y-4">
                            <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" /> Informasi Lesson
                            </h3>

                            <div>
                                <label className="label-text mb-1 block">Chapter</label>
                                <div className="input-field text-sm w-full text-white/60 cursor-default select-none pointer-events-none bg-white/5">
                                    {chapters.find(c => String(c.id) === String(form.chapter_id))?.title || 'Belum ada chapter dipilih'}
                                </div>
                            </div>
                            <div>
                                <label className="label-text">Judul Lesson</label>
                                <input type="text" value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="cth: Mengenal dan Menghindari Phishing"
                                    className="input-field text-sm w-full" />
                            </div>

                            <div>
                                <label className="label-text">Deskripsi</label>
                                <textarea rows={3} value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Jelaskan isi materi video ini..."
                                    className="input-field text-sm w-full resize-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label-text flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Durasi Video
                                    </label>
                                    <input
                                        type="text"
                                        value={form.duration || ''}
                                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                        placeholder="00:00"
                                        className="input-field text-sm w-full font-mono"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="label-text flex items-center gap-1">
                                        <Star className="w-3 h-3 text-accent" /> XP Selesai Video
                                    </label>
                                    <input type="number" min={0} value={form.xp_reward}
                                        onChange={e => setForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 0 }))}
                                        className="input-field text-sm w-full" />
                                </div>
                            </div>
                        </div>
                            <div className="glass-card p-5">
                                <h3 className="text-sm font-bold text-white/80 flex items-center gap-2 mb-4">
                                    <Film className="w-4 h-4 text-primary" /> Upload Video
                                </h3>
                                <VideoUploadSection
                                    lessonId={savedLessonId}
                                    currentVideoPath={form.video_url}
                                    pendingFile={pendingVideo}
                                    onSelectFile={file => setPendingVideo(file)}
                                    onDurationDetected={duration => setForm(f => ({ ...f, duration: duration }))} // ← tambahkan ini
                                    onUploaded={data => {
                                        const videoUrl = data?.video_url || data?.filename || data?.videoUrl
                                        if (videoUrl) setForm(f => ({ ...f, video_url: videoUrl }))
                                    }}
                                />
                            </div>
                        <div className="glass-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-primary" />
                                    Pertanyaan Kuis
                                    {form.questions.length > 0 && (
                                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                                            {form.questions.length}
                                        </span>
                                    )}
                                </h3>
                                <button type="button"
                                    onClick={() => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }))}
                                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Tambah Pertanyaan
                                </button>
                            </div>

                            {form.questions.length === 0 ? (
                                <div className="text-center py-8 text-white/25">
                                    <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Belum ada pertanyaan</p>
                                    <p className="text-xs mt-1">Klik "Tambah Pertanyaan" untuk mulai</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-3">
                                        {form.questions.map((q, i) => (
                                            <QuestionCard key={q._id} question={q} index={i}
                                                onChange={updated => setForm(f => ({ ...f, questions: f.questions.map(x => x._id === q._id ? updated : x) }))}
                                                onRemove={() => setForm(f => ({ ...f, questions: f.questions.filter(x => x._id !== q._id) }))} />
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>

                        <div className="flex gap-3 pb-4">
                            <button type="button" onClick={onClose} className="flex-1 nav-item py-3 text-sm font-semibold">
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !form.chapter_id}
                                className="flex-1 btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                                    : <><Save className="w-4 h-4" />{isEdit ? 'Perbarui Lesson' : 'Simpan Lesson'}</>}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

// ── Main Admin Page ────────────────────────────────────────────────────────

export default function AdminElearningPage() {
    const navigate = useNavigate()
    const [lessons,          setLessons]          = useState([])
    const [chapters,         setChapters]         = useState([])
    const [loading,          setLoading]          = useState(true)
    const [modalLesson,      setModalLesson]      = useState(null)  
    const [showAddChapter,   setShowAddChapter]   = useState(false)
    const [deleting,         setDeleting]         = useState(null)
    const [collapsedChapters, setCollapsedChapters] = useState({})

    useEffect(() => { fetchAll() }, [])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [lessonsRes, chaptersRes] = await Promise.all([
                axios.get('/api/elearning/admin/lessons'),
                axios.get('/api/elearning/admin/chapters'),
            ])

            const lessonsRaw = Array.isArray(lessonsRes.data)
                ? lessonsRes.data
                : (lessonsRes.data?.lessons || lessonsRes.data?.data || [])

            const chaptersRaw = Array.isArray(chaptersRes.data)
                ? chaptersRes.data
                : (chaptersRes.data?.chapters || chaptersRes.data?.data || [])
            console.log('chaptersRaw:', chaptersRaw)
            setLessons(lessonsRaw.map(l => ({
                ...l,
                id: l.id ?? l.lesson_id ?? l.le_id,
                chapter_id: l.chapter_id ?? l.chapterId ?? l.ch_id ?? l.chapter?.id,
            })))

            setChapters(chaptersRaw.map(c => ({
                id: c.id ?? c.ch_id ?? c.chapter_id,
                title: c.title ?? c.ch_title ?? c.chapter_title,
                badge_key: c.badge_key ?? c.badgeKey,
                category_id: c.category_id ?? c.categoryId,
            })).filter(c => c.id != null))
        } catch (err) {
            const msg = err?.response?.data?.message || 'Gagal memuat data'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const openEdit = async (lesson) => {
        try {
            const res = await axios.get(`/api/elearning/admin/lessons/${lesson.id}`)
            // openEdit = edit mode, tidak perlu defaultChapterId
            setModalLesson({ ...res.data, _isEdit: true })
        } catch {
            toast.error('Gagal memuat detail lesson')
        }
    }

    // Setelah chapter baru berhasil dibuat → tambah ke list & buka modal lesson baru
    const handleChapterSaved = (newChapter) => {
        setChapters(prev => [...prev, {
            id: newChapter.id,
            title: newChapter.title,
            badge_key: newChapter.badge_key, // ✅
            category_id: newChapter.category_id, // ✅

        }])
        setShowAddChapter(false)
        // Buka modal tambah lesson dengan chapter baru ter-select
        setModalLesson({ defaultChapterId: String(newChapter.id) })
    }

    const toggleChapter = (chapterId) => {
        setCollapsedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }))
    }

    // Kelompokkan lesson per chapter
    const lessonsByChapter = chapters.map(chapter => ({
        ...chapter,
        lessons: lessons.filter(l => String(l.chapter_id) === String(chapter.id)),
    }))

    // Lesson yang chapter-nya tidak ada di list chapters (orphan)
    const orphanLessons = lessons.filter(l => !chapters.find(c => String(c.id) === String(l.chapter_id)))

    const totalQuiz   = lessons.reduce((s, l) => s + (l.question_count || 0), 0)
    const totalActive = lessons.filter(l => l.is_active).length

    return (
        <Layout>
            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="nav-item p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">Kelola E-Learning</h1>
                        <p className="text-sm text-white/40 mt-0.5">Tambah dan atur video pembelajaran beserta kuis interaktif</p>
                    </div>
                    {/* Tombol Tambah Chapter & Tambah Lesson */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddChapter(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Tambah Chapter
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Lesson',   value: lessons.length,  icon: Film       },
                        { label: 'Total Kuis',     value: totalQuiz,       icon: HelpCircle },
                        { label: 'Aktif',          value: totalActive,     icon: Eye        },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="glass-card p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{value}</p>
                                <p className="text-xs text-white/40">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* List dikelompokkan per chapter */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : lessons.length === 0 && chapters.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <Film className="w-14 h-14 text-white/10 mx-auto mb-3" />
                        <p className="text-white/50">Belum ada chapter & lesson</p>
                        <p className="text-xs text-white/25 mt-1 mb-5">Mulai dengan membuat chapter terlebih dahulu</p>
                        <button onClick={() => setShowAddChapter(true)} className="btn-primary">
                            <FolderPlus className="w-4 h-4 mr-2 inline" /> Tambah Chapter Pertama
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {lessonsByChapter.map((chapter, ci) => (
                                <motion.div
                                    key={chapter.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: ci * 0.05 }}
                                >
                                    {/* Chapter Header */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            onClick={() => toggleChapter(chapter.id)}
                                            className="flex items-center gap-2 flex-1 text-left group"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">
                                                {chapter.title}
                                            </span>
                                            <span className="text-xs text-white/30">
                                                {chapter.lessons.length} lesson
                                            </span>
                                            {collapsedChapters[chapter.id]
                                                ? <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                                                : <ChevronDown className="w-4 h-4 text-white/30 ml-auto" />
                                            }
                                        </button>

                                        {/* Tombol + tambah lesson di chapter ini */}
                                        <button
                                            onClick={() => setModalLesson({ defaultChapterId: String(chapter.id) })}
                                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center transition-all group"
                                            title={`Tambah lesson ke ${chapter.title}`}
                                        >
                                            <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-primary transition-colors" />
                                        </button>
                                    </div>

                                    {/* Lesson list per chapter */}
                                    <AnimatePresence>
                                        {!collapsedChapters[chapter.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-4 pl-4 border-l border-white/10 space-y-2 pb-2">
                                                    {chapter.lessons.length === 0 ? (
                                                        <button
                                                            onClick={() => setModalLesson({ defaultChapterId: String(chapter.id) })}
                                                            className="w-full glass-card p-3 border border-dashed border-white/10 hover:border-primary/30 flex items-center justify-center gap-2 text-xs text-white/30 hover:text-primary/60 transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Tambah lesson pertama di chapter ini
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {chapter.lessons.map((lesson) => (
                                                                <LessonRow
                                                                    key={lesson.id}
                                                                    lesson={lesson}
                                                                    onEdit={() => openEdit(lesson)}
                                                                    // onDelete={() => handleDelete(lesson.id)}
                                                                    // deleting={deleting === lesson.id}
                                                                />
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}

                            {/* Orphan lessons (chapter tidak ditemukan) */}
                            {orphanLessons.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-400/60" />
                                        <span className="text-xs text-white/30 font-semibold">Chapter tidak diketahui</span>
                                    </div>
                                    <div className="ml-4 pl-4 border-l border-white/10 space-y-2">
                                        {orphanLessons.map(lesson => (
                                            <LessonRow
                                                key={lesson.id}
                                                lesson={lesson}
                                                onEdit={() => openEdit(lesson)}
                                                onDelete={() => handleDelete(lesson.id)}
                                                deleting={deleting === lesson.id}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal Tambah Chapter */}
            <AnimatePresence>
                {showAddChapter && (
                    <AddChapterModal
                        onClose={() => setShowAddChapter(false)}
                        onSaved={handleChapterSaved}
                    />
                )}
            </AnimatePresence>

            {/* Modal Tambah / Edit Lesson */}
            <AnimatePresence>
                {modalLesson !== null && (
                    <LessonFormModal
                        lesson={modalLesson?._isEdit ? modalLesson : null}
                        chapters={chapters}
                        defaultChapterId={modalLesson?.defaultChapterId || ''}
                        onClose={() => setModalLesson(null)}
                        onSaved={() => { fetchAll(); setModalLesson(null) }}
                    />
                )}
            </AnimatePresence>
        </Layout>
    )
}

// ── Lesson Row (extracted for reuse) ──────────────────────────────────────

function LessonRow({ lesson, onEdit, onDelete, deleting }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 flex items-center gap-4"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${lesson.video_path ? 'bg-primary/20' : 'bg-white/5'}`}>
                <Film className={`w-4 h-4 ${lesson.video_path ? 'text-primary' : 'text-white/20'}`} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white text-sm truncate">{lesson.title}</p>
                    {!lesson.is_active && (
                        <span className="flex-shrink-0 text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Nonaktif
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/35">
                    <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />{lesson.question_count} kuis
                    </span>
                    <span className="flex items-center gap-1 text-accent/70">
                        <Star className="w-3 h-3" />{lesson.xp_reward} XP
                    </span>
                    {lesson.video_path && (
                        <span className="text-green-400/70 flex items-center gap-1">
                            <Check className="w-3 h-3" />{String(lesson.video_path).split(/[\\/]/).pop()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={onEdit} className="nav-item p-2 text-white/60 hover:text-white" title="Edit">
                    <Edit2 className="w-4 h-4" />
                </button>
                {/* <button onClick={onDelete} disabled={deleting}
                    className="nav-item p-2 text-white/40 hover:text-red-400 disabled:opacity-50" title="Hapus">
                    {deleting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                </button> */}
            </div>
        </motion.div>
    )
}