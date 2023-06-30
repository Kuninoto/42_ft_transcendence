import { PrimaryGeneratedColumn, Column, Entity, Timestamp } from "typeorm";

@Entity('message')
export class Message {
		@PrimaryGeneratedColumn({
			type: 'bigint',
			name: 'chat_id',
		})
		id: number;

		@Column({ nullable: false })
			text: string;
			
		// @Column({ type: 'timestamp'})
		// created_at: Date;
}