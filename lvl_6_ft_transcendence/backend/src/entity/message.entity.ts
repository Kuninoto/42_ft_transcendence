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
    type: 'varchar',
    nullable: false,
  })
  content: string;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => ChatRoom, (room: ChatRoom) => room.messages)
  room: ChatRoom;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  user: User;

  @ApiProperty()
  @Column({ type: 'timestamp', default: new Date() })
  sent_at: Date;
}
