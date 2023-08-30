import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoomType } from 'types';
import { User } from './index';

@Entity('chat_room')
export class ChatRoom {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({ nullable: false, type: 'varchar' })
  name: string;

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  type: ChatRoomType;

  @ApiProperty()
  @Column({ nullable: true, type: 'varchar' })
  password: string;

  @ManyToOne(() => User)
  @JoinColumn()
  owner: User;

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_admin, { cascade: true })
  @JoinTable()
  admins: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.banned_rooms, { cascade: true })
  @JoinTable()
  bans: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_rooms, { cascade: true })
  @JoinTable()
  users: User[];
}
