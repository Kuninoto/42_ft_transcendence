import { ApiProperty } from '@nestjs/swagger';
import { ChatRoom } from 'src/typeorm';
import { PrimaryGeneratedColumn, Column, Entity, JoinTable, ManyToOne } from 'typeorm';

export enum UserStatus {
  ONLINE,
  OFFLINE,
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
  @Column({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  last_updated_at: Date;

  @JoinTable()
  @ManyToOne(() => ChatRoom, (room: ChatRoom) => room.messages)
  room: ChatRoom;
}
