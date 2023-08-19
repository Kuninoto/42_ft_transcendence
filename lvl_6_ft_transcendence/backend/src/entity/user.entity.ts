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
import { ChatRoom } from '../typeorm/index';
import { Achievement } from './achievement.entity';
import { BlockedUser } from './blocked-user.entity';
import { GameResult } from './game-result.entity';
import { UserStats } from './user-stats.entity';

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
  @OneToMany(
    () => BlockedUser,
    (blockedUser: BlockedUser) => blockedUser.user_who_blocked,
  )
  @JoinColumn({ name: 'blocked_users' })
  blocked_users: BlockedUser[];

  @ApiProperty()
  @OneToOne(() => UserStats, (userStats: UserStats) => userStats.user)
  user_stats: UserStats;

  @ApiProperty()
  @OneToMany(() => Achievement, (achievement: Achievement) => achievement.user)
  achievements: Achievement[];

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.winner)
  game_results_as_winner: GameResult[];

  @ApiProperty()
  @OneToMany(() => GameResult, (gameResult: GameResult) => gameResult.loser)
  game_results_as_loser: GameResult[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.users)
  chat_rooms: ChatRoom[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.admins)
  chat_admin: ChatRoom[];

  @ApiProperty()
  @ManyToMany(() => ChatRoom, (room: ChatRoom) => room.bans)
  banned_rooms: ChatRoom[];

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
}
