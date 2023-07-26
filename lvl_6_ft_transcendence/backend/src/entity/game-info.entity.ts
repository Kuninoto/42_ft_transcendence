import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { GameType } from 'src/common/types/game-type.enum';

@Entity('game-info')
export class GameInfo {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @Column()
  game_type: GameType;

  @ApiProperty()
  @OneToOne(() => User)
  @JoinColumn()
  winner: User;

  @ApiProperty()
  @Column({ type: 'smallint' })
  winner_points: number;

  @ApiProperty()
  @OneToOne(() => User)
  @JoinColumn()
  loser: User;

  @ApiProperty()
  @Column({ type: 'smallint' })
  loser_points: number;
}
