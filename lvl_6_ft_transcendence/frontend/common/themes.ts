interface IThemes {
	[name: string]: {
		background: string
		paddle: string
		// ball: string
	}
}

export const themes: IThemes = {
	default: {
		background: 'default.png',
		paddle: 'white.png',
	},
	fortyTwo: {
		background: 'forty_two.jpg',
		paddle: 'black.jpeg',
	},
	candyland: {
		background: 'candyland.jpg',
		paddle: 'black.jpeg',
	},
	halloween: {
		background: 'halloween.jpg',
		paddle: 'white.jpeg',
	},
	neon: {
		background: 'neon_city.jpg',
		paddle: 'white.jpeg',
	},
	underwater: {
		background: 'underwater.jpg',
		paddle: 'white.jpeg',
	},
	space: {
		background: 'space.jpg',
		paddle: 'white.jpeg',
	},
	//safari: {
	//	background: 'safari.png',
	//	paddle: '',
	//},
	// mikao: {
	// 	background: 'mikao.jpeg',
	// 	paddle: 'black.jpeg',
	// },
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
