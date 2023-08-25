import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRoom, User } from 'src/entity';
import { ChatService } from '../chat.service';
import { RemoveRoomPasswordDTO } from '../dto/remove-room-password.dto';
import { RoomOperationDTO } from '../dto/room-operation.dto';
import { UpdateRoomPasswordDTO } from '../dto/update-room-password.dto';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const body:
      | RoomOperationDTO
      | UpdateRoomPasswordDTO
      | RemoveRoomPasswordDTO = request.body;

    if (!body.roomId) {
      throw new BadRequestException(
        'Invalid request body for a chat room action',
      );
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      body.roomId,
    );

    if (!room) {
      throw new NotFoundException(`Room with id=${room.id} doesn't exist`);
    }

    const user: User = request.user;

    if (user.id != room.owner.id) {
      throw new UnauthorizedException(
        'You must have owner privileges to request this route',
      );
    }
    return true;
  }
}
