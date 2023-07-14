import { PrimaryGeneratedColumn, Column, Entity, Timestamp, OneToMany, JoinTable } from "typeorm";
import { Message } from "./message.entity";
import { User } from "../../../entity/user.entity";

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

	@OneToMany(() => User, (users: User) => users.room)
	users: Array<User>;

	@OneToMany(() => Message, (messages: Message) => messages.room)
	messages: Array<Message>;

	// @Column({ type: 'timestamp'})
	// created_at: Date;
}