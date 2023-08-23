import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DirectMessage } from 'src/entity';
import { Repository } from 'typeorm';
import { ConnectionGateway } from '../connection/connection.gateway';
import { DirectMessageReceivedDTO } from '../friendships/dto/direct-message-received.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly directMessageRepository: Repository<DirectMessage>,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  async createDirectMessage(
    senderUID: number,
    receiverUID: number,
    uniqueId: string,
    content: string,
  ): Promise<DirectMessage> {
    const newMessage: DirectMessage = this.directMessageRepository.create({
      unique_id: uniqueId,
      content: content,
      receiver: { id: receiverUID },
      sender: { id: senderUID },
    });

    return await this.directMessageRepository.save(newMessage);
  }

  async sendMissedDirectMessages(
    receiverSocketId: string,
    receiverUID: number,
  ): Promise<void> {
    // We only keep the unsent direct messages on the db
    // thus all the messages on the db are unsent
    /* const missedDMs: DirectMessage[] = await this.directMessageRepository.find({
      relations: {
        sender: true,
      },
      where: {
        receiver: {
          id: receiverUID,
        },
      },
    }); */

    // We only keep the unsent direct messages on the db
    // thus all the messages on the db are unsent

    /* Left join sender, select every message where receiverId = receiverUID
    and because on the db the message with the biggest id will be the newest
    we must sort in ascending order by id (oldest at [0]) to emit them
    from the oldest to the newest */
    const missedDMs: DirectMessage[] = await this.directMessageRepository
      .createQueryBuilder('direct_message')
      .leftJoinAndSelect('direct_message.sender', 'sender')
      .where('direct_message.receiver_id = :receiverUID', { receiverUID })
      .orderBy('direct_message.id', 'ASC')
      .getMany();

    if (!missedDMs) return;

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
