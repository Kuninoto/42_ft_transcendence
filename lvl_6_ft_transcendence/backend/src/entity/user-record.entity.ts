import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user-record')
export class UserRecord {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

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
  @Column({
    type: 'bigint',
    default: 0,
  })
  win_rate: number;

  @ApiProperty()
  @Column({
    type: 'bigint',
    default: 0,
  })
  total_matches_played: number;

  @ApiProperty()
  @OneToOne(() => User, (user) => user.user_record)
  @JoinColumn()
  user: User;
}
