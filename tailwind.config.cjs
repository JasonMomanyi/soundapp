/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        neon: {
          cyan: '#00FFFF',
          magenta: '#FF00FF',
          amber: '#FFC107',
          green: '#39FF14',
          pink: '#FF6EC7',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e1b2e',
          850: '#171525',
          900: '#0f0d1a',
          950: '#0a0912',
        },
      },
      spacing: {
        '18': '4.5rem',
        '36': '9rem',
        '72': '18rem',
      },
      animation: {
        breathe: 'breathe 3s ease-in-out infinite',
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
        step_active: 'step_active 0.15s ease-out',
        slide_up: 'slide_up 0.3s ease-out',
        fade_in: 'fade_in 0.4s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        pulse_glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        step_active: {
          '0%': { transform: 'scale(0.85)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slide_up: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fade_in: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};