import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FriendshipStatus } from 'src/common/types/friendship-status.enum';

@Injectable()
export class FriendshipStatusUpdateValidationPipe
  implements PipeTransform<any>
{
  private readonly logger: Logger = new Logger();

  readonly allowedResponses = ['declined', 'accepted', 'unfriend', 'canceled'];

  transform(value: { newStatus: FriendshipStatus }): FriendshipStatus {
    const response = value.newStatus;

    if (!response || !this.allowedResponses.includes(response)) {
      this.logger.error(
        'A request to update a friendship status was made with an invalid status',
      );
      throw new BadRequestException('Invalid friendship status');
    }

    return response;
  }
}
