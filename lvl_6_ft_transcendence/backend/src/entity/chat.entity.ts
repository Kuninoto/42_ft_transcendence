import { PrimaryGeneratedColumn, Column, Entity, Timestamp } from "typeorm";

@Entity('chat')
export class chat {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        name: 'chat_id',
    })
    id: number;

    @Column({
        unique: true,
        nullable: false,
    })
    owner: string;

    @Column({
        nullable: true,
    })
    password: string;

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