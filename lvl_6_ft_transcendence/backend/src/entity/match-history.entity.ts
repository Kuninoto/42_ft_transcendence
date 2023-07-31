import {
  PrimaryGeneratedColumn,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { GameInfo } from './game.entity';

@Entity('match-history')
export class MatchHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @OneToMany(() => GameInfo, (GameInfo) => GameInfo.id)
  game_history: GameInfo;

  @OneToOne(() => User, (user) => user.user_record)
  @JoinColumn()
  user: User;
}
