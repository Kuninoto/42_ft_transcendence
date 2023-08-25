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
	//safari: {
	//	background: 'safari.png',
	//	paddle: '',
	//},
	mikao: {
		background: 'mikao.jpeg',
		paddle: 'black.jpeg',
	},
	miki: {
		background: 'miki.png',
		paddle: 'white.png',
	},
	monke: {
		background: 'monke.png',
		paddle: 'monke.jpeg',
	},
}

export const amount: number = Object.keys(themes).length
