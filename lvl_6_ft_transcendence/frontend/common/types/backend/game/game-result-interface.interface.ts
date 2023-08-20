export interface GameResultInterface {
	loser: {
		avatar_url: string
		name: string
		score: number
		userId: number
	}
	winner: {
		avatar_url: string
		name: string
		score: number
		userId: number
	}
}
