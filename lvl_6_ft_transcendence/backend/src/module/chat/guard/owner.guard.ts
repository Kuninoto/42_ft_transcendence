import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import {
  RemoveRoomPasswordRequest,
  RoomOperationRequest,
  UpdateRoomPasswordRequest
} from 'types';
import { ChatService } from '../chat.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  private readonly logger: Logger = new Logger(OwnerGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body:
      | RoomOperationRequest
      | UpdateRoomPasswordRequest
      | RemoveRoomPasswordRequest = request.body;
    const requestingUser: User = request.user;

    if (!body.roomId) {
      throw new BadRequestException(
        'Invalid request body for a chat room action',
      );
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );

    if (!room) {
      this.logger.warn(
        `${requestingUser.name} tried to do an owner action on a non-existing room`,
      );
      throw new NotFoundException(`Room with id=${room.id} doesn't exist`);
    }

    if (requestingUser.id != room.owner.id) {
      this.logger.warn(
        `${requestingUser.name} tried to do an owner action but he doesn't have owner privileges`,
      );
      throw new UnauthorizedException(
        'You must have owner privileges to request this route',
      );
    }
    return true;
  }
}
