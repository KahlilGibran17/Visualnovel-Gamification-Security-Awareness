// Avatar component — renders colored avatar circles with initials or emoji
// avatarId 1-8 maps to different color combos
const AVATARS = [
    { bg: 'from-red-500 to-orange-500', emoji: '🧑‍💻', label: 'Programer' },
    { bg: 'from-blue-500 to-cyan-500', emoji: '👩‍💼', label: 'Eksekutif' },
    { bg: 'from-purple-500 to-pink-500', emoji: '🧑‍🔧', label: 'Insinyur' },
    { bg: 'from-green-500 to-emerald-500', emoji: '👩‍🔬', label: 'Analis' },
    { bg: 'from-yellow-500 to-amber-500', emoji: '🧑‍🏫', label: 'Pengajar' },
    { bg: 'from-indigo-500 to-violet-500', emoji: '👨‍🎨', label: 'Kreatif' },
    { bg: 'from-teal-500 to-cyan-500', emoji: '👩‍🚀', label: 'Pemimpin' },
    { bg: 'from-rose-500 to-red-500', emoji: '🧑‍⚕️', label: 'Dukungan' },
]

const SIZE_CLASSES = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-10 h-10 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
}

export default function AvatarDisplay({ avatarId = 1, size = 'md', showRing = false, ringColor = '#E63946' }) {
    const avatar = AVATARS[(avatarId - 1) % AVATARS.length] || AVATARS[0]
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

    return (
        <div
            className={`${sizeClass} rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center flex-shrink-0 relative`}
            style={showRing ? { boxShadow: `0 0 0 3px ${ringColor}` } : {}}
        >
            <span className="leading-none select-none">{avatar.emoji}</span>
        </div>
    )
}

export function AvatarPicker({ selected, onSelect }) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((av, idx) => (
                <button
                    key={idx + 1}
                    onClick={() => onSelect(idx + 1)}
                    className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${selected === idx + 1
                            ? 'border-accent bg-accent/10 scale-105'
                            : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${av.bg} flex items-center justify-center text-2xl`}>
                        {av.emoji}
                    </div>
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors">{av.label}</span>
                </button>
            ))}
        </div>
    )
}

export { AVATARS }
