import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { GamesInfo } from './game-info.entity';

@Entity('match-history')
export class MatchHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @OneToMany(() => GamesInfo, (gameInfo) => gameInfo.id)
  game_history: GamesInfo;

  @OneToOne(() => User, (user) => user.user_record)
  @JoinColumn()
  user: User;
}
