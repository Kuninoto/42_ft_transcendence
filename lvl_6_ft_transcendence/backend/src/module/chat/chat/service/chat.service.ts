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
export class ChatService {
	constructor(
		@InjectRepository(ChatRoom) private readonly chatRepository: Repository<ChatRoom>,
		@InjectRepository(Message) private readonly messageRepository: Repository<Message>,
	) {}

}
