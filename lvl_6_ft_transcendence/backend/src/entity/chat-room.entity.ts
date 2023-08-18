import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/entity/user.entity';
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
import { Message } from './message.entity';

export enum ChatRoomType {
  DIRECT = 'direct',
  PUBLIC = 'public',
  PROTECTED = 'protected',
  PRIVATE = 'private',
}

@Entity()
export class ChatRoom {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  owner: User;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  type: ChatRoomType;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  password: string;

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_rooms)
  @JoinTable()
  users: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_admin)
  @JoinTable()
  admins: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.banned_rooms)
  @JoinTable()
  bans: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_admin)
  @JoinTable()
  muted: User[];

  @ApiProperty()
  @OneToMany(() => Message, (messages: Message) => messages.room)
  @JoinColumn()
  messages: Message[];
}