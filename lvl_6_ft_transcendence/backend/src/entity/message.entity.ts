import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoom, User } from './index';

@Entity('message')
export class Message {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  content: string;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => ChatRoom, (room: ChatRoom) => room.messages)
  room: ChatRoom;

  @ApiProperty()
  @Column({ default: new Date(), type: 'timestamp' })
  sent_at: Date;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  user: User;
}
