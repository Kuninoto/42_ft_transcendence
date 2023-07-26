import {
  PipeTransform,
  Injectable,
  BadRequestException } from '@nestjs/common';
import { FriendshipStatus } from 'src/common/types/friendship-status.enum';

@Injectable()
export class FriendshipStatusUpdateValidationPipe implements PipeTransform<any> {
  readonly allowedResponses = [
    'declined',
    'accepted',
    'unfriend',
    'canceled'
  ];

  transform(value: { newStatus: FriendshipStatus }): FriendshipStatus {
    const response = value.newStatus;
    
    if (!response || !this.allowedResponses.includes(response)) {
      throw new BadRequestException('Invalid friendship status');
    }

    return response;
  }
}
