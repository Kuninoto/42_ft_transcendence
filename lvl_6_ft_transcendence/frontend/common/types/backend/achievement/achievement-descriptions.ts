import { Achievements } from './achievements.enum'

export const AchievementDescriptions: Record<Achievements, string> = {
	[Achievements.BEGINNERS_TRIUMPH]: 'First taste of victory!',
	[Achievements.BREAKING_THE_PADDLE_BOND]: "It's not you, It's me... ",
	[Achievements.DECLINED_TOMORROW_BUDDIES]: 'Declined today, buddies tomorrow?',
	[Achievements.FIRST_BUDDY]: 'I thought friends was a myth',
	[Achievements.FIRST_SETBACK]: 'Maybe this is not that easy...',
	[Achievements.FRIENDLY]: "I'm getting good at this friend thing...",
	[Achievements.NEW_PONG_FIGHTER]: "I'm the newest pongfighter, let's FIGHT!",
	[Achievements.PONG_MASTER]: 'My name is Pong, James Pong',
	[Achievements.PONGFIGHT_MAESTRO]:
		"You've participated in the code orchestra, danced a cha-cha with bugs, and composed a masterpiece of pixelated harmony!",
	[Achievements.UNEXPECTED_VICTORY]: "You won, but we know it wasn't on 11",
}
