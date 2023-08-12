import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { DirectMessageI } from 'src/common/types/direct-message.interface';
import { ChatRoom, DirectMessage, User } from 'src/typeorm';
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
    userWhoSent: User,
    toChatRoom: ChatRoom,
    text: string,
  ): Promise<ChatRoomMessageI> {
    const newMessage: Message = this.messageRepository.create({
      text: text,
      room: { id: toChatRoom.id },
      user: { id: userWhoSent.id },
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
      text: message.text,
    };
  }

  async newDirectMessage(
    senderUID: number,
    receiverUID: number,
    text: string,
  ): Promise<DirectMessageI> {
    const newMessage: DirectMessage = this.directMessageRepository.create({
      sender: { id: senderUID },
      receiver: { id: receiverUID },
      text: text,
    });
    await this.directMessageRepository.save(newMessage);

    return {
      senderUID: senderUID,
      text: text,
    };
  }
}
