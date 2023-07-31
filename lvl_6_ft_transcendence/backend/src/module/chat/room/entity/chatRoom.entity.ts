import { PrimaryGeneratedColumn, Column, Entity, Timestamp, OneToMany, JoinTable, JoinColumn, ManyToMany } from "typeorm";
import { Message } from "../../message/entity/message.entity";
import { User } from "src/entity/user.entity";
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
	@JoinTable()
	users: User[];

	@OneToMany(() => Message, (messages: Message) => messages.room)
	@JoinColumn()
	messages: Message[];

}
