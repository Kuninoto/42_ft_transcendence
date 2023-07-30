import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
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
  @PrimaryColumn()
  room_id: string;

  @ApiProperty()
  @Column()
  game_type: GameType;

  @ApiProperty()
  @OneToOne(() => User)
  @JoinColumn()
  winner: User;

  @ApiProperty()
  @Column({ type: 'smallint', nullable: true })
  winner_score: number;

  @ApiProperty()
  @OneToOne(() => User)
  @JoinColumn()
  loser: User;

  @ApiProperty()
  @Column({ type: 'smallint', nullable: true })
  loser_score: number;
}
