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
				ellipsis: 'ellipsis steps(4, end) 900ms infinite',
			},
			colors: {
				'primary-fushia': '#FB37FF',
				'primary-shoque': '#F32E7C',
			},
			keyframes: {
				ellipsis: {
					to: {
						width: '64px',
					},
				},
			},
		},
	},
}
