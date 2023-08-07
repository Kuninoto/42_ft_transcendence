import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

// Find a way to have an array of JSONs and identify them by the enum

export enum Achievements {
  // First Login
  NEW_PONG_FIGHTER = 'New Pong Fighter',
  // 1 Win
  BEGINNERS_TRIUMPH = 'Beginners Triumph',
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
  [Achievements.NEW_PONG_FIGHTER]: "I'm the newest pong fighter, let's FIGHT!",
  [Achievements.BEGINNERS_TRIUMPH]: 'First taste of victory!',
  [Achievements.FIRST_SETBACK]: 'Maybe this is not that easy...',
  [Achievements.FIRST_BUDDY]: 'I thought friends was a myth',
  [Achievements.DECLINED_TOMORROW_BUDDIES]: 'Declined today, buddies tomorrow?',
  [Achievements.BREAKING_THE_PADDLE_BOND]:
    "You've vanished from a friend's list like a stealthy pixel. Remember, digital hide-and-seek is just a game!",
  [Achievements.PONG_MASTER]: 'My name is pong, James Pong',
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
