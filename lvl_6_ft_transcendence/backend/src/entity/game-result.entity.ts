import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameType } from 'types';
import { User } from './user.entity';

@Entity('game_result')
export class GameResult {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column()
  game_type: GameType;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  winner: User;

  @ApiProperty()
  @Column({ type: 'smallint' })
  winner_score: number;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  loser: User;

  @ApiProperty()
  @Column({ type: 'smallint' })
  loser_score: number;
}
