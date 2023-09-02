import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import { ChatService } from '../chat.service';
import { MuteUserRequest } from '../../../../types/chat/request/mute-user-request.interface';
import { RoomOperationRequest } from '../../../../types/chat/request/room-operation-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  private readonly logger: Logger = new Logger(AdminGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body: RoomOperationRequest | MuteUserRequest = request.body;
    const requestingUser: User = request.user;

    if (!body.roomId || !body.userId) {
      this.logger.warn(
        `${requestingUser.name} tried to request an admin action with an invalid request body`,
      );
      throw new BadRequestException('Invalid request body for an admin action');
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );
    if (!room) {
      this.logger.warn(
        `${requestingUser.name} tried to do an admin action on a non-existing room`,
      );
      throw new NotFoundException(`Room with id=${room.id} doesn't exist`);
    }

    if (!this.chatService.isUserAnAdmin(room, requestingUser.id)) {
      this.logger.warn(
        `${requestingUser.name} tried to do an admin action on a room where he doesn't have admin privileges`,
      );
      throw new UnauthorizedException(
        'You must have admin privileges to request this route',
      );
    }

    /* Because admins can't do any chat room action to other admins
    i.e kick ban or mute, we'll also check that here to avoid repetition on
    chat room functions */
    const userIdToDoAction: number = body.userId;

    if (
      requestingUser.id != room.owner.id &&
      this.chatService.isUserAnAdmin(room, userIdToDoAction)
    ) {
      this.logger.warn(
        `${requestingUser.name} tried to do an admin action on another admin`,
      );
      throw new ForbiddenException(
        'Admins cannot do any chat room action to other admins',
      );
    }
    return true;
  }
}
