import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Filter, PlayCircle, Clock, CheckCircle, Loader2 } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import axios from 'axios'

export default function ELearningPage() {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchModules = async () => {
            try {
                // Fetch only published modules for the employees
                const { data } = await axios.get('/api/elearning?status=Published')
                setCourses(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchModules()
    }, [])

    const filteredCourses = courses.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase())
    )

    const getColors = (idx) => {
        const colors = [
            { image: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
            { image: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
            { image: 'from-orange-500/20 to-yellow-500/20', border: 'border-orange-500/30' },
            { image: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
            { image: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
            { image: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' },
        ]
        return colors[idx % colors.length]
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto">
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold font-display text-white mb-2">🎓 E-Learning Modules</h1>
                    <p className="text-white/50">Read and learn these essential security materials before taking the chapter games to maximize your score.</p>
                </motion.div>

                {/* Filter / Search Bar */}
                <motion.div
                    className="flex flex-col md:flex-row gap-4 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-dark-card border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary focus:outline-none transition-colors placeholder:text-white/20"
                        />
                    </div>
                </motion.div>

                {loading ? (
                    <div className="py-20 flex justify-center items-center flex-col gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-white/50 text-sm">Loading learning materials...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="py-20 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">
                        {search ? 'No modules match your search.' : 'No modules have been published yet.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course, idx) => {
                            const { image, border } = getColors(idx)
                            const progress = 0 // Feature expansion later

                            return (
                                <motion.div
                                    key={course.id}
                                    className={`glass-card border ${border} overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className={`h-32 bg-gradient-to-br ${image} relative flex items-center justify-center p-6`}>
                                        <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                        <BookOpen className={`w-12 h-12 text-white/80 z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300`} />

                                        <div className="absolute top-3 right-3 bg-dark/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white/90 border border-white/10 flex items-center gap-1.5 z-10">
                                            <Clock className="w-3 h-3" />
                                            {course.duration}
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-accent">{course.category}</span>
                                            {progress === 100 && (
                                                <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-green-400/20">
                                                    <CheckCircle className="w-3 h-3" /> Done
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                                        <p className="text-white/40 text-sm mb-4">Level: {course.level}</p>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-white/50 mb-1">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${progress === 100
                                            ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                            : progress > 0
                                                ? 'bg-primary text-white hover:bg-primary-dark shadow-[0_0_15px_rgba(230,57,70,0.3)]'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}>
                                            <PlayCircle className="w-4 h-4" />
                                            {progress === 100 ? 'Review Material' : progress > 0 ? 'Continue Lesson' : 'Start Reading'}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}
