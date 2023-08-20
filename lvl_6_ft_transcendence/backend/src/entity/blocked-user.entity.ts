import { ApiProperty } from '@nestjs/swagger';
import { User } from './index';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocked_user')
export class BlockedUser {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  user_who_blocked: User;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  blocked_user: User;
}
