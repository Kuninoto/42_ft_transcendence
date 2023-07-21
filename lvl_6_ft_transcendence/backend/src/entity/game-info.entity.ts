import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum GameType {
  LADDER = "ladder",
  ONEVSONE = "1v1",
};

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

  @OneToOne(() => User, (user) => user.user_record)
  @JoinColumn()
  user: User;
}
