import { ApiProperty } from '@nestjs/swagger';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './index';

@Entity('blocked_user')
export class BlockedUser {
  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  blocked_user: User;

  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn()
  user_who_blocked: User;
}
