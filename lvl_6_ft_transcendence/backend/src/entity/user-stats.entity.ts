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
    type: 'bigint',
    default: 0,
    nullable: false,
  })
  wins: number;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
    nullable: false,
  })
  losses: number;

  @ApiProperty()
  @Column({
    type: 'double precision',
    nullable: true,
    default: null,
  })
  win_rate: number;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
  })
  matches_played: number;

  @ApiProperty()
  @OneToOne(() => User, (user: User) => user.user_stats)
  @JoinColumn()
  user: User;
}
