import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from 'typeorm';
import { Friendship } from './friendship.entity';
import { BlockedUser } from './blocked-user.entity';

export enum UserStatus {
  OFFLINE = "offline",
  ONLINE = "online",
  IN_GAME = "in game"
}

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
    nullable: false
  })
  name: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: UserStatus.ONLINE,
    nullable: false
  })
  status: string;

  @ApiProperty()
  @Column({ default: false })
  has_2fa: boolean;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: true
  })
  secret_2fa: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false
  })
  avatar_url: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false
  })
  intra_profile_url: string;

  @ApiProperty()
  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.userWhoBlocked)
  blockedUsers: BlockedUser[];

  @ApiProperty()
  @Column({
    type: 'timestamp',
    default: new Date()
  })
  created_at: Date;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    default: new Date()
  })
  last_updated_at: Date;
}
