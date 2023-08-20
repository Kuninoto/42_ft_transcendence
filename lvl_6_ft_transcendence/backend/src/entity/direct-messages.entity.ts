import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './index';

@Entity('direct_message')
export class DirectMessage {
  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  content: string;

  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  receiver: User;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  sender: User;

  @ApiProperty()
  @Column({ default: new Date(), type: 'timestamp' })
  sent_at: Date;

  // Id sent by the frontend
  @ApiProperty()
  @Column({
    nullable: false,
    type: 'varchar',
  })
  unique_id: string;
}
