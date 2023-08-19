import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Achievements } from '../../types/achievement';
import { User } from './user.entity';

@Entity('achievement')
export class Achievement {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  achievement: Achievements;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
