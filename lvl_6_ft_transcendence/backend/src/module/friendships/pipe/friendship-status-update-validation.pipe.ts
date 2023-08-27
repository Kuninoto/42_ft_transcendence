import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { FriendshipStatus, FriendshipStatusUpdationRequest } from 'types';

@Injectable()
export class FriendshipStatusUpdateValidationPipe
  implements PipeTransform<any>
{
  private readonly logger: Logger = new Logger();

  readonly allowedResponses: string[] = [
    FriendshipStatus.ACCEPTED,
    FriendshipStatus.DECLINED,
    FriendshipStatus.UNFRIEND,
  ];

  transform(value: FriendshipStatusUpdationRequest): FriendshipStatus {
    const response = value.newStatus;

    if (!response || !this.allowedResponses.includes(response)) {
      this.logger.warn(
        'A request to update a friendship status was made with an invalid status',
      );
      throw new BadRequestException('Invalid friendship status');
    }

    return response;
  }
}
