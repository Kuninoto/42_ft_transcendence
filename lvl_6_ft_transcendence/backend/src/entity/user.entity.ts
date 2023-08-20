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
  @OneToMany(() => Achievement, (achievement: Achievement) => achievement.user)
  achievements: Achievement[];

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  avatar_url: string;

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.bans)
  banned_rooms: ChatRoom[];

  @ApiProperty()
  @OneToMany(
    () => BlockedUser,
    (blockedUser: BlockedUser) => blockedUser.user_who_blocked,
  )
  @JoinColumn({ name: 'blocked_users' })
  blocked_users: BlockedUser[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.admins)
  chat_admin: ChatRoom[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.users)
  chat_rooms: ChatRoom[];

  @ApiProperty()
  @Column({
    default: new Date(),
    type: 'timestamp',
  })
  created_at: Date;

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.loser)
  game_results_as_loser: GameResult[];

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.winner)
  game_results_as_winner: GameResult[];

  @ApiProperty()
  @Column({
    default: 'default',
    nullable: false,
    type: 'varchar',
  })
  game_theme: string;

  @ApiProperty()
  @Column({ default: false })
  has_2fa: boolean;

  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
    unique: true,
  })
  intra_name: string;

  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  intra_profile_url: string;

  @ApiProperty()
  @Column({
    default: new Date(),
    type: 'timestamp',
  })
  last_updated_at: Date;

  @ApiProperty()
  @Column({
    length: 10,
    nullable: false,
    type: 'varchar',
    unique: true,
  })
  name: string;

  @ApiProperty()
  @Column({
    nullable: true,
    type: 'varchar',
  })
  secret_2fa: string;

  @ApiProperty()
  @Column({
    default: UserStatus.ONLINE,
    nullable: false,
    type: 'varchar',
  })
  status: string;

  @ApiProperty()
  @OneToOne(() => UserStats, (userStats: UserStats) => userStats.user)
  user_stats: UserStats;
}
