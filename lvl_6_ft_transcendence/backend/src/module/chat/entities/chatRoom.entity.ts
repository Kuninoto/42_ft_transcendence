import { PrimaryGeneratedColumn, Column, Entity, Timestamp, OneToMany, JoinTable, JoinColumn, ManyToMany } from "typeorm";
import { Message } from "./message.entity";
import { User } from "../../../entity/user.entity";
import { UserI } from "src/entity/user.interface";

@Entity()
export class ChatRoom {
	@PrimaryGeneratedColumn({
		type: 'bigint',
		name: 'room_id',
	})
	id: number;

	@Column({ nullable: false })
	name: string;

	@Column({ nullable: false })
	owner: string;

	@Column({ nullable: false })
	ownerId: number;

	@ManyToMany(() => User, (users: User) => users.room)
	@JoinColumn()
	users: User[];

	@OneToMany(() => Message, (messages: Message) => messages.room)
	@JoinColumn()
	messages: Message[];

	// @Column({ type: 'timestamp'})
	// created_at: Date;
}
