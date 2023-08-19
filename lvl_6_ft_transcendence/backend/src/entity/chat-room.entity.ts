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
import { ChatRoomType } from 'types';
import { Message } from './message.entity';

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
  @OneToMany(() => User, (users: User) => users.id)
  @JoinColumn()
  admins: User[];

  @ApiProperty()
  @OneToMany(() => Message, (messages: Message) => messages.room)
  @JoinColumn()
  messages: Message[];
}
