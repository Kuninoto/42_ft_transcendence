import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class BlockedUser {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
  })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  user_who_blocked: User;

  @ManyToOne(() => User)
  @JoinColumn()
  blocked_user: User;
}
