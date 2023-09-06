import { Achievements } from './achievements.enum';

export const AchievementDescriptions: Record<Achievements, string> = {
  [Achievements.PONGFIGHT_MAESTRO]:
    "You've participated in the code orchestra, danced a cha-cha with bugs, and composed a masterpiece of pixelated harmony!",
  [Achievements.NEW_PONG_FIGHTER]: "I'm the newest pongfighter, let's FIGHT!",
  [Achievements.BEGINNERS_TRIUMPH]: 'First taste of victory!',
  [Achievements.UNEXPECTED_VICTORY]: "You won, but we know it wasn't on 11",
  [Achievements.GOOFY_QUITTER]: "I never lose if I always quit... wait, do I!?",
  [Achievements.FIRST_SETBACK]: 'Maybe this is not that easy...',
  [Achievements.FIRST_BUDDY]: 'I thought friends was a myth',
  [Achievements.DECLINED_TOMORROW_BUDDIES]: 'Declined today, buddies tomorrow?',
  [Achievements.BREAKING_THE_PADDLE_BOND]: "It's not you, it's me... ",
  [Achievements.PONG_MASTER]: 'My name is Pong, James Pong',
  [Achievements.THE_STYLISH_ONE]: "Embracing the spirit of 'losing like a pro', you've weathered 5 defeats with style",
  [Achievements.FRIENDLY]: "I'm getting good at this friend thing...",
};
