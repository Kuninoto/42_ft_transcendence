import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './index';

@Entity('user_stats')
export class UserStats {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    default: 0,
    type: 'bigint',
  })
  losses: number;

  @ApiProperty()
  @Column({
    default: 0,
    type: 'bigint',
  })
  matches_played: number;

  @ApiProperty()
  @OneToOne(() => User, (user) => user.user_stats, { cascade: true })
  @JoinColumn()
  user: User;

  @ApiProperty()
  @Column({ default: null, nullable: true, type: 'double precision' })
  win_rate: number;

  @ApiProperty()
  @Column({
    default: 0,
    type: 'bigint',
  })
  wins: number;
}
