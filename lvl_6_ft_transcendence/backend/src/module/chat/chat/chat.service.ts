import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageDto } from './dto/message.dto';
import { SubscribeMessage } from '@nestjs/websockets';
import { Message } from '../entities/message.entity';
import { ChatRoom } from '../entities/chatRoom.entity';
import { User } from 'src/typeorm';
import { RoomDto } from './dto/room.dto';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(ChatRoom) private readonly chatRepository: Repository<ChatRoom>,
		@InjectRepository(Message) private readonly messageRepository: Repository<Message>,
	) {}

	// async createRoom(room: ChatRoom, creator: User)

	async createMessage(MessageDto: MessageDto) {
		const message = await this.messageRepository.create(MessageDto);
		console.log('Yo, I got here and will save the message now');
		return await this.messageRepository.save(message);
	}

	async findAll() {
		return await this.messageRepository.find();
	}

}
