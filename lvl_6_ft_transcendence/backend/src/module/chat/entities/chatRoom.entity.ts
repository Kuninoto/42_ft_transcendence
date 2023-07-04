import { PrimaryGeneratedColumn, Column, Entity, Timestamp, OneToMany } from "typeorm";
import { Message } from "./message.entity";

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
	ownerId: number;

	// @OneToMany(() => Message, (message: Message) => message.room)
	// messages: Array<Message>;

	// @Column({ type: 'timestamp'})
	// created_at: Date;
}