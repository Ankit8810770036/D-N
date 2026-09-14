/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                brand: {
                    green: '#059669',
                    light: '#10b981',
                    gold: '#f59e0b',
                    dark: '#064e3b',
                    cream: '#f8fafc',
                }
            },
            fontFamily: {
                sans: ['Inter', 'Outfit', 'sans-serif'],
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.5rem',
            },
            boxShadow: {
                card: '0 4px 24px rgba(0,0,0,0.08)',
                glow: '0 0 32px rgba(22, 163, 74, 0.18)',
            },
        },
    },
    plugins: [],
}
