import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum FriendRequestStatus {
  DECLINED = "declined",
  ACCEPTED = "accepted",
  PENDING = "pending"
}

@Entity('friend-request')
export class FriendRequest {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: FriendRequestStatus.PENDING,
    nullable: false
  })
  status: FriendRequestStatus;

  @ApiProperty()
  @ManyToOne(
    () => User,
    (user) => user.sent_friend_requests
  )
  sender: User;

  @ApiProperty()
  @ManyToOne(
    () => User,
    (user) => user.received_friend_requests
  )
  receiver: User;
}
