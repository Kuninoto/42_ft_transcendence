import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException } from '@nestjs/common';
import { FriendshipStatus } from 'src/entity/friendship.entity';

@Injectable()
export class FriendRequestResponseValidationPipe implements PipeTransform<any> {
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
    const responseAsEnumKey: keyof typeof FriendshipStatus = response;
    return FriendshipStatus[responseAsEnumKey];
  }
}
