interface IThemes {
	[name: string]: {
		background: string
		ball: string
		paddle: string
	}
}

const HEX_WHITE: string = '#FFFFFF'
const HEX_BLACK: string = '#000000'

export const themes: IThemes = {
	candyland: {
		background: 'candyland.jpg',
		ball: HEX_BLACK,
		paddle: 'black.jpeg',
	},
	default: {
		background: 'default.png',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
	fortyTwo: {
		background: 'conhecesA42Porto.jpeg',
		ball: HEX_WHITE,
		paddle: 'white.jpeg',
	},
	//TODO just uncomment this for the actual background
	// fortyTwo: {
	// 	background: 'school_42.jpeg',
	// 	ball: HEX_WHITE,
	// 	paddle: 'white.jpeg',
	// },
	halloween: {
		background: 'halloween.jpg',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
	neon: {
		background: 'neon_city.jpg',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
	space: {
		background: 'space.jpg',
		ball: HEX_WHITE,
		paddle: 'white.png',
	},
	underwater: {
		background: 'underwater.jpg',
		ball: HEX_WHITE,
		paddle: 'white.png',
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
