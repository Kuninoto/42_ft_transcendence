import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FriendshipStatus } from 'types';
import { User } from './index';

@Entity('friendship')
export class Friendship {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  receiver: User;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  sender: User;

  @ApiProperty()
  @Column({
    default: FriendshipStatus.PENDING,
    nullable: false,
    type: 'varchar',
  })
  status: FriendshipStatus;
}
