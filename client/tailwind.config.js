/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core palette
        bg: {
          primary: '#080808',
          secondary: '#111111',
          tertiary: '#1a1a1a',
          card: '#161616',
          elevated: '#1e1e1e',
        },
        border: {
          subtle: '#232323',
          default: '#2d2d2d',
          strong: '#404040',
        },
        text: {
          primary: '#ffffff',
          secondary: '#c4c4c4',
          muted: '#787878',
          disabled: '#444',
        },
        accent: {
          white: '#ffffff',
          glow: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.04)',
        },
        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        // XP/gamification
        xp: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#e5e4e2',
          diamond: '#b9f2ff',
        },
        rarity: {
          common: '#9ca3af',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255,255,255,0.05)',
        'glow-sm': '0 0 10px rgba(255,255,255,0.04)',
        card: '0 4px 24px rgba(0,0,0,0.5)',
        modal: '0 8px 48px rgba(0,0,0,0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out',
        'pop-in': 'popIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(20px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 5px rgba(255,255,255,0.1)' }, '50%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' } },
        bounceDot: { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        popIn: { from: { transform: 'scale(0.8)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
