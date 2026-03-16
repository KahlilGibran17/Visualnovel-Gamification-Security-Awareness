import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, Star, PlayCircle, Clock, Award } from 'lucide-react'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'

const CHAPTER_COLORS = [
    'from-blue-500/20 to-cyan-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-orange-500/20 to-yellow-500/20',
    'from-green-500/20 to-emerald-500/20',
    'from-red-500/20 to-orange-500/20',
    'from-yellow-500/20 to-amber-500/20',
]

const CHAPTER_BORDER = [
    'border-blue-500/30',
    'border-purple-500/30',
    'border-orange-500/30',
    'border-green-500/30',
    'border-red-500/30',
    'border-yellow-500/30',
]

const TOPICS = [
    { key: 'Phishing Awareness', desc: 'Learn to spot fake emails and social engineering attacks before they steal your credentials.' },
    { key: 'Clean Desk Policy', desc: 'Discover why leaving sensitive documents visible creates serious security vulnerabilities.' },
    { key: 'Social Engineering', desc: 'Recognize manipulation tactics used by attackers to gain unauthorized access.' },
    { key: 'Password Security', desc: 'Master strong password practices through an interactive challenge.' },
    { key: 'Incident Reporting', desc: 'Know when and how to report security incidents to protect the company.' },
    { key: 'All Skills Combined', desc: 'Final showdown — use everything you learned to defeat the hacker Ph1sh!' },
]

export default function ChapterSelectPage() {
    const { CHAPTERS, chapterProgress, getLevelFromXP } = useGame()
    const navigate = useNavigate()

    const isLocked = (idx) => {
        if (idx === 0) return false
        const prevChapter = CHAPTERS[idx - 1]
        return !chapterProgress[prevChapter.id]?.completed
    }

    return (
        <Layout>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold font-display text-white mb-2">📚 Chapter Select</h1>
                    <p className="text-white/50">Complete chapters in order to unlock the next mission. Good luck, recruit!</p>
                </motion.div>

                {/* Chapter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {CHAPTERS.map((chapter, idx) => {
                        const locked = isLocked(idx)
                        const progress = chapterProgress[chapter.id]
                        const completed = progress?.completed
                        const goodEnding = progress?.ending === 'good'

                        const colorClass = CHAPTER_COLORS[idx % CHAPTER_COLORS.length]
                        const borderClass = CHAPTER_BORDER[idx % CHAPTER_BORDER.length]
                        const topicDesc = TOPICS[idx % TOPICS.length]?.desc || "Complete this mission to improve your security awareness and earn XP."

                        return (
                            <motion.div
                                key={chapter.id}
                                id={`chapter-card-${chapter.id}`}
                                className={`glass-card border ${borderClass} bg-gradient-to-br ${colorClass} relative overflow-hidden cursor-pointer group transition-all duration-300 ${locked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-xl'
                                    }`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.07 }}
                                onClick={() => !locked && navigate(`/play/${chapter.id}`)}
                            >
                                {/* Chapter number watermark */}
                                <div className="absolute top-2 right-3 text-7xl font-black opacity-5 text-white select-none">
                                    {chapter.id}
                                </div>

                                <div className="p-5 relative z-10">
                                    {/* Status icons */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {completed && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${goodEnding ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    }`}>
                                                    {goodEnding ? '✅ Good Ending' : '⚠️ Bad Ending'}
                                                </span>
                                            )}
                                            {locked && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> Locked
                                                </span>
                                            )}
                                        </div>
                                        {completed && progress.xpEarned && (
                                            <span className="text-accent font-bold text-sm">+{progress.xpEarned} XP</span>
                                        )}
                                    </div>

                                    {/* Icon + title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="text-4xl">{chapter.icon}</div>
                                        <div>
                                            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Chapter {chapter.id}</p>
                                            <h3 className="font-bold text-white text-lg leading-tight">{chapter.title}</h3>
                                            <p className="text-white/60 text-sm">{chapter.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* Topic description */}
                                    <p className="text-white/50 text-xs leading-relaxed mb-4">{topicDesc}</p>

                                    {/* Location */}
                                    <div className="flex items-center gap-1 text-xs text-white/40 mb-4">
                                        <span>📍</span> {chapter.location}
                                    </div>

                                    {/* Action */}
                                    {locked ? (
                                        <div className="flex items-center gap-2 text-white/30 text-sm">
                                            <Lock className="w-4 h-4" />
                                            Complete Chapter {chapter.id - 1} to unlock
                                        </div>
                                    ) : (
                                        <button
                                            id={`play-chapter-${chapter.id}-btn`}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${completed
                                                ? 'bg-white/10 text-white hover:bg-white/20'
                                                : 'bg-primary text-white hover:bg-primary-dark'
                                                }`}
                                            style={completed ? {} : { boxShadow: '0 0 20px rgba(230,57,70,0.3)' }}
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            {completed ? 'Play Again' : idx === 0 ? 'Start Chapter' : 'Continue'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* XP Guide */}
                <motion.div
                    className="mt-8 glass-card p-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">⚡ XP Rewards Guide</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { icon: '✅', label: 'Correct Answer', xp: '+50 XP' },
                            { icon: '🏆', label: 'Good Ending', xp: '+200 XP' },
                            { icon: '⚠️', label: 'Bad Ending', xp: '+100 XP' },
                            { icon: '💎', label: 'Perfect Score', xp: '+100 XP bonus' },
                        ].map(r => (
                            <div key={r.label} className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-2xl mb-1">{r.icon}</div>
                                <p className="text-xs text-white/60">{r.label}</p>
                                <p className="text-accent font-bold text-sm">{r.xp}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
