import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

export enum ACHIEVEMENT {
  ONE_FRIEND = '',
  FIRST_WIN = '',
  // to a win streak
  // to a lose streak
}

@Entity('achievement')
export class Achievement {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  achievement: number;

  @ManyToOne(() => User)
  user: User;
}
