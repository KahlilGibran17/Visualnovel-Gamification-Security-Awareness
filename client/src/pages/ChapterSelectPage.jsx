import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, PlayCircle, BookOpen, MapPin, Sparkles, MailWarning, ShieldCheck, Circle } from 'lucide-react'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'

const WORLDS = {
    'Office Lobby': { id: 'office', bg: 'bg-slate-950', lightBg: 'bg-slate-100', theme: 'office' },
    'Workstation': { id: 'desk', bg: 'bg-[#0a0f24]', lightBg: 'bg-blue-50', theme: 'desk' },
    'Elevator': { id: 'elevator', bg: 'bg-zinc-950', lightBg: 'bg-zinc-100', theme: 'elevator' },
    'IT Room': { id: 'it', bg: 'bg-emerald-950', lightBg: 'bg-emerald-50', theme: 'server' },
    'Server Room': { id: 'server', bg: 'bg-teal-950', lightBg: 'bg-teal-50', theme: 'server' },
    'Data Center': { id: 'datacenter', bg: 'bg-[#1a0505]', lightBg: 'bg-red-50', theme: 'factory' }
}

function getBackgroundClass(location, isLight) {
    const fallback = isLight ? 'bg-slate-50' : 'bg-[#0f172a]'
    if (!location) return fallback
    for (const [key, val] of Object.entries(WORLDS)) {
        if (location.includes(key)) return isLight ? val.lightBg : val.bg
    }
    return fallback
}

const getPos = (idx, total) => {
    // If there's only one node, center it
    if (total <= 1) return { x: 50, y: 50 };

    // Start from top (8%) and go down to bottom (92%) for padding
    const y = 8 + (idx / (total - 1)) * 84;
    
    // Weave X coordinates smoothly
    let x = 50;
    if (idx !== 0 && idx !== total - 1) {
        // Controlled zig-zag: alternate between 30% and 70%
        x = idx % 2 === 1 ? 70 : 30;
    }
    return { x, y };
}

const generatePath = (nodes, toIdx = nodes.length - 1) => {
    if (nodes.length === 0) return '';
    let d = '';
    for (let i = 0; i <= toIdx; i++) {
        const { x, y } = getPos(i, nodes.length);
        if (i === 0) {
            d += `M ${x} ${y}`;
        } else {
            const prev = getPos(i - 1, nodes.length);
            const midY = (prev.y + y) / 2;
            d += ` C ${prev.x} ${midY}, ${x} ${midY}, ${x} ${y}`;
        }
    }
    return d;
}

export default function ChapterSelectPage() {
    const { ROADMAP_NODES, chapterProgress, chapters = [], loadProgress } = useGame()
    const { theme } = Layout.useTheme ? Layout.useTheme() : { theme: 'dark' } // Fallback if context not directly available
    // Actually useTheme is exported from contexts
    const navigate = useNavigate()
    const [activeWorld, setActiveWorld] = useState('bg-[#0f172a]')
    const [hoveredNode, setHoveredNode] = useState(null)

    useEffect(() => {
        if (loadProgress) {
            loadProgress()
        }
    }, [loadProgress])

    const isElearningCompleted = (chapterId) => {
        if (chapterId) {
            return chapterProgress[chapterId]?.completed === true
        }
        const elearningChapters = chapters.filter(c => c.type === 'E-Learning')
        if (elearningChapters.length === 0) return true
        return elearningChapters.some(c => chapterProgress[c.id]?.completed === true)
    }

    const getProgressId = (node) => {
        if (node.node_type === 'E-Learning') return node.chapter_id || 0
        if (node.node_type === 'Final') return 999
        return node.chapter_id
    }

    const isNodeLocked = (idx, mappedNodes) => {
        if (idx === 0) return false
        const prevNode = mappedNodes[idx - 1]
        return !prevNode.isCompleted
    }

    const renderIcon = (iconName) => {
        if (iconName === 'BookOpen') return <BookOpen className="w-8 h-8" />
        if (iconName === 'MailWarning') return <MailWarning className="w-8 h-8" />
        if (iconName === 'ShieldCheck') return <ShieldCheck className="w-8 h-8" />
        if (iconName === 'Circle') return <Circle className="w-8 h-8" />
        // Fallback for emojis
        return <span className="text-3xl drop-shadow-md">{iconName || '🔘'}</span>
    }

    // Map DB roadmap nodes to UI nodes
    const rawNodes = (ROADMAP_NODES || []).map(node => {
        const pId = getProgressId(node)
        return {
            ...node,
            pId,
            isCompleted: node.node_type === 'E-Learning'
                ? isElearningCompleted(node.chapter_id)
                : chapterProgress[pId]?.completed === true,
            xpEarned: chapterProgress[pId]?.xpEarned || 0,
            isElearning: node.node_type === 'E-Learning',
            action: () => {
                if (node.node_type === 'E-Learning') {
                    if (node.chapter_id) {
                        navigate(`/elearning?chapterId=${node.chapter_id}`)
                    } else {
                        navigate('/elearning')
                    }
                } else if (node.node_type === 'Game' && node.chapter_id) {
                    navigate(`/play/${node.chapter_id}`)
                }
            }
        }
    })

    const nodes = rawNodes.map((n, idx) => ({
        ...n,
        icon: renderIcon(n.icon),
        isLocked: isNodeLocked(idx, rawNodes)
    }))

    // Find highest unlocked index to draw the active path
    let highestUnlockedIdx = 0;
    for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i].isLocked) {
            highestUnlockedIdx = i;
        }
    }

    useEffect(() => {
        const latestUnlocked = nodes[highestUnlockedIdx]
        const isLight = document.documentElement.getAttribute('data-theme') === 'light'
        if (latestUnlocked?.location) {
            setActiveWorld(getBackgroundClass(latestUnlocked.location, isLight))
        } else {
            setActiveWorld(isLight ? 'bg-slate-50' : 'bg-[#0f172a]')
        }
    }, [highestUnlockedIdx, nodes])

    // Generate paths
    const pathBg = generatePath(nodes)
    const pathActive = generatePath(nodes, highestUnlockedIdx)

    return (
        <Layout>
            <div className={`min-h-[calc(100vh-64px)] transition-colors duration-1000 ${activeWorld} relative overflow-hidden pb-10`}>
                {/* Visual Ambient Background */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 bg-center mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/80 pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none" />

                <div className="relative z-10 p-4 max-w-5xl mx-auto flex flex-col items-center">
                    <motion.div className="text-center mt-6 mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl md:text-5xl font-black font-display text-main mb-3 tracking-wide drop-shadow-lg flex items-center justify-center gap-3">
                            <Sparkles className="text-accent w-8 h-8" />
                            Peta Misi Utama
                        </h1>
                        <p className="text-muted max-w-xl mx-auto text-sm md:text-base mb-2 font-medium">Jadilah Pahlawan Siber AAIJ! Temukan semua kejanggalan sebelum terlambat dan amankan aset perusahaan dari serangan siber.</p>
                        <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                            🏆 Top 3 Mendapatkan Reward Eksklusif
                        </div>
                        <p className="text-accent text-sm font-bold animate-pulse">👇 Ikuti alur dari atas ke bawah</p>
                    </motion.div>

                    {/* Roadmap Map Container */}
                    <div id="roadmap-container" className="relative w-full max-w-2xl mx-auto" style={{ height: `${Math.max(800, nodes.length * 200)}px` }}>
                        
                        {/* SVG Paths */}
                        <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Background road track */}
                            <path 
                                d={pathBg} 
                                stroke="rgba(255, 255, 255, 0.1)" 
                                strokeWidth="16" 
                                fill="none" 
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            {/* Active solid path */}
                            <motion.path 
                                d={pathActive} 
                                stroke="#FFD60A" 
                                strokeWidth="4" 
                                fill="none" 
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node, i) => {
                            const { x, y } = getPos(i, nodes.length)
                            const isCurrent = i === highestUnlockedIdx
                            
                            // Determine card placement based on X
                            let cardClass = ''
                            if (x < 50) cardClass = 'left-full ml-6'
                            else if (x > 50) cardClass = 'right-full mr-6'
                            else cardClass = i === 0 ? 'top-full mt-6 -translate-x-1/2 left-1/2' : 'bottom-full mb-6 -translate-x-1/2 left-1/2'

                            const statusColor = node.isCompleted ? 'border-accent bg-card-bg text-accent' : node.isLocked ? 'border-card-border bg-card-bg text-dim' : 'border-primary bg-primary/20 text-main'
                            const glow = node.isLocked ? '' : node.isCompleted ? 'shadow-[0_0_30px_rgba(255,214,10,0.4)]' : 'shadow-[0_0_40px_rgba(230,57,70,0.6)] animate-pulse-slow'
                            
                            return (
                                <div 
                                    key={node.id} 
                                    id={i === 0 ? 'node-0' : `node-${i}`}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center group"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                    onMouseEnter={() => setHoveredNode(i)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                >
                                    {/* The Node Checkpoint */}
                                    <motion.div 
                                        onClick={() => !node.isLocked && node.action()}
                                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md ${statusColor} ${glow} ${node.isLocked ? 'opacity-50' : 'hover:scale-110'}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.15, type: 'spring' }}
                                    >
                                        {node.isLocked ? <Lock className="w-6 h-6 md:w-8 md:h-8 text-white/20" /> : node.icon}
                                        
                                        {/* Current Node Indicator (Pin Drop) */}
                                        {isCurrent && (
                                            <div className="absolute -top-3 right-0">
                                                <span className="relative flex h-4 w-4">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-dark"></span>
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Start Here Tooltip for First Level */}
                                    {i === 0 && !node.isCompleted && (
                                        <div className="absolute -left-32 top-1/2 -translate-y-1/2 bg-accent text-dark font-black px-4 py-2 rounded-xl text-sm animate-bounce shadow-[0_0_20px_rgba(255,214,10,0.5)] z-50 whitespace-nowrap after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-2 after:border-y-8 after:border-y-transparent after:border-l-8 after:border-l-accent">
                                            Mulai di Sini!
                                        </div>
                                    )}

                                    {/* Next Level Tooltip */}
                                    {i > 0 && isCurrent && (
                                        <div className="absolute -right-32 top-1/2 -translate-y-1/2 bg-primary text-white font-bold px-3 py-1.5 rounded-lg text-xs animate-pulse shadow-lg z-50 whitespace-nowrap after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-2 after:border-y-8 after:border-y-transparent after:border-r-8 after:border-r-primary hidden md:block">
                                            Selesaikan ini terlebih dahulu
                                        </div>
                                    )}

                                    {/* The Detail Card */}
                                    <AnimatePresence>
                                        {(hoveredNode === i || isCurrent || (window.innerWidth >= 768)) && (
                                            <motion.div 
                                                className={`absolute ${cardClass} w-64 p-4 rounded-2xl border backdrop-blur-xl transition-all z-30 ${node.isLocked ? 'bg-card-bg/80 border-card-border' : 'bg-card-bg/95 border-card-border shadow-2xl'}`}
                                                initial={{ opacity: 0, scale: 0.9, x: x < 50 ? -20 : x > 50 ? 20 : 0, y: x === 50 ? (i===0 ? -20 : 20) : 0 }}
                                                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                 <div className="flex items-center justify-between gap-2 mb-2">
                                                     <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-dim">
                                                         <MapPin className="w-3 h-3 text-dim/60" /> {node.location}
                                                     </div>
                                                     <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded border select-none ${
                                                         node.isCompleted ? 'text-accent border-accent/25 bg-accent/5' :
                                                         !node.isLocked ? 'text-primary border-primary/25 bg-primary/5' : 'text-dim border-white/5'
                                                     }`}>
                                                         STEP {i + 1}
                                                     </span>
                                                 </div>
                                                 <h3 className={`text-lg font-black font-display leading-tight ${node.isLocked ? 'text-dim' : 'text-main'}`}>{node.title}</h3>
                                                 <p className="text-xs text-muted leading-relaxed mt-1 mb-2">{node.subtitle}</p>
                                                
                                                {/* Visual Flow Steps with Numbers */}
                                                <div className="flex items-center gap-1 mb-3 select-none flex-wrap">
                                                    {node.isElearning ? (
                                                        <>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-sky-400/20 text-sky-400 border border-sky-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">1</span>
                                                                <span className="text-[8px] text-sky-400 font-bold">Pre-Test</span>
                                                            </div>
                                                            <span className="text-white/20 text-[6px]">➔</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-indigo-400/20 text-indigo-400 border border-indigo-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">2</span>
                                                                <span className="text-[8px] text-indigo-400 font-bold">Video</span>
                                                            </div>
                                                            <span className="text-white/20 text-[6px]">➔</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">3</span>
                                                                <span className="text-[8px] text-emerald-400 font-bold">Kuis</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">1</span>
                                                                <span className="text-[8px] text-amber-400 font-bold">Cerita VN</span>
                                                            </div>
                                                            <span className="text-white/20 text-[6px]">➔</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-rose-400/20 text-rose-400 border border-rose-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">2</span>
                                                                <span className="text-[8px] text-rose-400 font-bold">Game</span>
                                                            </div>
                                                            <span className="text-white/20 text-[6px]">➔</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="w-3 h-3 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center text-[7px] font-extrabold flex-shrink-0">3</span>
                                                                <span className="text-[8px] text-emerald-400 font-bold">Ending</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {node.isLocked ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-input-bg text-dim border border-card-border flex items-center gap-1 font-medium">
                                                            <Lock className="w-3 h-3" /> Terkunci
                                                        </span>
                                                    ) : node.isCompleted ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1 font-bold">
                                                            <CheckCircle className="w-3 h-3" /> Selesai
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => node.action()}
                                                            className="text-[10px] px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white flex items-center gap-1 font-bold shadow-lg transition-colors w-full justify-center"
                                                        >
                                                            <PlayCircle className="w-3 h-3" /> Klik untuk memulai
                                                        </button>
                                                    )}

                                                    {node.isCompleted && node.xpEarned > 0 && (
                                                        <span className="ml-auto text-accent font-black text-xs">+{node.xpEarned} XP</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
