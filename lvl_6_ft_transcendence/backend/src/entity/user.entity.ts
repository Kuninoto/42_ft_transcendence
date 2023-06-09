import { PrimaryGeneratedColumn, Column, Entity, Timestamp } from "typeorm";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        name: 'user_id',
    })
    id: number;

    @Column({
        unique: true,
        nullable: false,
    })
    name: string;

    @Column({
        nullable: false,
    })
    hashed_pass: string;

    @Column({ default: true })
    is_online: boolean;

    @Column({ default: true })
    is_auth: boolean;

    @Column({ default: false })
    has_2fa: boolean;

    @Column({ default: false })
    in_match: boolean;

    @Column({ type: 'timestamp'})
    created_at: Date;

    @Column({ type: 'timestamp'})
    last_update_at: Date;
}
