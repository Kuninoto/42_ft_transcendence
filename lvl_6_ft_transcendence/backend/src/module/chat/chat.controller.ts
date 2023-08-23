import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotAcceptableResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { ChatRoomSearchInfo, ErrorResponse, SuccessResponse } from 'types';
import { CreateRoomDTO } from './dto/create-room.dto';
import { RoomService } from './room.service';

@ApiTags('chat')
@ApiBearerAuth('swagger-basic-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly roomService: RoomService) {}

  private readonly logger: Logger = new Logger(ChatController.name);

  @ApiConflictResponse({ description: 'If room name is already taken' })
  @ApiUnprocessableEntityResponse({
    description: 'If room name is not 4-10 chars long',
  })
  @ApiNotAcceptableResponse({
    description:
      'If room name is not composed by letters (both case), digits and underscore',
  })
  @ApiOkResponse({
    description: 'Successfully created a room named createRoomDto.name',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/create-room')
  public async createRoom(
    @ExtractUser() user: User,
    @Body() createRoomDto: CreateRoomDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.roomService.createRoom(createRoomDto, user);

    this.logger.log(
      `${user.name} created a ${createRoomDto.type} room named "${createRoomDto.name}"`,
    );
    return { message: `Successfully created room "${createRoomDto.name}"` };
  }

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
    description: 'A piece of the room name(s) to match',
    name: 'room-name',
    type: 'string',
  })
  @Get('/rooms/search')
  public async getUsersByUsernameProximity(
    @Query('room-name') query: string,
  ): Promise<ChatRoomSearchInfo[]> {
    return await this.roomService.findRoomsByRoomNameProximity(query);
  }
}
