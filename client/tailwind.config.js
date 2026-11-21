/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F6F7F9',
        surface: '#FFFFFF',
        border: '#E4E7EC',
        primary: {
          DEFAULT: '#1E4FD6',
          hover: '#1A44B8',
          tint: '#EEF3FF',
        },
        text: {
          primary: '#101828',
          secondary: '#475467',
          muted: '#98A2B3',
        },
        income: {
          DEFAULT: '#12805C',
          tint: '#E7F6EF',
        },
        expense: {
          DEFAULT: '#D6403A',
          tint: '#FDEDEC',
        },
        warning: {
          DEFAULT: '#B7791F',
          tint: '#FFF6E0',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      spacing: {
        // 8px grid — extend multiples if needed; Tailwind's defaults cover most
      },
    },
  },
  plugins: [],
};
