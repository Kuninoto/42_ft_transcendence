import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { FriendshipStatus } from 'src/entity/friendship.entity';

@Injectable()
export class FriendRequestResponseValidationPipe implements PipeTransform<any> {
  readonly allowedResponses = ['accepted', 'declined', 'blocked', 'canceled'];

  transform(value: { response: FriendshipStatus }, metadata: ArgumentMetadata) {
    if (!value || !value.response || !this.allowedResponses.includes(value.response)) {
      throw new BadRequestException('Invalid response to a friend request');
    }

    return value;
  }
}
