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
    userWhoBlocked: User;

    @ManyToOne(() => User)
    @JoinColumn()
    blockedUser: User;
}
