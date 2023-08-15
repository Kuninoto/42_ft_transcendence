import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/typeorm';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('direct_message')
export class DirectMessage {
  @ApiProperty()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    nullable: false
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
  @Column({ type: 'timestamp', default: new Date() })
  sent_at: Date;
}
