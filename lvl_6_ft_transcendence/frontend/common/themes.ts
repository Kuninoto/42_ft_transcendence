interface IThemes {
	[name: string]: {
		background: string
		ball: string
		paddle: string
	}
}

const HEX_WHITE: string = '#FFFFFF'
const HEX_BLACK: string = '#000000'
const HEX_PINK: string = '#FF28B9'
const HEX_CYAN: string = '#1EB9BA'
const HEX_RED: string = '#D30000'

export const themes: IThemes = {
	default: {
		background: 'default.png',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
	fortyTwo: {
		background: 'forty_two_porto.jpg',
		ball: HEX_CYAN,
		paddle: 'white.png',
	},
	mario: {
		background: 'mario.jpg',
		ball: HEX_RED,
		paddle: 'white.png',
	},
	space: {
		background: 'space.jpg',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
}

export const amount: number = Object.keys(themes).length
