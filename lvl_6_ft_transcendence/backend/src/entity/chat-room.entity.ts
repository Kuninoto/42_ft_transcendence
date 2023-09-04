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
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false })
  type: ChatRoomType;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  password: string;

  @ManyToOne(() => User)
  @JoinColumn()
  owner: User;

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_admin, { cascade: true })
  @JoinTable()
  admins: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.banned_rooms, {
    cascade: true,
  })
  @JoinTable()
  bans: User[];

  @ApiProperty()
  @ManyToMany(() => User, (users: User) => users.chat_rooms, { cascade: true })
  @JoinTable()
  users: User[];
}
