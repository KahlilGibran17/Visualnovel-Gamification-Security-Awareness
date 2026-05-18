import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from '../../utils/toast.js'
import Layout from '../../components/Layout.jsx'
import {
    Plus, Trash2, ChevronDown, ChevronUp, Save, X, Check,
    BookOpen, AlertCircle, Loader2, HelpCircle, ArrowLeft, Search, Edit2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const emptyOption = () => ({ _id: Math.random(), option_text: '', is_correct: false })
const emptyQuestion = () => ({
    _id: Math.random(),
    question_text: '',
    options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
})

function OptionRow({ opt, index, onChange, onRemove, canRemove, disabled }) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...opt, is_correct: true })}
                title="Jawaban benar"
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    opt.is_correct
                        ? 'border-green-400 bg-green-400'
                        : 'border-white/20 hover:border-green-400/60'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {opt.is_correct && <Check className="w-3 h-3 text-main" />}
            </button>

            <input
                type="text"
                disabled={disabled}
                value={opt.option_text}
                onChange={e => onChange({ ...opt, option_text: e.target.value })}
                placeholder={`Pilihan ${index + 1}`}
                className={`flex-1 input-field text-sm py-2 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            />

            {canRemove && !disabled && (
                <button type="button" onClick={onRemove} className="text-main/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

function QuestionCard({ question, index, onChange, onRemove }) {
    const [open, setOpen] = useState(true)
    const [isEditing, setIsEditing] = useState(!question.question_text)
    const [originalQuestion, setOriginalQuestion] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const updateOption = (_id, newOpt) => {
        const updated = question.options.map(o => {
            if (o._id === _id) return newOpt
            if (newOpt.is_correct) return { ...o, is_correct: false }
            return o
        })
        onChange({ ...question, options: updated.map(o => o._id === _id ? newOpt : o) })
    }

    const hasCorrect = question.options.some(o => o.is_correct)

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-main truncate">
                        {question.question_text || <span className="text-main/30 italic">Pertanyaan belum diisi</span>}
                    </p>
                    {!hasCorrect && (
                        <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />Belum ada jawaban benar
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!isEditing && (
                        <button type="button" onClick={e => { 
                            e.stopPropagation(); 
                            setOriginalQuestion(JSON.parse(JSON.stringify(question)));
                            setIsEditing(true); 
                            setOpen(true); 
                        }} className="text-main/40 hover:text-primary transition-colors p-1" title="Edit Pertanyaan">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {isEditing && (
                        <button type="button" onClick={e => {
                            e.stopPropagation();
                            if (!question.id) {
                                onRemove();
                            } else {
                                onChange(originalQuestion);
                                setIsEditing(false);
                            }
                        }} className="text-xs font-medium text-main/60 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition-colors mr-1">
                            Batal Edit
                        </button>
                    )}
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2 mr-2" onClick={e => e.stopPropagation()}>
                            <span className="text-xs text-red-400 font-medium">Yakin hapus?</span>
                            <button type="button" onClick={onRemove} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">Ya</button>
                            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-xs bg-white/10 text-main/70 px-2 py-1 rounded hover:bg-white/20 transition-colors">Batal</button>
                        </div>
                    ) : (
                        <button type="button" onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true) }} className="text-main/20 hover:text-red-400 transition-colors p-1" title="Hapus Pertanyaan">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    {open ? <ChevronUp className="w-4 h-4 text-main/40" /> : <ChevronDown className="w-4 h-4 text-main/40" />}
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 space-y-4 border-t border-white/5 pt-4">
                            <div>
                                <label className="label-text">Teks Pertanyaan</label>
                                <textarea rows={2} value={question.question_text}
                                    disabled={!isEditing}
                                    onChange={e => onChange({ ...question, question_text: e.target.value })}
                                    placeholder="Tulis pertanyaan di sini..."
                                    className={`input-field text-sm w-full resize-none ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
                            </div>

                            <div>
                                <label className="label-text flex items-center gap-1.5 mb-2">
                                    Pilihan Jawaban <span className="text-main/30 font-normal text-xs">(● = benar)</span>
                                </label>
                                <div className="space-y-2">
                                    {question.options.map((opt, oi) => (
                                        <OptionRow key={opt._id} opt={opt} index={oi}
                                            disabled={!isEditing}
                                            onChange={newOpt => updateOption(opt._id, newOpt)}
                                            onRemove={() => onChange({ ...question, options: question.options.filter(o => o._id !== opt._id) })}
                                            canRemove={question.options.length > 2} />
                                    ))}
                                </div>
                                {isEditing && question.options.length < 6 && (
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

export default function AdminPretestPage() {
    const navigate = useNavigate()
    const [chapters, setChapters] = useState([])
    const [selectedChapter, setSelectedChapter] = useState('')
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchingQuestions, setFetchingQuestions] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showChapterModal, setShowChapterModal] = useState(false)
    const [searchChapter, setSearchChapter] = useState('')
    const [initialQuestionsStr, setInitialQuestionsStr] = useState('[]')

    const hasUnsavedChanges = JSON.stringify(questions) !== initialQuestionsStr

    useEffect(() => {
        fetchChapters()
    }, [])

    useEffect(() => {
        if (!selectedChapter) {
            setQuestions([])
            return
        }
        fetchQuestions(selectedChapter)
    }, [selectedChapter])

    const fetchChapters = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/elearning/admin/chapters')
            const raw = Array.isArray(res.data) ? res.data : (res.data?.chapters || [])
            const mapped = raw.map(c => ({
                id: c.id ?? c.ch_id ?? c.chapter_id,
                title: c.title ?? c.ch_title ?? c.chapter_title,
            })).filter(c => c.id != null)
            setChapters(mapped)
            if (mapped.length && !selectedChapter) {
                setSelectedChapter(String(mapped[0].id))
            }
        } catch {
            toast.error('Gagal memuat daftar chapter')
        } finally {
            setLoading(false)
        }
    }

    const fetchQuestions = async (chapterId) => {
        setFetchingQuestions(true)
        try {
            const res = await axios.get(`/api/preTest/admin/chapters/${chapterId}`)
            const raw = res.data?.questions || []
            const normalized = raw.map(q => ({
                id: q.id ?? q.pq_id,
                _id: Math.random(),
                question_text: q.question_text ?? q.pq_text ?? '',
                options: (q.options || []).map(o => ({
                    id: o.id ?? o.po_id,
                    _id: Math.random(),
                    option_text: o.option_text ?? o.po_text ?? '',
                    is_correct: o.is_correct ?? false,
                })),
            }))
            setQuestions(normalized)
            setInitialQuestionsStr(JSON.stringify(normalized))
        } catch {
            toast.error('Gagal memuat pre-test')
        } finally {
            setFetchingQuestions(false)
        }
    }

    const validate = () => {
        if (!selectedChapter) {
            toast.error('Pilih chapter terlebih dahulu')
            return false
        }
        if (questions.length === 0) {
            toast.error('Tidak ada pertanyaan untuk disimpan')
            return false
        }
        for (const q of questions) {
            if (!q.question_text.trim()) {
                toast.error('Semua teks pertanyaan harus diisi')
                return false
            }
            const filledOptions = q.options.filter(o => o.option_text.trim())
            if (filledOptions.length < 2) {
                toast.error('Setiap pertanyaan minimal 2 pilihan')
                return false
            }
            if (!filledOptions.some(o => o.is_correct)) {
                toast.error('Setiap pertanyaan harus punya jawaban benar')
                return false
            }
        }
        return true
    }

    const buildPayload = () => ({
        questions: questions.map((q, qi) => ({
            questionText: q.question_text,
            orderIndex: qi + 1,
            options: q.options
                .filter(o => o.option_text.trim())
                .map(o => ({
                    optionText: o.option_text,
                    isCorrect: o.is_correct,
                })),
        })),
    })

    const handleSave = async () => {
        if (!validate()) return
        setSaving(true)
        try {
            await axios.put(`/api/preTest/admin/chapters/${selectedChapter}`, buildPayload())
            toast.success('Pre-test berhasil disimpan')
            fetchQuestions(selectedChapter)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Gagal menyimpan pre-test'
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const chapterTitle = chapters.find(c => String(c.id) === String(selectedChapter))?.title
    const hasQuestions = questions.length > 0

    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="nav-item p-2 flex-shrink-0"
                        title="Kembali ke Admin"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-main">Pre-Test Management</h1>
                    </div>
                    {hasQuestions && hasUnsavedChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !selectedChapter}
                            className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan</>}
                        </button>
                    )}
                </div>

                <div className="glass-card p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-main">Pilih Chapter</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-main/40">
                            <Loader2 className="w-4 h-4 animate-spin" />Memuat chapter...
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowChapterModal(true)}
                                className="input-field text-sm w-full text-left flex justify-between items-center"
                            >
                                <span className={!selectedChapter ? 'text-main/50' : 'text-main'}>
                                    {chapterTitle || 'Pilih Chapter'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-main/40" />
                            </button>

                        </>
                    )}
                    {/* {chapterTitle && (
                        <p className="text-xs text-main/40 mt-2">Mengelola pre-test untuk: <span className="text-main/70 font-semibold">{chapterTitle}</span></p>
                    )} */}
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-main/80 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            Daftar Pertanyaan
                            {questions.length > 0 && (
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                                    {questions.length}
                                </span>
                            )}
                        </h3>
                        {/* Tambah pertanyaan di sini (untuk edit/update, bukan create baru dari nol) */}
                        {hasQuestions && (
                            <button
                                type="button"
                                onClick={() => setQuestions(qs => [...qs, emptyQuestion()])}
                                disabled={!selectedChapter}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Plus className="w-3.5 h-3.5" /> Tambah Pertanyaan
                            </button>
                        )}
                    </div>

                    {fetchingQuestions ? (
                        <div className="flex items-center justify-center py-10 text-main/40">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />Memuat pertanyaan...
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-12 text-main/40">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <HelpCircle className="w-8 h-8 text-primary/70" />
                            </div>
                            <p className="text-sm font-bold text-main/80 mb-1">Belum ada pertanyaan pre-test</p>
                            <p className="text-xs mb-5">Chapter ini belum memiliki soal pre-test sama sekali.</p>
                            <button
                                type="button"
                                onClick={() => setQuestions([emptyQuestion()])}
                                className="btn-primary text-xs py-2.5 px-5 mx-auto flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Buat Pre-test Sekarang
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <QuestionCard
                                        key={q._id}
                                        question={q}
                                        index={i}
                                        onChange={updated => setQuestions(items => items.map(x => x._id === q._id ? updated : x))}
                                        onRemove={() => setQuestions(items => items.filter(x => x._id !== q._id))}
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Modal Chapter */}
            <AnimatePresence>
                {showChapterModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-md glass-card bg-main border border-card-border shadow-2xl overflow-hidden flex flex-col chapter-modal-container"
                            style={{ maxHeight: '80vh' }}
                        >
                            <div className="p-5 border-b border-card-border flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-main leading-tight">Pilih Chapter</h2>
                                        <p className="text-xs text-main/40 mt-0.5">Cari dan pilih chapter pre-test</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowChapterModal(false)} className="text-main/40 hover:text-main p-1 transition-colors mt-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="p-4 border-b border-card-border">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-main/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari chapter..." 
                                        value={searchChapter}
                                        onChange={e => setSearchChapter(e.target.value)}
                                        className="w-full bg-input-bg border border-card-border text-sm text-main rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-main/30"
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto p-2 flex-1" style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#E63946 transparent'
                            }}>
                                <style>{`
                                    .chapter-modal-container ::-webkit-scrollbar { width: 4px; }
                                    .chapter-modal-container ::-webkit-scrollbar-track { background: transparent; }
                                    .chapter-modal-container ::-webkit-scrollbar-thumb { background: #E63946; border-radius: 10px; }
                                `}</style>

                                {chapters
                                    .filter(c => (c.title || `Chapter ${c.id}`).toLowerCase().includes(searchChapter.toLowerCase()))
                                    .map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedChapter(String(c.id));
                                            setShowChapterModal(false);
                                            setSearchChapter('');
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-1 border ${
                                            selectedChapter === String(c.id)
                                                ? 'bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/5'
                                                : 'border-transparent hover:bg-white/5 text-main/80'
                                        }`}
                                    >
                                        <div className="font-semibold text-sm">{c.title || `Chapter ${c.id}`}</div>
                                        <div className="text-xs text-main/40 mt-1">ID: {c.id}</div>
                                    </button>
                                ))}
                                {chapters.filter(c => (c.title || `Chapter ${c.id}`).toLowerCase().includes(searchChapter.toLowerCase())).length === 0 && (
                                    <div className="text-center py-8 text-main/40 text-sm">
                                        Tidak ada chapter yang cocok.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    )
}
