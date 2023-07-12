import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('Friendship')
export class Friendship {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    default: new Date()
  })
  created_at: Date;

  @ApiProperty()
  @ManyToOne(() => User, user => user.friendships)
  user: User;
}
