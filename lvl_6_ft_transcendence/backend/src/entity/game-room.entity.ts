import { PrimaryGeneratedColumn, PrimaryColumn, Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GameType } from 'src/common/types/game-type.enum';

@Entity('game-room')
export class GameRoom {
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
  @Column({ type: 'smallint', default: 0 })
  left_player_score: number;

  @ApiProperty()
  @Column({ type: 'smallint', default: 0 })
  right_player_score: number;
}
