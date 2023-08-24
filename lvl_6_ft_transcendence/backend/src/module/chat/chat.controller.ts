import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { ChatRoom, User } from 'src/entity';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import {
  ChatRoomSearchInfo,
  ErrorResponse,
  MuteDuration,
  SuccessResponse,
} from 'types';
import { ChatService } from './chat.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { MuteUserDTO } from './dto/mute-user.dto';
import { RemoveRoomPasswordDTO } from './dto/remove-room-password.dto';
import { RoomOperationDTO } from './dto/room-operation.dto';
import { UpdateRoomPasswordDTO } from './dto/update-room-password.dto';
import { AdminGuard } from './guard/admin.guard';
import { OwnerGuard } from './guard/owner.guard';

@ApiTags('chat')
@ApiBearerAuth('swagger-basic-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private readonly logger: Logger = new Logger(ChatController.name);

  @ApiConflictResponse({ description: 'If room name is already taken' })
  @ApiUnprocessableEntityResponse({
    description:
      'If room name is not 4-10 chars long or room is protected and password is not 4-20 chars long',
  })
  @ApiNotAcceptableResponse({
    description:
      'If room name is not composed only by letters (both case), digits and underscore',
  })
  @ApiBadRequestResponse({
    description:
      "If room is protected and there's no password or if it is not composed only by letters (both case), digits and special chars",
  })
  @ApiOkResponse({
    description: 'Successfully created a room named createRoomDto.name',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/create-room')
  public async createRoom(
    @ExtractUser() user: User,
    @Body() body: CreateRoomDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.chatService.createRoom(body, user);

    this.logger.log(
      `${user.name} created a ${body.type} room named "${body.name}"`,
    );
    return { message: `Successfully created room "${body.name}"` };
  }

  @ApiNotFoundResponse({
    description: "The room doesn't exist",
  })
  @ApiForbiddenResponse({ description: 'If user is banned from room' })
  @ApiConflictResponse({ description: 'If user is already in the room' })
  @HttpCode(HttpStatus.OK)
  @Post('/join-room')
  public async joinRoom(
    @ExtractUser() user: User,
    @Body() body: JoinRoomDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );
    if (!room) {
      throw new NotFoundException(`Room with id=${body.roomId} doesn't exist`);
    }

    return this.chatService.joinRoom(user, body.roomId);
  }

  @ApiNotFoundResponse({ description: "If room doesn't exist" })
  @HttpCode(HttpStatus.OK)
  @Post('/leave-room')
  public async leaveRoom(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );
    if (!room) {
      this.logger.warn(`${user.name} tried to leave a non-existing room`);
      throw new NotFoundException(`Room "${room.name}" doesn't exist`);
    }

    this.chatService.leaveRoom(room, body.userId, true);
    return { message: `Succesfully left room "${room.name}"` };
  }

  @ApiNotFoundResponse({ description: "If room or receiver don't exist" })
  @HttpCode(HttpStatus.OK)
  @Post('/invite')
  public async inviteToRoom(
    @ExtractUser() user: User,
    @Body() body: InviteToRoomDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.inviteToRoom(
      user.id,
      body.receiverUID,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room or receiver don't exist" })
  @ApiConflictResponse({ description: 'If sender tries to kick himself' })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/kick')
  public async kickFromRoom(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.kickFromRoom(
      user.id,
      body.userId,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room or user don't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender doesn't have admin privileges",
  })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/ban')
  public async banFromRoom(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.banFromRoom(
      user.id,
      body.userId,
      body.roomId,
    );
  }

  @ApiUnauthorizedResponse({
    description: "If sender doesn't have admin privileges",
  })
  @ApiNotFoundResponse({ description: "If room or user doesn't exist" })
  @UseGuards(AdminGuard)
  @Delete('/ban')
  public async unbanFromRoom(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.unbanFromRoom(
      user.id,
      body.userId,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room or user doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender doesn't have admin privileges",
  })
  @ApiForbiddenResponse({
    description: 'If sender (admin) tries to ban another admin',
  })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/mute')
  public async muteUser(
    @Body() body: MuteUserDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    // Calculate the mute duration in ms to later use on setTimeout()
    let muteDuration: number;
    switch (body.duration) {
      case MuteDuration.THIRTEEN_SEGS:
        muteDuration = 30 * 1000;
        break;
      case MuteDuration.FIVE_MINS:
        muteDuration = 5 * 60 * 1000;
        break;
    }

    return await this.chatService.muteUser(
      body.userId,
      muteDuration,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room or user doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender doesn't have admin privileges",
  })
  @UseGuards(AdminGuard)
  @Delete('/mute')
  public async unmuteUser(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.unmuteUser(body.userId, body.roomId);
  }

  @ApiNotFoundResponse({ description: "If room or user doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender doesn't have admin privileges",
  })
  @ApiConflictResponse({
    description: 'If recipient already have admin privileges',
  })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/add-admin')
  public async addAdmin(
    @ExtractUser() user: User,
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.assignAdminRole(
      user.id,
      body.userId,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room or user doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender doesn't have owner privileges",
  })
  @ApiBadRequestResponse({
    description: "If recipient doesn't have admin privileges",
  })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/remove-admin')
  public async removeAdmin(
    @Body() body: RoomOperationDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.removeAdminRole(body.userId, body.roomId);
  }

  @ApiNotFoundResponse({ description: "If room doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender isn't the room owner",
  })
  @UseGuards(OwnerGuard)
  @Patch('/room-password')
  public async updateRoomPassword(
    @Body() body: UpdateRoomPasswordDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.updateRoomPassword(
      body.newPassword,
      body.roomId,
    );
  }

  @ApiNotFoundResponse({ description: "If room doesn't exist" })
  @ApiUnauthorizedResponse({
    description: "If sender isn't the room owner",
  })
  @UseGuards(OwnerGuard)
  @Delete('/room-password')
  public async removeRoomPassword(
    @Body() body: RemoveRoomPasswordDTO,
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.chatService.removeRoomPassword(body.roomId);
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
    return await this.chatService.findRoomsByRoomNameProximity(query);
  }
}
