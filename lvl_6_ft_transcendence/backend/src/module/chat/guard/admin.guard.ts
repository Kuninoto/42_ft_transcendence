import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import { ChatService } from '../chat.service';
import { MuteUserDTO } from '../dto/mute-user.dto';
import { RoomOperationDTO } from '../dto/room-operation.dto';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body: RoomOperationDTO | MuteUserDTO = request.body;
    const requestingUser: User = request.user;

    if (!body.roomId || !body.userId) {
      throw new BadRequestException('Invalid request body for an admin action');
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );
    if (!room) {
      throw new NotFoundException(`Room with id=${room.id} doesn't exist`);
    }

    if (!this.chatService.isUserAnAdmin(room, requestingUser.id)) {
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
      throw new ForbiddenException(
        'Admins cannot do any chat room action to other admins',
      );
    }
    return true;
  }
}
