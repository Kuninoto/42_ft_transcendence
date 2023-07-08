import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from 'typeorm';
import { Friendship } from './friendship.entity';

export enum UserStatus {
  OFFLINE,
  ONLINE,
  IN_MATCH,
}

@Entity('User')
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

  @ApiProperty()
  @OneToMany(() => Friendship, friendship => friendship.user)
  friendships: Friendship[];
}
