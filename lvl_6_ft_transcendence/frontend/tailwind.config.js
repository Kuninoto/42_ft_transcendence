/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	plugins: [require('tailwind-scrollbar')({ nocompatible: true })],
	theme: {
		extend: {
			animation: {
				blink: 'blink 1s infinite',
				ellipsis: 'ellipsis steps(4, end) 900ms infinite',
				horizontalBounce: 'horizontalBounce 1500ms infinite',
			},
			colors: {
				'primary-fushia': '#FB37FF',
				'primary-shoque': '#F32E7C',
			},
			keyframes: {
				blink: {
					'0%, 100%': {
						opacity: 1,
						visibility: 'visible',
					},
					'50%': {
						opacity: 0,
						visibility: 'hidden',
					},
				},
				ellipsis: {
					to: {
						width: '64px',
					},
				},
				horizontalBounce: {
					'0%, 100%': { transform: 'translateX(0)' },
					'50%': { transform: 'translateX(-10px)' },
				},
			},
		},
	},
}
