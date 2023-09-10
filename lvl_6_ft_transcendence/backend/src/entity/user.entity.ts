import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from 'types';
import {
  Achievement,
  BlockedUser,
  ChatRoom,
  GameResult,
  UserStats,
} from './index';

@Entity('user')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
    length: 10,
  })
  name: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  intra_name: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  intra_profile_url: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
    default: UserStatus.ONLINE,
  })
  status: UserStatus;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  avatar_url: string;

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
  @OneToMany(
    () => Achievement,
    (achievement: Achievement) => achievement.user,
    { cascade: true },
  )
  achievements: Achievement[];

  @ApiProperty()
  @OneToMany(
    () => BlockedUser,
    (blockedUser: BlockedUser) => blockedUser.user_who_blocked,
  )
  @JoinColumn({ name: 'blocked_users' })
  blocked_users: BlockedUser[];

  @ApiProperty()
  @Column({
    default: 'default',
    nullable: false,
    type: 'varchar',
  })
  game_theme: string;

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.winner, {
    cascade: true,
  })
  game_results_as_winner: GameResult[];

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.loser, {
    cascade: true,
  })
  game_results_as_loser: GameResult[];

  @ApiProperty()
  @OneToOne(() => UserStats, (userStats: UserStats) => userStats.user, {
    cascade: true,
  })
  user_stats: UserStats;

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.users)
  chat_rooms: ChatRoom[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.bans)
  banned_rooms: ChatRoom[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.admins)
  chat_admin: ChatRoom[];

  @ApiProperty()
  @Column({
    type: 'timestamp',
    nullable: false,
    default: new Date(),
  })
  created_at: Date;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    nullable: false,
    default: new Date(),
  })
  last_updated_at: Date;
}
