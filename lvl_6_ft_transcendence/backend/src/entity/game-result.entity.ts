import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GameType } from 'src/common/types/game-type.enum';

@Entity('game-result')
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
  @Column({ type: 'varchar', length: 10, nullable: false })
  winner_name: string;

  @ApiProperty()
  @Column({ type: 'smallint' })
  winner_score: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10, nullable: false })
  loser_name: string;

  @ApiProperty()
  @Column({ type: 'smallint' })
  loser_score: number;

  /* @ManyToOne(() => MatchHistory, (matchHistory) => matchHistory.game_results)
  @JoinColumn()
  winner_match_history: MatchHistory; */

  /* @ManyToOne(() => MatchHistory, (matchHistory) => matchHistory.game_results)
  @JoinColumn()
  loser_match_history: MatchHistory; */
}
