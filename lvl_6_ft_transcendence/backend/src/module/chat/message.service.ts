import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom, DirectMessage } from 'src/entity';
import { Repository } from 'typeorm';
import { ChatRoomMessageI } from 'types';

import { Message } from '../../entity/message.entity';
import { ConnectionGateway } from '../connection/connection.gateway';
import { DirectMessageReceivedDTO } from '../friendships/dto/direct-message-received.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(DirectMessage)
    private readonly directMessageRepository: Repository<DirectMessage>,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  async createDirectMessage(
    senderUID: number,
    receiverUID: number,
    content: string,
  ): Promise<DirectMessage> {
    const newMessage: DirectMessage = this.directMessageRepository.create({
      content: content,
      receiver: { id: receiverUID },
      sender: { id: senderUID },
    });

    return await this.directMessageRepository.save(newMessage);
  }

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
      relations: {
        user: true,
      },
      where: { id: newMessage.id },
    });

    return {
      content: message.content,
      user: {
        avatar_url: message.user.avatar_url,
        id: message.user.id,
        name: message.user.name,
      },
    };
  }

  async sendMissedDirectMessages(
    receiverSocketId: string,
    receiverUID: number,
  ): Promise<void> {
    // We only keep the unsent direct messages on the db
    // thus all the messages on the db are unsent
    const missedDMs: DirectMessage[] = await this.directMessageRepository.find({
      relations: {
        sender: true,
      },
      where: {
        receiver: {
          id: receiverUID,
        },
      },
    });

    // Send every missed DM
    missedDMs.forEach((dm: DirectMessage) => {
      const directMessageReceived: DirectMessageReceivedDTO = {
        content: dm.content,
        senderUID: dm.sender.id,
        uniqueId: dm.unique_id,
      };

      this.connectionGateway.server
        .to(receiverSocketId)
        .emit('directMessageReceived', directMessageReceived);
    });

    // After sending all missed direct messages we can delete them from db
    await this.directMessageRepository.delete({
      receiver: { id: receiverUID },
    });
  }
}
