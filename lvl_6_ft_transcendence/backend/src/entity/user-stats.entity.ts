import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user-stats')
export class UserStats {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @OneToOne(() => User, (user) => user.user_stats, { cascade: true })
  @JoinColumn()
  user: User;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
  })
  wins: number;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
  })
  losses: number;

  @ApiProperty()
  @Column({ type: 'double precision', default: null, nullable: true })
  win_rate: number;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
  })
  matches_played: number;
}
