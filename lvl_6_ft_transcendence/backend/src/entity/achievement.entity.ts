import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum Achievements {
  // Assigned only to the 3 developers
  PONGFIGHT_MAESTRO = 'PongFight Maestro',

  // First Login
  NEW_PONG_FIGHTER = 'New PongFighter',
  // 1 Win
  BEGINNERS_TRIUMPH = "Beginner's Triumph",
  // Win due to opponent disconnection
  UNEXPECTED_VICTORY = 'Unexpected Victory',
  // 1 Loss
  FIRST_SETBACK = 'First Setback',
  // 1 Friend
  FIRST_BUDDY = 'First Buddy',
  // 1 Sent friend request declined
  DECLINED_TOMORROW_BUDDIES = 'Declined Tomorrow Buddies',
  // 1 User unfriended someone
  BREAKING_THE_PADDLE_BOND = 'Breaking The Paddle Bond',
  // 5 Wins
  PONG_MASTER = 'Pong Master',
  // 5 Friends
  FRIENDLY = 'Friendly',
}

export const AchievementDescriptions: Record<Achievements, string> = {
  [Achievements.PONGFIGHT_MAESTRO]:
    "You've participated in the code orchestra, danced a cha-cha with bugs, and composed a masterpiece of pixelated harmony!",
  [Achievements.NEW_PONG_FIGHTER]: "I'm the newest pongfighter, let's FIGHT!",
  [Achievements.BEGINNERS_TRIUMPH]: 'First taste of victory!',
  [Achievements.UNEXPECTED_VICTORY]: "You won, but we know it wasn't on 11",
  [Achievements.FIRST_SETBACK]: 'Maybe this is not that easy...',
  [Achievements.FIRST_BUDDY]: 'I thought friends was a myth',
  [Achievements.DECLINED_TOMORROW_BUDDIES]: 'Declined today, buddies tomorrow?',
  [Achievements.BREAKING_THE_PADDLE_BOND]: "It's not you, It's me... ",
  [Achievements.PONG_MASTER]: 'My name is Pong, James Pong',
  [Achievements.FRIENDLY]: "I'm getting good at this friend thing...",
};

@Entity('achievement')
export class Achievement {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  achievement: Achievements;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
