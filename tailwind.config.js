/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        ink2: '#27272A',
        surface: '#FAFAF9',
        surface2: '#F4F4F5',
        border: '#E4E4E7',
        border2: '#D4D4D8',
        muted: '#52525B',
        muted2: '#71717A',
        muted3: '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter Tight', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
        elevated: '0 12px 48px -16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
