import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Achievements } from 'types';
import { User } from './index';

@Entity('achievement')
export class Achievement {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  achievement: Achievements;
}
