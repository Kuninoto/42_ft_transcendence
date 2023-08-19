import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FriendshipStatus } from '../../types/friendship/friendship-status.enum';
import { User } from './user.entity';

@Entity('friendship')
export class Friendship {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: FriendshipStatus.PENDING,
    nullable: false,
  })
  status: FriendshipStatus;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  sender: User;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  receiver: User;
}
