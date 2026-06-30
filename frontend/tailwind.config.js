/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070B18',
          card: '#12182D',
          primary: '#7C3AED',
          violet: '#A855F7',
          blue: '#00C2FF',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#94A3B8',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.25)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-violet': '0 0 20px rgba(168, 85, 247, 0.25)',
        'glow-blue': '0 0 20px rgba(0, 194, 255, 0.25)',
        'glow-mixed': '0 0 20px rgba(124, 58, 237, 0.15), 0 0 20px rgba(0, 194, 255, 0.15)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}
