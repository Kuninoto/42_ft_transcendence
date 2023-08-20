import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { ChatRoomSearchInfo } from 'types';
import { RoomService } from './room.service';

@ApiTags('chat')
@ApiBearerAuth('Jwt')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * GET /api/chat/rooms/search?room-name=
   *
   * This is the route to visit to search for ChatRoomSearchInfo by room-name proximity.
   * Returns the rooms that match that "piece" of name,
   * If no roomname is provided returns all rooms
   */
  @ApiOkResponse({
    description:
      'This is the route to visit to search for ChatRoomSearchInfo, by room-name proximity.\nReturns the rooms that match that "piece" of name, If no <name> is provided returns all rooms',
  })
  @ApiQuery({
    type: 'string',
    name: 'room-name',
    description: 'A piece of the room name(s) to match',
  })
  @Get('/rooms/search')
  public async getUsersByUsernameProximity(
    @Query('room-name') query: string,
  ): Promise<ChatRoomSearchInfo[]> {
    return await this.roomService.findRoomsByRoomNameProximity(query);
  }
}
