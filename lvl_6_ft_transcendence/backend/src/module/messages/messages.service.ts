import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SubscribeMessage } from '@nestjs/websockets';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
	constructor(
		@InjectRepository(Message) private msgRepository: Repository<Message>,
	) {}

	// TODO figure how to do this from the database
	clientToUser = {};

	identify(name: string, clientId: string) {
		this.clientToUser[clientId] = name;
		
		return Object.values(this.clientToUser);
	}

	getClientName(clientId: string) {
		return this.clientToUser[clientId];
	}

	async createMessage(createMessageDto: CreateMessageDto) {
		const message = await this.msgRepository.create(createMessageDto); // TODO connect with username
		console.log('Yo, I got here and will save the message now');
		return await this.msgRepository.save(message);
	}

	async findAll() {
		return await this.msgRepository.find();
	}
}
