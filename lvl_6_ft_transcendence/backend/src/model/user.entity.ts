import { Column, Entity, PrimaryColumn, Timestamp } from "typeorm";

@Entity('users')
export class User {
    @PrimaryColumn({unique: true})
    id: number;

    @Column({unique: true})
    name: string;

    @Column()
    hashed_pass: string;

    @Column({ type: 'boolean', default: false })
    is_online: boolean;

    @Column({ type: 'boolean', default: false })
    is_auth: boolean;

    @Column({ type: 'boolean', default: false })
    has_2fa: boolean;

    @Column({ type: 'boolean', default: false })
    in_match: boolean;

}
