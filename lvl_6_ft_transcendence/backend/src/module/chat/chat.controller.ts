import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatRoomI } from 'src/common/types/chat-room.interface';
import { User } from 'src/typeorm';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';

@ApiTags('chat')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor() {}

  private readonly logger: Logger = new Logger(ChatController.name);

  /**
   * GET /api/chat/rooms/search?room_name=
   *
   * This is the route to visit to search for ChatRoomInfo  
   * by room_name proximity.  
   * Returns the rooms match that "piece" of name,  
   * If no room_name is provided returns all rooms
   */
  /* @ApiOkResponse({
    description:
      'This is the route to visit to search for ChatRoomInfo, by room_name proximity, Returns the rooms match that "piece" of name, If no <name> is provided returns all rooms',
  })
  @Get('/rooms/search')
  public async getUsersByUsernameProximity(
    @Req() req: { user: User },
    @Query('username') query: string,
  ): Promise<ChatRoomI[]> {
    if (!query) {
      return [];
    }

    return await this.usersService.findUsersSearchInfoByUsernameProximity(
      req.user,
      query,
    );
  } */
}
