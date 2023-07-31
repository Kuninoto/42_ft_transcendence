import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageDto } from '../../message/entity/message.dto';
import { SubscribeMessage } from '@nestjs/websockets';
import { Message } from '../../message/entity/message.entity';
import { ChatRoom } from '../../room/entity/chatRoom.entity';
import { User } from 'src/typeorm';
import { RoomDto } from '../../room/entity/room.dto';

@Injectable()
export class MessageService {
	constructor(
		@InjectRepository(Message) private readonly messageRepository: Repository<Message>
	) {}

	async createMessage(MessageDto: MessageDto) {
		const message = await this.messageRepository.create(MessageDto);
		console.log('Yo, I got here and will save the message now');
		return await this.messageRepository.save(message);
	}

	async findAllMessages() {
		return await this.messageRepository.find();
	}

}
