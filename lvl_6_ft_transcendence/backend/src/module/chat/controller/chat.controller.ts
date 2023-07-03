import { Controller, Get, Render, Param } from '@nestjs/common';
import { ChatService } from '../service/chat.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @Get()
  @Render('index')
  getChat(): void {}

  @Get('socket.io')
  getSocketIo(): void {}
}
