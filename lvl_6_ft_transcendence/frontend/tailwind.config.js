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
				ellipsis: 'ellipsis steps(4, end) 900ms infinite'
			},
			keyframes: {
				ellipsis: {
					to: {
						width: "64px"
					}
				}
			},
		},
	}
}
