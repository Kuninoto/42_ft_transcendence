import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { FriendRequestStatus } from 'src/entity/friend-request.entity';

@Injectable()
export class FriendRequestResponseValidationPipe implements PipeTransform<any> {
  readonly allowedResponses = ['accepted', 'declined'];

  transform(value: { response: FriendRequestStatus }, metadata: ArgumentMetadata) {
    if (!value || !value.response || !this.allowedResponses.includes(value.response)) {
      throw new BadRequestException('Invalid response to a friend request');
    }

    return value;
  }
}
