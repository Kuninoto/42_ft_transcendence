import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import { ChatService } from '../chat.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body: any = request.body;

    const user: User = request.user;
    const room: ChatRoom = await this.chatService.findRoomById(body.roomId);
    /* Because admins can't do any chat room action to other admins
    i.e kick ban or mute, we'll also check that here to avoid repeatition on
    chat room functions */
    const userIdToDoAction: number = request.userId;

    if (!this.chatService.isUserAnAdmin(room, user.id)) {
      throw new UnauthorizedException(
        'You must have admin privileges to request this route',
      );
    }

    if (
      user.id != room.owner.id &&
      this.chatService.isUserAnAdmin(room, userIdToDoAction)
    ) {
      throw new ForbiddenException(
        'Admins cannot do any chat room action to other admins',
      );
    }
    return true;
  }
}
