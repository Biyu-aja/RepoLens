/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-main': '#0a0a0c',
                'bg-card': '#16161a',
                'bg-card-hover': '#1c1c21',
                primary: '#6366f1', // Indigo 500
                'primary-glow': 'rgba(99, 102, 241, 0.4)',
                secondary: '#a1a1aa',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#3b82f6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
