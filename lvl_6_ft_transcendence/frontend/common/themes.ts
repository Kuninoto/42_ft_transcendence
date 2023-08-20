interface IThemes {
	[name: string]: {
		background: string
		paddle: string
	}
}

export const themes: IThemes = {
	anime: {
		background: 'anime.jpg',
		paddle: '',
	},
	default: {
		background: 'default.png',
		paddle: 'dev.png',
	},
	fortyTwo: {
		background: '42.jpg',
		paddle: '',
	},
	melo: {
		background: 'melo.jpg',
		paddle: '',
	},
	mikao: {
		background: 'mikao.jpeg',
		paddle: '',
	},
	miki: {
		background: 'miki.png',
		paddle: '',
	},
	monke: {
		background: 'monke.png',
		paddle: 'monke.jpeg',
	},
}

export const amount: number = Object.keys(themes).length

