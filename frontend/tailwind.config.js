/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        app: '#F6F8FB',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F9FAFB',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D7DCE3',
        },
        brand: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#ECFDF5',
        },
        solar: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        wind: {
          DEFAULT: '#06B6D4',
          light: '#ECFEFF',
        },
        battery: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
        },
        diesel: {
          DEFAULT: '#64748B',
          light: '#F1F5F9',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
      },
    },
  },
  plugins: [],
};
