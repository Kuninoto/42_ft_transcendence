interface IThemes {
	[name: string]: {
		background: string
		paddle: string
		ball: string
	}
}

const HEX_WHITE: string = '#FFFFFF';
const HEX_BLACK: string = '#000000';

export const themes: IThemes = {
	default: {
		background: 'default.png',
		paddle: 'white.png',
		ball: HEX_WHITE,
	},
	fortyTwo: {
		background: 'forty_two.jpeg',
		paddle: 'black.jpeg',
		ball: HEX_BLACK,
	},
	candyland: {
		background: 'candyland.jpg',
		paddle: 'black.jpeg',
		ball: HEX_BLACK,
	},
	halloween: {
		background: 'halloween.jpg',
		paddle: 'white.png',
		ball: HEX_WHITE,
	},
	neon: {
		background: 'neon_city.jpg',
		paddle: 'white.jpeg',
		ball: HEX_WHITE,
	},
	underwater: {
		background: 'underwater.jpg',
		paddle: 'white.jpeg',
		ball: HEX_WHITE,
	},
	space: {
		background: 'space.jpg',
		paddle: 'white.jpeg',
		ball: HEX_WHITE,
	},
	//safari: {
	//	background: 'safari.png',
	//	paddle: '',
	//},
	// miki: {
	// 	background: 'miki.png',
	// 	paddle: 'white.png',
	// },
	// monke: {
	// 	background: 'monke.png',
	// 	paddle: 'monke.jpeg',
	// },
}

export const amount: number = Object.keys(themes).length
