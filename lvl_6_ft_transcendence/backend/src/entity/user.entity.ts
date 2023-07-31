import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  JoinColumn,
  OneToOne,
  ManyToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MessageI } from 'src/module/chat/message/entity/message.interface';
import { RoomI } from 'src/module/chat/room/entity/room.interface';
import { ChatRoom, Message } from 'src/typeorm';
import { BlockedUser } from './blocked-user.entity';
import { UserRecord } from './user-record.entity';
import { MatchHistory } from './match-history.entity';
import { UserStatus } from 'src/common/types/user-status.enum';

@Entity('user')
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
    length: 10,
    unique: true,
    nullable: false,
  })
  name: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  intra_name: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: UserStatus.ONLINE,
    nullable: false,
  })
  status: string;

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
  @Column({
    type: 'varchar',
    nullable: false,
  })
  intra_profile_url: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: 'default',
    nullable: false,
  })
  game_theme: string;

  @ApiProperty()
  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.user_who_blocked)
  @JoinColumn({ name: 'blocked_users' })
  blocked_users: BlockedUser[];

  @ApiProperty()
  @OneToOne(() => UserRecord, (userRecord) => userRecord.user)
  user_record: UserRecord;

  @ApiProperty()
  @OneToOne(() => MatchHistory, (matchHistory) => matchHistory.user)
  match_history: MatchHistory;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    default: new Date(),
  })
  created_at: Date;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    default: new Date(),
  })
  last_updated_at: Date;

  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.users)
  room: RoomI[];

  @OneToMany(() => Message, (message: Message) => message.user)
  messages: MessageI[];
}
