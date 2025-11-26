/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          'oshi-dark': '#1a1a2e',
          'oshi-blue': '#0f3460',
          'oshi-purple': '#16213e',
          'oshi-bright-blue': '#0066ff',
          'oshi-accent': '#4d7cfe',
        },
        fontFamily: {
          sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        },
        backgroundImage: {
          'oshi-gradient': 'linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)',
        },
      },
    },
    plugins: [],
  }
  