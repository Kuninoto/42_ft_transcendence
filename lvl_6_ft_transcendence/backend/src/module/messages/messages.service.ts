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

	public async create(createMessageDto: CreateMessageDto) {
		const message = this.msgRepository.create(createMessageDto); // TODO connect with username
		return this.msgRepository.save(message);
	}

	public async findAll() {
		return await this.msgRepository.find();
	}
}
