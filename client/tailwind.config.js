/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#E63946',
                    dark: '#c1121f',
                    light: '#ff6b6b',
                },
                accent: {
                    DEFAULT: '#FFD60A',
                    dark: '#e5be00',
                    light: '#ffe566',
                },
                dark: {
                    DEFAULT: '#1A1A2E',
                    card: '#16213E',
                    surface: '#0F3460',
                    lighter: '#1e1e3a',
                },
                glass: 'rgba(255,255,255,0.05)',
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'sans-serif'],
                display: ['Poppins', 'Inter', 'sans-serif'],
            },
            backgroundImage: {
                'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                'hero-gradient': 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
                'card-gradient': 'linear-gradient(135deg, rgba(22,33,62,0.9), rgba(15,52,96,0.7))',
                'primary-gradient': 'linear-gradient(135deg, #E63946, #c1121f)',
                'gold-gradient': 'linear-gradient(135deg, #FFD700, #FFA500)',
                'silver-gradient': 'linear-gradient(135deg, #C0C0C0, #808080)',
                'bronze-gradient': 'linear-gradient(135deg, #CD7F32, #8B4513)',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'typewriter': 'typewriter 2s steps(40) 1s forwards',
                'slide-up': 'slide-up 0.5s ease-out forwards',
                'glitch': 'glitch 1s linear infinite',
                'crown-bounce': 'crown-bounce 1s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(230,57,70,0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(230,57,70,0.9)' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                glitch: {
                    '0%': { textShadow: '2px 0 #E63946, -2px 0 #FFD60A' },
                    '25%': { textShadow: '-2px 0 #E63946, 2px 0 #FFD60A' },
                    '50%': { textShadow: '2px 2px #E63946, -2px -2px #FFD60A' },
                    '75%': { textShadow: '-2px 2px #E63946, 2px -2px #FFD60A' },
                    '100%': { textShadow: '2px 0 #E63946, -2px 0 #FFD60A' },
                },
                'crown-bounce': {
                    '0%, 100%': { transform: 'translateY(0) rotate(-5deg)' },
                    '50%': { transform: 'translateY(-5px) rotate(5deg)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
