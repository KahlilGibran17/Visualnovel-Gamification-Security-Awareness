import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Volume2, VolumeX, SkipForward, RotateCcw, Star, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import chapter1 from '../data/chapters/chapter1.json'

const CHAPTERS_DATA = { 1: chapter1 }

// Scene background styles
const BACKGROUNDS = {
    office: {
        gradient: 'from-blue-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(15,52,96,0.8), rgba(26,26,46,0.95))',
        label: '🏢 Akebono Main Office',
    },
    desk: {
        gradient: 'from-indigo-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(49,46,129,0.7), rgba(26,26,46,0.95))',
        label: '💻 Workstation',
    },
    server: {
        gradient: 'from-green-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(6,78,59,0.7), rgba(26,26,46,0.95))',
        label: '🖥️ Server Room',
    },
    elevator: {
        gradient: 'from-gray-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(26,26,46,0.95))',
        label: '🛗 Elevator',
    },
    factory: {
        gradient: 'from-orange-900/40 via-dark/60 to-dark',
        pattern: 'linear-gradient(135deg, rgba(120,53,15,0.6), rgba(26,26,46,0.95))',
        label: '🏭 Factory Floor',
    },
}

// Character sprites
function CharacterSprite({ character, expression, position }) {
    const SPRITES = {
        player: { base: '🧑‍💻', expressions: { happy: '😊', shocked: '😱', worried: '😟', proud: '💪', normal: '🧑‍💻' } },
        akebot: { base: '🤖', expressions: { happy: '🤖✨', worried: '🤖⚠️', proud: '🤖🎉', shocked: '🤖😱', normal: '🤖' } },
        villain: { base: '😈', expressions: { evil: '😈', angry: '😡', smug: '😏', shocked: '😲', normal: '😈' } },
        manager: { base: '👔', expressions: { happy: '😄', worried: '😟', shocked: '😱', normal: '👔' } },
    }

    const sprite = SPRITES[character] || SPRITES.player
    const expr = sprite.expressions[expression] || sprite.base

    const charColors = {
        player: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        akebot: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
        villain: 'from-red-900/40 to-purple-900/30 border-red-600/30',
        manager: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    }

    return (
        <motion.div
            className={`flex flex-col items-center gap-1 ${position === 'right' ? 'items-end' : 'items-start'}`}
            initial={{ opacity: 0, x: position === 'left' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position === 'left' ? -30 : 30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
            <motion.div
                className={`w-28 h-36 md:w-36 md:h-48 rounded-2xl border bg-gradient-to-b ${charColors[character] || charColors.player} flex flex-col items-center justify-center gap-2 relative overflow-hidden`}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                {/* CRT scanlines overlay */}
                <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

                <span className="text-5xl md:text-7xl select-none">{expr.split('')[0]}</span>
                {character === 'villain' && (
                    <motion.div
                        className="absolute inset-0 bg-red-500/5"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

// Typewriter hook
function useTypewriter(text, speed = 30, isActive = true) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)
    const indexRef = useRef(0)
    const timerRef = useRef(null)

    useEffect(() => {
        if (!isActive || !text) return
        setDisplayed('')
        setDone(false)
        indexRef.current = 0

        timerRef.current = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayed(text.slice(0, indexRef.current + 1))
                indexRef.current++
            } else {
                setDone(true)
                clearInterval(timerRef.current)
            }
        }, speed)

        return () => clearInterval(timerRef.current)
    }, [text, speed, isActive])

    const skip = useCallback(() => {
        clearInterval(timerRef.current)
        setDisplayed(text)
        setDone(true)
    }, [text])

    return { displayed, done, skip }
}

// Email display component
function EmailDisplay({ email, onContinue }) {
    return (
        <motion.div
            className="bg-white/95 rounded-xl p-5 max-w-lg mx-auto text-gray-800 font-mono text-sm shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
        >
            {/* Email header */}
            <div className="border-b border-gray-200 pb-3 mb-3 space-y-1">
                <div className="flex gap-2">
                    <span className="text-gray-500 font-semibold w-10">From:</span>
                    <span className="text-red-600 font-bold">{email.from}</span>
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">⚠️ SUSPICIOUS</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-gray-500 font-semibold w-10">To:</span>
                    <span className="text-blue-700">{email.to}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-gray-500 font-semibold">Subject:</span>
                    <span className="font-bold text-red-700">{email.subject}</span>
                </div>
            </div>

            {/* Body */}
            <div className="whitespace-pre-wrap text-gray-700 mb-4 text-xs leading-relaxed bg-gray-50 p-3 rounded-lg border">
                {email.body}
            </div>

            {/* Red flags */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 font-bold text-xs mb-2">🚨 Red Flags Detected:</p>
                {email.redFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-600 mb-1">
                        <span className="text-red-500 mt-0.5">❌</span>
                        <span>{flag}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onContinue}
                className="w-full bg-dark text-white py-3 rounded-lg font-semibold hover:bg-dark-card transition-colors"
            >
                Continue Reading →
            </button>
        </motion.div>
    )
}

// Lesson display
function LessonDisplay({ lesson, onContinue }) {
    return (
        <motion.div
            className="glass-card p-5 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3 className="font-bold text-accent text-lg mb-3">{lesson.title}</h3>
            <ul className="space-y-2">
                {lesson.points.map((point, i) => (
                    <motion.li
                        key={i}
                        className="flex items-start gap-2 text-white/80 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        {point}
                    </motion.li>
                ))}
            </ul>
            <button onClick={onContinue} className="btn-primary w-full mt-4">
                Got it! Continue →
            </button>
        </motion.div>
    )
}

// Timer ring
function TimerRing({ seconds, total }) {
    const pct = seconds / total
    const r = 22
    const c = 2 * Math.PI * r
    const offset = c * (1 - pct)

    return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <motion.circle
                    cx="28" cy="28" r={r}
                    fill="none"
                    stroke={seconds <= 5 ? '#E63946' : '#FFD60A'}
                    strokeWidth="3"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5 }}
                />
            </svg>
            <span className={`font-bold text-lg ${seconds <= 5 ? 'text-primary animate-pulse' : 'text-accent'}`}>
                {seconds}
            </span>
        </div>
    )
}

export default function VNEnginePage() {
    const { chapterId } = useParams()
    const { user } = useAuth()
    const { awardXP, completeChapter } = useGame()
    const navigate = useNavigate()

    const chapterData = CHAPTERS_DATA[parseInt(chapterId)]
    const [sceneId, setSceneId] = useState(chapterData?.scenes[0]?.id || null)
    const [choiceResult, setChoiceResult] = useState(null) // { correct, consequence, lesson, xp }
    const [timer, setTimer] = useState(null)
    const [timerTotal, setTimerTotal] = useState(15)
    const [xpTotal, setXpTotal] = useState(0)
    const [wrongChoices, setWrongChoices] = useState(0)
    const [mute, setMute] = useState(false)
    const [showHud, setShowHud] = useState(true)
    const [gameOver, setGameOver] = useState(false)

    const currentScene = chapterData?.scenes.find(s => s.id === sceneId)
    const playerName = user?.name?.split(' ')[0] || 'Recruit'

    const getText = (text) => text?.replace(/\{\{playerName\}\}/g, playerName) || ''

    const { displayed: dialogueText, done: dialogueDone, skip: skipDialogue } = useTypewriter(
        currentScene?.type === 'dialogue' ? getText(currentScene.text) : '',
        25,
        currentScene?.type === 'dialogue'
    )

    // Timer for choices
    useEffect(() => {
        if (currentScene?.type === 'choice' && currentScene.timer && !choiceResult) {
            setTimer(currentScene.timer)
            setTimerTotal(currentScene.timer)
            const interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval)
                        // Auto-select wrong answer on timeout
                        handleChoice(currentScene.choices[0], true)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [sceneId, choiceResult])

    const handleChoice = useCallback((choice, timedOut = false) => {
        setTimer(null)
        if (choice.correct) {
            awardXP(choice.xp, `Chapter ${chapterId} correct choice`)
            setXpTotal(prev => prev + choice.xp)
            setSceneId(choice.next)
        } else {
            setWrongChoices(prev => prev + 1)
            setChoiceResult({
                correct: false,
                consequence: timedOut ? "Time's up! You didn't respond in time!" : choice.consequence,
                lesson: choice.lesson,
                xp: choice.xp,
                next: choice.next,
            })
        }
    }, [awardXP, chapterId])

    const handleWrongDismiss = () => {
        const next = choiceResult.next
        setChoiceResult(null)
        setTimer(null)
        setSceneId(next)
    }

    const handleNext = () => {
        if (!currentScene) return
        if (currentScene.type === 'dialogue') {
            if (!dialogueDone) { skipDialogue(); return }
            if (currentScene.xpReward) {
                awardXP(currentScene.xpReward, 'dialogue xp')
                setXpTotal(prev => prev + currentScene.xpReward)
            }
            if (currentScene.next) setSceneId(currentScene.next)
        }
    }

    const handleEnding = async (scene) => {
        const result = {
            ending: scene.ending,
            xpEarned: xpTotal + scene.xpBonus,
            perfect: wrongChoices === 0,
            score: Math.max(0, 100 - wrongChoices * 25),
        }
        await completeChapter(parseInt(chapterId), result)
        await awardXP(scene.xpBonus, scene.ending === 'good' ? 'good_ending' : 'bad_ending')
        navigate(`/result/${chapterId}`, { state: { result, chapterData } })
    }

    if (!chapterData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Chapter not available yet</p>
                    <button onClick={() => navigate('/chapters')} className="btn-primary">← Back to Chapters</button>
                </div>
            </div>
        )
    }

    const bg = BACKGROUNDS[currentScene?.background] || BACKGROUNDS.office

    return (
        <div className="fixed inset-0 bg-dark overflow-hidden flex flex-col">
            {/* Background */}
            <div
                className={`absolute inset-0 bg-gradient-to-b ${bg.gradient} transition-all duration-1000`}
                style={{ background: bg.pattern }}
            />

            {/* Scanline overlay */}
            <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />

            {/* CRT vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)'
            }} />

            {/* HUD - Top bar */}
            <AnimatePresence>
                {showHud && (
                    <motion.div
                        className="relative z-20 flex items-center gap-4 px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10"
                        initial={{ y: -50 }}
                        animate={{ y: 0 }}
                        exit={{ y: -50 }}
                    >
                        <button onClick={() => navigate('/chapters')} className="text-white/50 hover:text-white transition-colors">
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Chapter {chapterId}</p>
                            <p className="text-sm font-semibold text-white">{chapterData.title}</p>
                        </div>
                        {/* Location */}
                        <div className="hidden md:block text-xs text-white/40">
                            {bg.label}
                        </div>
                        {/* XP counter */}
                        <div className="flex items-center gap-1.5 bg-accent/20 border border-accent/30 rounded-full px-3 py-1">
                            <Star className="w-3.5 h-3.5 text-accent" />
                            <span className="text-accent font-bold text-sm">{xpTotal} XP</span>
                        </div>
                        {/* Mute */}
                        <button onClick={() => setMute(!mute)} className="text-white/40 hover:text-white transition-colors">
                            {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main scene area */}
            <div className="relative flex-1 flex items-end">
                {/* Characters */}
                {currentScene?.type === 'dialogue' && (
                    <div className="absolute inset-0 flex items-end justify-between px-8 pb-36 pointer-events-none">
                        {/* Left character */}
                        <AnimatePresence mode="wait">
                            {currentScene.position === 'left' && (
                                <motion.div key={currentScene.character + '_left'} className="pointer-events-auto">
                                    <CharacterSprite
                                        character={currentScene.character}
                                        expression={currentScene.expression}
                                        position="left"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Right character */}
                        <AnimatePresence mode="wait">
                            {currentScene.position === 'right' && (
                                <motion.div key={currentScene.character + '_right'} className="pointer-events-auto">
                                    <CharacterSprite
                                        character={currentScene.character}
                                        expression={currentScene.expression}
                                        position="right"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Email scene */}
                {currentScene?.type === 'email' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <EmailDisplay
                            email={currentScene.email}
                            onContinue={() => setSceneId(currentScene.next)}
                        />
                    </div>
                )}

                {/* Lesson scene */}
                {currentScene?.type === 'lesson' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <LessonDisplay
                            lesson={currentScene}
                            onContinue={() => setSceneId(currentScene.next)}
                        />
                    </div>
                )}

                {/* Ending scene */}
                {currentScene?.type === 'ending' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <motion.div
                            className="glass-card p-8 max-w-lg w-full text-center"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <div className="text-6xl mb-4">{currentScene.ending === 'good' ? '🎉' : '💥'}</div>
                            <h2 className={`text-2xl font-bold font-display mb-3 ${currentScene.ending === 'good' ? 'text-accent' : 'text-primary'}`}>
                                {currentScene.title}
                            </h2>
                            <p className="text-white/70 mb-4">{currentScene.message}</p>
                            {currentScene.lesson_recap && (
                                <div className="bg-white/5 rounded-xl p-4 text-left mb-6">
                                    <p className="text-accent font-bold text-sm mb-2">📚 Lesson Summary:</p>
                                    {currentScene.lesson_recap.map((l, i) => (
                                        <p key={i} className="text-white/70 text-sm flex items-start gap-2 mb-1">
                                            <span className="text-white/40 mt-0.5">•</span> {l}
                                        </p>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3">
                                {currentScene.ending === 'bad' && (
                                    <button
                                        id="retry-chapter-btn"
                                        onClick={() => { setSceneId(chapterData.scenes[0].id); setWrongChoices(0); setXpTotal(0) }}
                                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Retry Chapter
                                    </button>
                                )}
                                <button
                                    id="finish-chapter-btn"
                                    onClick={() => handleEnding(currentScene)}
                                    className="btn-primary flex-1"
                                >
                                    {currentScene.ending === 'good' ? '🏆 Collect Reward!' : '📊 See Results'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Wrong choice overlay */}
                <AnimatePresence>
                    {choiceResult && !choiceResult.correct && (
                        <motion.div
                            className="absolute inset-0 z-30 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Red flash background */}
                            <motion.div
                                className="absolute inset-0 bg-primary/20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.8, 0.3] }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.div
                                className="glass-card border border-primary/40 p-6 max-w-md w-full relative z-10"
                                initial={{ scale: 0.8, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-primary text-lg">Security Breach!</h3>
                                        <p className="text-white/60 text-sm">That wasn't the right choice...</p>
                                    </div>
                                </div>
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                                    <p className="text-white/80 text-sm">{choiceResult.consequence}</p>
                                </div>
                                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4">
                                    <p className="text-accent font-bold text-xs mb-1">📚 What you should know:</p>
                                    <p className="text-white/70 text-sm">{choiceResult.lesson}</p>
                                </div>
                                <button
                                    id="wrong-choice-continue-btn"
                                    onClick={handleWrongDismiss}
                                    className="btn-primary w-full"
                                >
                                    Understood — Continue
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dialogue box */}
                {currentScene?.type === 'dialogue' && (
                    <motion.div
                        className="relative z-10 w-full"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="vn-dialogue-box p-5 md:p-6 mx-2 md:mx-4 mb-2 md:mb-4 rounded-2xl">
                            {/* Speaker name */}
                            <div className="mb-3">
                                <span className="inline-block px-4 py-1 rounded-full text-sm font-bold bg-primary text-white">
                                    {getText(currentScene.speaker)}
                                </span>
                            </div>
                            {/* Dialogue text */}
                            <p className={`text-white text-base md:text-lg leading-relaxed min-h-[3rem] ${!dialogueDone ? 'typewriter-cursor' : ''}`}>
                                {dialogueText}
                            </p>
                            {/* Continue hint */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-white/30 text-sm">
                                    {currentScene.xpReward && dialogueDone && (
                                        <span className="text-accent text-xs font-bold">+{currentScene.xpReward} XP incoming</span>
                                    )}
                                </div>
                                <button
                                    id="dialogue-next-btn"
                                    onClick={handleNext}
                                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
                                >
                                    {dialogueDone ? (
                                        <><span>Click to continue</span><motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>→</motion.span></>
                                    ) : (
                                        <><SkipForward className="w-4 h-4" /> Skip</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Choice panel */}
                {currentScene?.type === 'choice' && !choiceResult && (
                    <motion.div
                        className="relative z-10 w-full"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="vn-dialogue-box p-5 md:p-6 mx-2 md:mx-4 mb-2 md:mb-4 rounded-2xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <p className="text-white font-semibold">{currentScene.question}</p>
                                {timer !== null && (
                                    <div className="flex-shrink-0">
                                        <TimerRing seconds={timer} total={timerTotal} />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {currentScene.choices.map(choice => (
                                    <motion.button
                                        key={choice.id}
                                        id={`choice-${choice.id}-btn`}
                                        onClick={() => handleChoice(choice)}
                                        className="text-left p-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 transition-all duration-200 text-white text-sm font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {choice.text}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
