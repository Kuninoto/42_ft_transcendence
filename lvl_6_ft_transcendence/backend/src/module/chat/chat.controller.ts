import { Controller, Get, Logger, Query, Req, UseGuards } from '@nestjs/common';
import { ChatRoomI } from 'src/common/types/chat-room.interface';
import { User } from 'src/typeorm';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { RoomService } from './room.service';
import { ChatRoomSearchInfo } from 'src/common/types/chat-room-search-info.interface';

@ApiTags('chat')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly roomService: RoomService) {}

  private readonly logger: Logger = new Logger(ChatController.name);

  /**
   * GET /api/chat/rooms/search?room_name=
   *
   * This is the route to visit to search for ChatRoomSearchInfo by room_name proximity.
   * Returns the rooms that match that "piece" of name,
   * If no room_name is provided returns all rooms
   */
  @ApiOkResponse({
    description:
      'This is the route to visit to search for ChatRoomSearchInfo, by room_name proximity.\nReturns the rooms that match that "piece" of name, If no <name> is provided returns all rooms',
  })
  @Get('/rooms/search')
  public async getUsersByUsernameProximity(
    @Query('room_name') query: string,
  ): Promise<ChatRoomSearchInfo[]> {
    return await this.roomService.findRoomsByRoomNameProximity(query);
  }
}
