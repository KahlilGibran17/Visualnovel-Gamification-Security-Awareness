import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Volume2, VolumeX, SkipForward, RotateCcw, Star, AlertTriangle, CheckCircle, Clock, Search, Monitor, Smartphone, MousePointer2, XCircle, Terminal as TerminalIcon, Mail, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'

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
function CharacterSprite({ character, expression, position, isActive }) {
    const { CHARACTERS } = useGame()

    const SPRITES = {
        player: { base: '🧑‍💻', expressions: { happy: '😊', shocked: '😱', worried: '😟', proud: '💪', normal: '🧑‍💻' } },
        akebot: { base: '🤖', expressions: { happy: '🤖✨', worried: '🤖⚠️', proud: '🤖🎉', shocked: '🤖😱', normal: '🤖' } },
        villain: { base: '😈', expressions: { evil: '😈', angry: '😡', smug: '😏', shocked: '😲', normal: '😈' } },
        manager: { base: '👔', expressions: { happy: '😄', worried: '😟', shocked: '😱', normal: '👔' } },
    }

    const customChar = CHARACTERS?.find(c => c.key_name === character)
    const customExpr = customChar?.expressions?.find(e => e.expression_name === expression)

    const sprite = SPRITES[character] || SPRITES.player
    const exprEmoji = customExpr?.emoji || (customChar ? customChar.emoji : (sprite.expressions[expression] || sprite.base))
    const imgUrl = customExpr?.sprite_url || customExpr?.image_url

    // Full height 2D sprite rendering
    return (
        <motion.div
            className={`relative flex flex-col justify-end ${position === 'right' ? 'items-end' : 'items-start'} h-[30vh] md:h-[40vh] w-[35vw] md:w-[25vw] overflow-visible`}
            initial={{ opacity: 0, x: position === 'left' ? -50 : 50 }}
            animate={{
                opacity: isActive ? 1 : 0.6,
                x: 0,
                scale: isActive ? 1.05 : 0.95,
                filter: isActive ? 'brightness(1)' : 'brightness(0.5)'
            }}
            exit={{ opacity: 0, x: position === 'left' ? -50 : 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, duration: 0.2 }}
            style={{ transformOrigin: 'bottom center' }}
        >
            {imgUrl ? (
                <img
                    src={imgUrl}
                    alt={expression}
                    className="w-full h-full object-contain object-bottom drop-shadow-xl relative z-10"
                />
            ) : (
                // Fallback emoji rendering if no sprite is available
                <div className={`w-full max-w-sm aspect-[2/3] rounded-3xl border ${isActive ? 'from-white/20 to-white/5 border-white/30' : 'from-black/40 to-black/20 border-black/50'} bg-gradient-to-b flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm`}>
                    <span className="text-8xl md:text-9xl select-none relative z-10 drop-shadow-xl">{exprEmoji?.split('')[0] || '👤'}</span>
                </div>
            )}
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

// Investigate display
function InvestigateDisplay({ scene, onFound, timer, timerTotal }) {
    const [foundItems, setFoundItems] = useState([])
    const totalItems = scene.targets?.length || 0

    const handleClick = (target) => {
        if (!foundItems.includes(target.id)) {
            const newFound = [...foundItems, target.id]
            setFoundItems(newFound)
            if (newFound.length === totalItems) {
                setTimeout(() => onFound(true), 1000)
            }
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto pointer-events-auto z-20">
            <div className="bg-dark/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl mb-4 w-full flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-accent mb-1 flex items-center gap-2"><Search className="w-5 h-5" /> Spot the Threats!</h3>
                    <p className="text-white/70 text-sm">Find and click all {totalItems} security vulnerabilities.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-sm text-white/50">Found</div>
                        <div className="text-2xl font-black font-mono text-white">{foundItems.length}/{totalItems}</div>
                    </div>
                    {timer > 0 && <TimerRing seconds={timer} total={timerTotal} />}
                </div>
            </div>

            <div className="relative w-full aspect-video bg-[#e0e0e0] rounded-lg border-4 border-gray-700 overflow-hidden shadow-2xl ring-4 ring-black/20">
                {/* Simulated Content Area overlayed with invisible click targets */}
                {scene.uiType === 'email' ? (
                    <div className="absolute inset-0 bg-white flex flex-col text-left font-sans">
                        <div className="bg-[#0078d4] text-white p-2.5 px-4 font-semibold text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Outlook Web Access
                        </div>
                        <div className="border-b p-4 bg-[#f3f2f1] flex flex-col gap-1">
                            <div className="text-gray-900 text-xl font-semibold mb-2">URGENT: Password Expiry Notification</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                                <span className="font-semibold text-gray-800">IT-Support</span> &lt;admin@akeb0no-secure.net&gt;
                            </div>
                            <div className="text-sm text-gray-500">To: Employee User</div>
                        </div>
                        <div className="p-6 text-gray-800 text-sm flex-1 bg-white overflow-hidden">
                            <p className="mb-4">Dear Employee,</p>
                            <p className="mb-4">Your Akebono corporate network password is set to expire in <strong>2 hours</strong>. Failure to update it immediately will result in a complete account lockout and require IT unblocking.</p>
                            <p className="mb-6">Please securely log in and update your credentials immediately below:</p>
                            <div className="bg-blue-50 border border-blue-200 inline-block p-4 rounded mb-6">
                                <a href="#" className="underline text-[#0078d4] font-semibold text-base block">https://auth.akebono-secure-reset.com/login</a>
                            </div>
                            <p className="text-gray-500 text-xs">Regards,<br />Information Technology Administration Desk<br />Akebono Brake Astra Indonesia</p>
                        </div>
                    </div>
                ) : scene.uiType === 'desktop' ? (
                    <div className="absolute inset-0 bg-[#005a9e] flex flex-col">
                        <div className="flex-1 p-4 grid grid-cols-6 gap-4 content-start">
                            <div className="w-16 flex flex-col items-center gap-1 cursor-pointer">
                                <div className="w-10 h-10 bg-blue-300 rounded shadow flex items-center justify-center text-[#005a9e]"><Monitor className="w-6 h-6" /></div>
                                <span className="text-white text-xs drop-shadow-md text-center">My PC</span>
                            </div>
                            <div className="w-16 flex flex-col items-center gap-1 cursor-pointer">
                                <div className="w-10 h-10 bg-yellow-400 rounded shadow flex items-center justify-center text-white"><BookOpen className="w-6 h-6" /></div>
                                <span className="text-white text-xs drop-shadow-md text-center">Reports</span>
                            </div>
                            <div className="w-16 flex flex-col items-center gap-1 cursor-pointer">
                                <div className="w-10 h-10 bg-gray-200 rounded shadow border-l-[12px] border-red-500 flex items-center justify-center relative"><span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-500 bg-white px-0.5 border">EXE</span></div>
                                <span className="text-white text-xs drop-shadow-md text-center bg-blue-600/50 px-1 rounded truncate w-20">Salary_2024.pdf.exe</span>
                            </div>
                        </div>
                        <div className="h-10 bg-black/80 backdrop-blur border-t border-white/10 flex items-center px-2 z-10 w-full">
                            <div className="w-10 h-8 rounded bg-[#0078d4] mr-4 flex items-center justify-center text-white font-bold text-xs shadow-inner hover:bg-blue-600 cursor-pointer">Start</div>
                            <div className="text-white text-xs ml-auto pr-4">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-100 flex flex-col">
                        {/* Fake Web browser UI */}
                        <div className="h-10 bg-[#dee1e6] border-b border-[#cccccc] flex items-center px-4 gap-2 shrink-0">
                            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-[#ff5f56]" /><div className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><div className="w-3 h-3 rounded-full bg-[#27c93f]" /></div>
                            <div className="ml-4 flex-1 bg-white rounded-full text-xs px-4 py-1.5 text-red-600 font-mono shadow-sm flex items-center gap-2 border border-red-200">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">https://akeb0no-internal-login.net/auth/verify?token=1829f0</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-gray-800">
                            <div className="bg-white p-8 rounded-xl shadow-xl w-[400px] border border-gray-100 flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-white font-bold text-xl">AKE</span>
                                </div>
                                <h2 className="text-xl font-bold mb-6 text-center text-gray-800 w-full border-b pb-4">Employee Portal Login</h2>
                                <div className="space-y-4 w-full">
                                    <div>
                                        <input type="text" disabled className="w-full border border-gray-300 rounded-md mt-1 p-2.5 bg-gray-50 text-sm" placeholder="Enter NIK (e.g. 10001)" />
                                    </div>
                                    <div>
                                        <input type="password" disabled className="w-full border border-gray-300 rounded-md mt-1 p-2.5 bg-gray-50 text-sm" placeholder="Password" />
                                    </div>
                                    <button className="w-full bg-[#005a9e] text-white rounded-md p-2.5 font-bold opacity-70 cursor-not-allowed mt-2">Sign In securely</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {scene.targets?.map((t) => (
                    <motion.button
                        key={t.id}
                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 shadow-lg flex items-center justify-center pointer-events-auto transition-colors ${foundItems.includes(t.id) ? 'border-green-500 bg-green-500/20 text-green-600' : 'border-red-500/50 hover:border-red-500 bg-transparent text-transparent hover:text-red-500'}`}
                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                        onClick={() => handleClick(t)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {foundItems.includes(t.id) ? <CheckCircle className="w-6 h-6" /> : <MousePointer2 className="w-6 h-6" />}
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

// Terminal display
function TerminalDisplay({ scene, onCommand, timer, timerTotal }) {
    const [input, setInput] = useState('')
    const [logs, setLogs] = useState([{ type: 'sys', text: scene.promptText }])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const cmd = input.trim().toLowerCase()
        const correct = scene.correctCommand.toLowerCase()

        setLogs(prev => [...prev, { type: 'user', text: `> ${input} ` }])
        setInput('')

        if (cmd === correct) {
            setLogs(prev => [...prev, { type: 'success', text: 'ACCESS GRANTED / THREAT NEUTRALIZED' }])
            setTimeout(() => onCommand(true), 1500)
        } else {
            setLogs(prev => [...prev, { type: 'error', text: 'Command unrecognized or access denied.' }])
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto pointer-events-auto z-20">
            <div className="w-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl font-mono text-sm border flex flex-col h-[50vh] border-gray-700 ring-2 ring-black/50">
                <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-900 border-opacity-50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <TerminalIcon className="w-4 h-4" /> Security CLI - root@akebono
                    </div>
                    {timer > 0 && <div className="text-red-400 font-bold flex items-center gap-2">T-MINUS {timer}s</div>}
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono flex flex-col gap-1 text-green-400 pb-20">
                    {logs.map((L, i) => (
                        <div key={i} className={`${L.type === 'error' ? 'text-red-400' : L.type === 'sys' ? 'text-yellow-400 font-bold' : L.type === 'success' ? 'text-green-300 font-bold bg-green-900/40 p-1' : 'text-gray-300'} `}>
                            {L.text}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="p-2 bg-black border-t border-gray-800 flex items-center gap-2 mt-auto">
                    <span className="text-green-500 font-bold">root@sec~#</span>
                    <input
                        type="text"
                        autoFocus
                        autoComplete="off"
                        className="flex-1 bg-transparent text-gray-100 outline-none placeholder-gray-700"
                        placeholder="Type command..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                </form>
            </div>
        </div>
    )
}

export default function VNEnginePage() {
    const { chapterId } = useParams()
    const { user } = useAuth()
    const { awardXP, completeChapter, CHAPTERS, BACKGROUNDS: globalBackgrounds } = useGame()
    const navigate = useNavigate()

    const chapterData = CHAPTERS.find(c => c.id === parseInt(chapterId))
    const [sceneId, setSceneId] = useState(null)
    const [choiceResult, setChoiceResult] = useState(null) // { correct, consequence, lesson, xp }
    const [timer, setTimer] = useState(null)
    const [timerTotal, setTimerTotal] = useState(15)
    const [xpTotal, setXpTotal] = useState(0)
    const [wrongChoices, setWrongChoices] = useState(0)
    const [mute, setMute] = useState(false)
    const [showHud, setShowHud] = useState(true)
    const [gameOver, setGameOver] = useState(false)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Wait for chapters to load from context if they are still the default ones
        if (CHAPTERS.length > 0) {
            setLoading(false)
        }

        if (!sceneId && chapterData?.scenes?.length > 0) {
            setSceneId(chapterData.scenes[0].id)
        }
    }, [CHAPTERS, chapterData, sceneId])

    const currentScene = chapterData?.scenes?.find(s => s.id === sceneId)
    const playerName = user?.name?.split(' ')[0] || 'Recruit'

    const getText = (text) => text?.replace(/\{\{playerName\}\}/g, playerName) || ''

    const { displayed: dialogueText, done: dialogueDone, skip: skipDialogue } = useTypewriter(
        currentScene?.type === 'dialogue' ? getText(currentScene.text) : '',
        25,
        currentScene?.type === 'dialogue'
    )

    // Timer handle for choice, investigate, and terminal scenes
    useEffect(() => {
        if (!currentScene?.timer || choiceResult) return;
        const typesWithTimer = ['choice', 'investigate', 'terminal'];

        if (typesWithTimer.includes(currentScene.type)) {
            setTimer(currentScene.timer)
            setTimerTotal(currentScene.timer)
            const interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval)
                        if (currentScene.type === 'choice') {
                            handleChoice(currentScene.choices[0], true)
                        } else if (currentScene.type === 'investigate') {
                            handleInvestigate(false, true)
                        } else if (currentScene.type === 'terminal') {
                            handleTerminal(false, true)
                        }
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [sceneId, choiceResult])

    const handleInvestigate = useCallback((success, timedOut = false) => {
        setTimer(null)
        if (success) {
            if (currentScene.xpReward) {
                awardXP(currentScene.xpReward, `Chapter ${chapterId} spot the phish`)
                setXpTotal(prev => prev + currentScene.xpReward)
            }
            setSceneId(currentScene.next)
        } else {
            setWrongChoices(prev => prev + 1)
            setChoiceResult({
                correct: false,
                consequence: timedOut ? "Time ran out before you could spot all the threats!" : "Investigation failed.",
                lesson: "Always inspect URLs carefully and scrutinize unexpected attachments before clicking.",
                xp: 0,
                next: currentScene.next
            })
        }
    }, [currentScene, chapterId, awardXP])

    const handleTerminal = useCallback((success, timedOut = false) => {
        setTimer(null)
        if (success) {
            if (currentScene.xpReward) {
                awardXP(currentScene.xpReward, `Chapter ${chapterId} terminal defense`)
                setXpTotal(prev => prev + currentScene.xpReward)
            }
            setSceneId(currentScene.successNext || currentScene.failNext)
        } else {
            setWrongChoices(prev => prev + 1)
            setChoiceResult({
                correct: false,
                consequence: timedOut ? "Network breached. Your terminal timed out." : "Invalid commands entered. System compromised.",
                lesson: "In emergency scenarios, speed and accurate command execution are critical.",
                xp: 0,
                next: currentScene.failNext
            })
        }
    }, [currentScene, chapterId, awardXP])

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <div className="text-center">
                    <motion.div
                        className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                    <p className="text-white text-xl">Loading Mission...</p>
                </div>
            </div>
        )
    }

    if (!chapterData || !chapterData.scenes || chapterData.scenes.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <div className="text-center max-w-md p-8 glass-card">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Chapter {chapterId} Not Ready</h2>
                    <p className="text-white/60 mb-6"> This chapter is currently under development or has no playable scenes yet. Please check back later!</p>
                    <button onClick={() => navigate('/chapters')} className="btn-primary w-full">← Back to Mission Select</button>
                </div>
            </div>
        )
    }

    const localBg = BACKGROUNDS[currentScene?.background] || BACKGROUNDS.office
    const customBg = globalBackgrounds?.find(b => b.key_name === currentScene?.background)

    const bgLabel = customBg ? customBg.name : localBg.label
    const bgGradient = customBg ? '' : localBg.gradient
    const bgStyle = customBg && customBg.image_url
        ? { backgroundImage: `url(${customBg.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: localBg.pattern }

    return (
        <div className="fixed inset-0 bg-dark overflow-hidden flex flex-col">
            {/* Background */}
            <div
                className={`absolute inset-0 transition-all duration-1000 ${bgGradient ? `bg-gradient-to-b ${bgGradient}` : ''}`}
                style={bgStyle}
            />

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
                            {bgLabel}
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
                    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-0 overflow-hidden">
                        {/* Left character */}
                        <AnimatePresence mode="popLayout">
                            {currentScene.position === 'left' && (
                                <motion.div key={currentScene.character + '_left'} className="absolute bottom-24 md:bottom-32 left-4 md:left-16 pointer-events-auto flex items-end">
                                    <CharacterSprite
                                        character={currentScene.character}
                                        expression={currentScene.expression}
                                        position="left"
                                        isActive={true} /* Only 1 char speaks in single char scenes */
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Right character */}
                        <AnimatePresence mode="popLayout">
                            {currentScene.position === 'right' && (
                                <motion.div key={currentScene.character + '_right'} className="absolute bottom-24 md:bottom-32 right-4 md:right-16 pointer-events-auto flex items-end">
                                    <CharacterSprite
                                        character={currentScene.character}
                                        expression={currentScene.expression}
                                        position="right"
                                        isActive={true}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Visual Novel Retro Overlays (Covers background + characters to blend them) */}
                <div className="absolute inset-0 scanlines opacity-25 pointer-events-none z-0" />
                <div className="absolute inset-0 pointer-events-none z-0" style={{
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.8) 100%)'
                }} />

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

                {/* Investigate scene */}
                {currentScene?.type === 'investigate' && !choiceResult && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <InvestigateDisplay
                            scene={currentScene}
                            onFound={(success) => handleInvestigate(success)}
                            timer={timer}
                            timerTotal={timerTotal}
                        />
                    </div>
                )}

                {/* Terminal scene */}
                {currentScene?.type === 'terminal' && !choiceResult && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <TerminalDisplay
                            scene={currentScene}
                            onCommand={(success) => handleTerminal(success)}
                            timer={timer}
                            timerTotal={timerTotal}
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
                            <h2 className={`text - 2xl font - bold font - display mb - 3 ${currentScene.ending === 'good' ? 'text-accent' : 'text-primary'} `}>
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
