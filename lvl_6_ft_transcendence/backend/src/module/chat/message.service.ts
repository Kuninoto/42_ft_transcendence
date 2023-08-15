import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { ChatRoom, DirectMessage } from 'src/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../entity/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(DirectMessage)
    private readonly directMessageRepository: Repository<DirectMessage>,
  ) {}

  async newChatRoomMessage(
    authorUID: number,
    toChatRoom: ChatRoom,
    content: string,
  ): Promise<ChatRoomMessageI> {
    const newMessage: Message = this.messageRepository.create({
      content: content,
      room: { id: toChatRoom.id },
      user: { id: authorUID },
    });

    await this.messageRepository.save(newMessage);

    const message: Message = await this.messageRepository.findOne({
      where: { id: newMessage.id },
      relations: {
        user: true,
      },
    });

    return {
      user: {
        id: message.user.id,
        name: message.user.name,
        avatar_url: message.user.avatar_url,
      },
      content: message.content,
    };
  }

  async createDirectMessage(
    senderUID: number,
    receiverUID: number,
    content: string,
  ): Promise<DirectMessage> {
    const newMessage: DirectMessage = this.directMessageRepository.create({
      sender: { id: senderUID },
      receiver: { id: receiverUID },
      content: content,
    });

    return await this.directMessageRepository.save(newMessage);
  }
}
