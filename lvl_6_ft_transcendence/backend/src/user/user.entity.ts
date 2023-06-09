import { PrimaryColumn, Column, Entity } from "typeorm";

@Entity('user')
export class User {
    @PrimaryColumn({unique: true})
    id: number;

    @Column({unique: true})
    name: string;

    @Column()
    hashedPass: string;

    @Column({ type: 'boolean', default: false })
    isOnline: boolean;

    @Column({ type: 'boolean', default: false })
    isAuth: boolean;

    @Column({ type: 'boolean', default: false })
    has2fa: boolean;

    @Column({ type: 'boolean', default: false })
    inMatch: boolean;

    @Column({ type: 'date'})
    createdAt: Date;
}
