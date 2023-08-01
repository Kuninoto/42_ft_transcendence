import { PrimaryGeneratedColumn, Column, Entity, Timestamp, JoinTable, ManyToOne, JoinColumn } from "typeorm";
import { ChatRoom } from "./../../room/entity/chatRoom.entity";
import { UserI } from "src/entity/user.interface";
import { RoomI } from "../../room/entity/room.interface";
import { User } from "src/typeorm";

@Entity('message')
export class Message {
		@PrimaryGeneratedColumn({
			type: 'bigint',
			name: 'message_id',
		})
		id: number;

		@Column({ nullable: false })
		text: string;

		@Column({ type: 'timestamp', default: new Date()})
		created_at: Date;

		@JoinColumn()
		@ManyToOne(() => User, (user: User) => user.messages)
		user: UserI;

		@JoinColumn()
		@ManyToOne(() => ChatRoom, (room: ChatRoom) => room.messages)
		room: RoomI;
}