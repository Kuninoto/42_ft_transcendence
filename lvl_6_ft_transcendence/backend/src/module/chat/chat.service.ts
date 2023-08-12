import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomSearchInfo } from 'src/common/types/chat-room-search-info.interface';
import { Repository } from 'typeorm';
import { ChatRoom, ChatRoomType } from '../../entity/chat-room.entity';
import { Message } from '../../entity/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  public async findChatRoomsByRoomNameProximity(
    chatRoomNameQuery: string,
  ): Promise<ChatRoomSearchInfo[]> {
    const chatRooms: ChatRoom[] = await this.chatRoomRepository
      .createQueryBuilder('chat_room')
      .leftJoin('chat_room.owner', 'owner')
      .where('chat_room.name LIKE :roomNameProximity', {
        roomNameProximity: chatRoomNameQuery + '%',
      })
      .andWhere('chat_room.type NOT private')
      .getMany();

    const chatRommSearchInfos: ChatRoomSearchInfo[] = chatRooms.map(
      (room: ChatRoom) => ({
        name: room.name,
        protected: room.type === ChatRoomType.PROTECTED ? true : false,
      }),
    );

    return chatRommSearchInfos;
  }
}
