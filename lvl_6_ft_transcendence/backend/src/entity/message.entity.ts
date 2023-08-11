import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/typeorm';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';

@Entity('message')
export class Message {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({ nullable: false })
  text: string;

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
