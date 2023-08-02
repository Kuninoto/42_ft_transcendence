import { ApiProperty } from '@nestjs/swagger';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
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
