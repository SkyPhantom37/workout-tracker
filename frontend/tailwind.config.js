/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface:        '#111111',
        'surface-2':    '#1a1a1a',
        blood:          '#8b0000',
        'blood-bright': '#cc0000',
        bone:           '#e8e0d0',
        ash:            '#555555',
      },
      fontFamily: {
        display: ['"UnifrakturMaguntia"', 'cursive'],
        brutal:  ['"Share Tech Mono"', 'monospace'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-red':    '0 0 0 1px rgba(139,0,0,0.9), 0 0 18px rgba(139,0,0,0.45)',
        'glow-red-sm': '0 0 0 1px rgba(139,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
