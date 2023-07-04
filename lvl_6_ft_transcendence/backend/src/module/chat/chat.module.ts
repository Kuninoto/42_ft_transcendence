import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/typeorm';
import { Message } from 'src/typeorm';


@Module({
	imports: [TypeOrmModule.forFeature([ChatRoom, Message])],
	providers: [ChatGateway, ChatService]
})
export class ChatModule {}
