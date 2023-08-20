import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoomType } from 'types';
import { Message, User } from './index';

@Entity('chat_room')
export class ChatRoom {
  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_admin)
  @JoinTable()
  admins: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.banned_rooms)
  @JoinTable()
  bans: User[];

  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @OneToMany(() => Message, (messages: Message) => messages.room)
  @JoinColumn()
  messages: Message[];

  @ApiProperty()
  @Column({ nullable: false, type: 'varchar' })
  name: string;

  @ManyToOne(() => User)
  @JoinColumn()
  owner: User;

  @ApiProperty()
  @Column({ nullable: true, type: 'varchar' })
  password: string;

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  type: ChatRoomType;

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_rooms)
  @JoinTable()
  users: User[];
}
