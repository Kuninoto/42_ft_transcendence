import { PrimaryGeneratedColumn, Column, Entity, Timestamp, JoinTable, ManyToOne } from "typeorm";
import { ChatRoom } from "./chatRoom.entity";

@Entity('message')
export class Message {
		@PrimaryGeneratedColumn({
			type: 'bigint',
			name: 'message_id',
		})
		id: number;

		@Column({ nullable: false })
			text: string;
			
		@Column({ type: 'timestamp'})
		created_at?: Date;

		@JoinTable()
		@ManyToOne(() => ChatRoom, (room: ChatRoom) => room.messages)
		room: ChatRoom;
}