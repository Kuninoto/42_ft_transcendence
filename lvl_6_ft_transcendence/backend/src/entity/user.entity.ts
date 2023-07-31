import { ApiProperty } from '@nestjs/swagger';
import { MessageI } from 'src/module/chat/message/entity/message.interface';
import { RoomI } from 'src/module/chat/room/entity/room.interface';
import { ChatRoom, Message } from 'src/typeorm';
import { PrimaryGeneratedColumn, Column, Entity, JoinTable, ManyToOne, ManyToMany, OneToMany, JoinColumn, Index } from 'typeorm';

export enum UserStatus {
  ONLINE,
  OFFLINE,
  IN_MATCH,
}

@Entity('User')
@Index(['name'], { unique: true })
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  name: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ONLINE,
  })
  status: UserStatus;

  @ApiProperty()
  @Column({ default: false })
  has_2fa: boolean;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: true,
  })
  secret_2fa: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  avatar_url: string;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  last_updated_at: Date;

  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.users)
  room: RoomI[];

  @OneToMany(() => Message, (message: Message) => message.user)
  messages: MessageI[];
}
