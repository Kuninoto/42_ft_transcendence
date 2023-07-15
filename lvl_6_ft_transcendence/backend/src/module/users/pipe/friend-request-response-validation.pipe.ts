import {
  PipeTransform,
  Injectable,
  BadRequestException } from '@nestjs/common';
import { FriendshipStatus } from 'src/entity/friendship.entity';

@Injectable()
export class FriendshipStatusUpdateValidationPipe implements PipeTransform<any> {
  readonly allowedResponses = [
    'declined',
    'accepted',
    'blocked',
    'unblocked',
    'canceled'
  ];

  transform(value: any): FriendshipStatus {
    const response = value;
    
    if (!response || !this.allowedResponses.includes(response)) {
      throw new BadRequestException('Invalid response to a friend request');
    }
    return response;
  }
}
