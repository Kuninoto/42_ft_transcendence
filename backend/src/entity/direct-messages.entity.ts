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
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  // Id sent by the frontend
  @ApiProperty()
  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  unique_id: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false,
  })
  content: string;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  sender: User;

  @ApiProperty()
  @JoinColumn()
  @ManyToOne(() => User, (user: User) => user.id)
  receiver: User;

  @ApiProperty()
  @Column({
    type: 'timestamp',
    nullable: false,
    default: new Date(),
  })
  sent_at: Date;
}
