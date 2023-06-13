import { Module } from '@nestjs/common';
import { ChatService } from './service/chat.service';
import { ChatController } from './controller/chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [],
	providers: [ChatService],
	controllers: [ChatController]
})
export class ChatModule {}
