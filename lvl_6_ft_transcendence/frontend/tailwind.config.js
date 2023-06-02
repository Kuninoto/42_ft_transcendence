/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
		animation: {
			horizontalBounce: 'horizontalBounce 1s infinite',
		},
		keyframes: {
			horizontalBounce: {
				'0%, 100%': { transform: 'translateX(0)' },
				'50%': { transform: 'translateX(-10px)' },
			},
		},
    },
  },
  plugins: [],
}
