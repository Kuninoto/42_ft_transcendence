import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import { ChatService } from '../chat.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body: any = request.body;

    const user: User = request.user;
    const room: ChatRoom = await this.chatService.findRoomById(body.roomId);

    if (user.id != room.owner.id) {
      throw new UnauthorizedException(
        'You must have owner privileges to request this route',
      );
    }
    return true;
  }
}
