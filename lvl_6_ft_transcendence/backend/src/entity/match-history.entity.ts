import {
  PrimaryGeneratedColumn,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { GameResult } from './game-result.entity';

@Entity('match-history')
export class MatchHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn()
  user: User;

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult) => gameResult.id)
  @JoinColumn()
  game_results: GameResult[];
}
