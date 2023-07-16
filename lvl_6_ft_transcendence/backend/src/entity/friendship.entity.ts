import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum FriendshipStatus {
  DECLINED = "declined",
  ACCEPTED = "accepted",
  PENDING = "pending",
  CANCEL = "canceled",
  UNFRIEND = "unfriend"
}

@Entity('friendship')
export class Friendship {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: FriendshipStatus.PENDING,
    nullable: false
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
