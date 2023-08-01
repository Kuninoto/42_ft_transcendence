import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Friendship, BlockedUser } from 'src/entity/index';
import { UsersService } from '../users/users.service';
import { ErrorResponse } from '../../common/types/error-response.interface';
import { SuccessResponse } from '../../common/types/success-response.interface';
import { FriendInterface } from '../../common/types/friend-interface.interface';
import { BlockedUserInterface } from '../../common/types/blocked-user-interface.interface';
import { FriendRequestInterface } from '../../common/types/friend-request.interface';
import { FriendshipStatus } from '../../common/types/friendship-status.enum';

@Injectable()
export class FriendshipsService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
  ) {}

  private readonly logger: Logger = new Logger(FriendshipsService.name);

  public async getMyFriendRequests(
    meUser: User,
  ): Promise<FriendRequestInterface[]> {
    const myFriendRequests: Friendship[] = await this.friendshipRepository.find(
      {
        where: [{ receiver: meUser, status: FriendshipStatus.PENDING }],
        relations: ['sender'],
      },
    );

    const myFriendRequestsInterfaces: FriendRequestInterface[] =
      myFriendRequests.map((friendrequest: Friendship) => {
        return {
          friendship_id: friendrequest.id,
          uid: friendrequest.sender.id,
          name: friendrequest.sender.name,
          avatar_url: friendrequest.sender.avatar_url,
          status: friendrequest.sender.status,
        };
      });

    return myFriendRequestsInterfaces;
  }

  public async getMyFriends(meUser: User): Promise<FriendInterface[]> {
    const myFriendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        { receiver: meUser, status: FriendshipStatus.ACCEPTED },
        { sender: meUser, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['sender', 'receiver'],
    });

    const myFriendsInterfaces: FriendInterface[] = myFriendships.map(
      (friendship: Friendship) => {
        let friend: User;
        if (meUser.id === friendship.sender.id) {
          friend = friendship.receiver;
        } else if (meUser.id === friendship.receiver.id) {
          friend = friendship.sender;
        }

        return {
          friendship_id: friendship.id,
          uid: friend.id,
          name: friend.name,
          avatar_url: friend.avatar_url,
          status: friend.status,
        };
      },
    );

    return myFriendsInterfaces;
  }

  public async getMyBlocklist(meUID: number): Promise<BlockedUserInterface[]> {
    const myBlockedUsersInfo: BlockedUser[] =
      await this.usersService.getMyBlockedUsersInfo(meUID);

    const myBlockedUsersInterfaces: BlockedUserInterface[] =
      myBlockedUsersInfo.map((blockedUserEntry) => {
        return {
          blocked_uid: blockedUserEntry.blocked_user.id,
          name: blockedUserEntry.blocked_user.name,
          avatar_url: blockedUserEntry.blocked_user.avatar_url,
        };
      });

    return myBlockedUsersInterfaces;
  }

  public async isThereABlockRelationship(
    meUser: User,
    user2UID: number,
  ): Promise<boolean> {
    const user2: User = await this.usersService.findUserByUID(user2UID);

    return (
      (await this.isSenderBlocked(meUser, user2)) ||
      (await this.isReceiverBlocked(meUser, user2))
    );
  }

  public async sendFriendRequest(
    sender: User,
    receiverUID: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (receiverUID == sender.id) {
      this.logger.error(
        '"' + sender.name + '" tried to add himself as a friend',
      );
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const receiver: User | null = await this.usersService.findUserByUID(
      receiverUID,
    );
    if (!receiver) {
      this.logger.error(
        '"' +
          sender.name +
          '" tried to friend request a user that doesn\'t exist',
      );
      throw new BadRequestException(
        'User with id=' + receiverUID + " doesn't exist",
      );
    }

    const isSenderBlocked: boolean = await this.isSenderBlocked(
      sender,
      receiver,
    );
    if (isSenderBlocked) {
      this.logger.error(
        '"' +
          sender.name +
          '" tried to friend request "' +
          receiver.name +
          "but it's blocked by him",
      );
      throw new ForbiddenException(
        'You are blocked by the recipient of this friend request',
      );
    }

    const isReceiverBlocked: boolean = await this.isReceiverBlocked(
      sender,
      receiver,
    );
    if (isReceiverBlocked) {
      this.logger.error(
        '"' +
          sender.name +
          '" tried to friend request "' +
          receiver.name +
          'but he has blocked him',
      );
      throw new ForbiddenException(
        "You've blocked the user that you're trying to send a friend request to",
      );
    }

    const hasBeenSentAlready: boolean =
      await this.hasFriendRequestBeenSentAlready(sender, receiver);
    if (hasBeenSentAlready) {
      this.logger.error(
        '"' +
          sender.name +
          '" tried to friend request "' +
          receiver.name +
          "but there's already a friend request between them",
      );
      throw new ConflictException(
        'A friend request has already been sent (to) or received (on) your account',
      );
    }

    const areTheyFriends: boolean = await this.areTheyFriendsAlready(
      sender,
      receiver,
    );
    if (areTheyFriends) {
      this.logger.error(
        '"' +
          sender.name +
          '" tried to friend request "' +
          receiver.name +
          "but they're friends already",
      );
      throw new ConflictException("You're friends already");
    }

    Logger.log(
      '"' + sender.name + '" sent a friend request to "' + receiver.name + '"',
    );

    await this.friendshipRepository.save({
      sender: sender,
      receiver: receiver,
    });
    return { message: 'Friend request successfully sent' };
  }

  public async updateFriendshipStatus(
    user: User,
    friendshipId: number,
    newFriendshipStatus: FriendshipStatus,
  ): Promise<SuccessResponse | ErrorResponse> {
    const friendship: Friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['sender'],
    });

    if (!friendship) {
      this.logger.error(
        '"' +
          user.name +
          '" tried to update the status of a non-existing friendship',
      );
      throw new NotFoundException('Friendship not found');
    }

    // Sender trying to answer the friend request he sent
    if (
      user.id === friendship.sender.id &&
      (newFriendshipStatus == FriendshipStatus.ACCEPTED ||
        newFriendshipStatus == FriendshipStatus.DECLINED)
    ) {
      this.logger.error(
        '"' + user.name + '" tried to answer a friend request that he has sent',
      );
      throw new BadRequestException(
        'You cannot answer a friend request that you have sent',
      );
    }

    if (
      newFriendshipStatus == FriendshipStatus.CANCEL ||
      newFriendshipStatus == FriendshipStatus.DECLINED ||
      newFriendshipStatus == FriendshipStatus.UNFRIEND
    ) {
      await this.friendshipRepository.delete(friendship);
    } else {
      friendship.status = newFriendshipStatus;
      await this.friendshipRepository.save(friendship);
    }

    Logger.log(
      user.name +
        ' ' +
        newFriendshipStatus +
        ' the friendship with ' +
        friendship.sender.name,
    );
    return { message: 'Successfully updated friendship status' };
  }

  public async blockUserByUID(
    sender: User,
    userToBlockId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (sender.id === userToBlockId) {
      this.logger.error('"' + sender.name + '" tried to block himself');
      throw new ConflictException('You cannot block yourself');
    }

    const userToBlock: User | null = await this.usersService.findUserByUID(
      userToBlockId,
    );

    if (!userToBlock) {
      this.logger.error(
        '"' + sender.name + '" tried to block a non-existing user',
      );
      throw new NotFoundException(
        'User with id=' + userToBlockId + " doesn't exist",
      );
    }

    await this.blockAndDeleteFriendship(sender, userToBlock);

    Logger.log('"' + sender.name + '" blocked "' + userToBlock.name + '"');
    return { message: 'Successfully blocked ' + userToBlock.name };
  }

  public async unblockUserByUID(
    sender: User,
    userToUnblockId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (sender.id == userToUnblockId) {
      this.logger.error('"' + sender.name + '" tried to unblock himself');
      throw new ConflictException('You cannot unblock yourself');
    }

    const userToUnblock: User | null = await this.usersService.findUserByUID(
      userToUnblockId,
    );
    if (!userToUnblock) {
      this.logger.error(
        '"' + sender.name + '" tried to unblock a non-existing user',
      );
      throw new NotFoundException(
        'User with id=' + userToUnblockId + " doesn't exist",
      );
    }

    await this.blockedUserRepository.delete({
      user_who_blocked: sender,
      blocked_user: userToUnblock,
    });

    Logger.log('"' + sender.name + '" unblocked "' + userToUnblock.name + '"');
    return { message: 'Successfully unblocked ' + userToUnblock.name };
  }

  public async findFriendshipBetween2Users(
    user1: User,
    user2: User,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOneBy([
      { sender: user1, receiver: user2 }, // user1 -> user2
      { sender: user2, receiver: user1 }, // user2 -> user1
    ]);
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && user_who_blocked = receiver */
  private async isSenderBlocked(
    sender: User,
    receiver: User,
  ): Promise<boolean> {
    const blockedUserEntry: BlockedUser =
      await this.blockedUserRepository.findOneBy([
        { user_who_blocked: receiver, blocked_user: sender }, // sender is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = receiver && user_who_blocked = sender */
  private async isReceiverBlocked(
    sender: User,
    receiver: User,
  ): Promise<boolean> {
    const blockedUserEntry: BlockedUser =
      await this.blockedUserRepository.findOneBy([
        { user_who_blocked: sender, blocked_user: receiver }, // receiver is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
  }

  private async hasFriendRequestBeenSentAlready(
    sender: User,
    receiver: User,
  ): Promise<boolean> {
    // Check if a friend request between the two users
    // has already been made by one of the parts
    const friendRequest: Friendship = await this.friendshipRepository.findOneBy(
      [
        {
          sender: sender,
          receiver: receiver,
          status: FriendshipStatus.PENDING,
        }, // sender -> receiver
        {
          sender: receiver,
          receiver: sender,
          status: FriendshipStatus.PENDING,
        }, // receiver -> sender
      ],
    );

    return friendRequest ? true : false;
  }

  private async areTheyFriendsAlready(
    sender: User,
    receiver: User,
  ): Promise<boolean> {
    // Check if a friendship exists between the two users
    const friendship: Friendship = await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.ACCEPTED }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.ACCEPTED }, // receiver -> sender
    ]);

    return friendship ? true : false;
  }

  private async findFriendshipBySenderAndReceiver(
    sender: User,
    receiver: User,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.ACCEPTED }, // sender -> receiver && ACCEPTED
      { sender: receiver, receiver: sender, status: FriendshipStatus.ACCEPTED }, // receiver -> sender && ACCEPTED

      { sender: sender, receiver: receiver, status: FriendshipStatus.PENDING }, // sender -> receiver && PENDING
      { sender: receiver, receiver: sender, status: FriendshipStatus.PENDING }, // receiver -> sender && PENDING
    ]);
  }

  private async blockAndDeleteFriendship(
    userWhoIsBlocking: User,
    userToBlock: User,
  ): Promise<void> {
    const isAlreadyBlocked: boolean = await this.isReceiverBlocked(
      userWhoIsBlocking,
      userToBlock,
    );
    if (isAlreadyBlocked) {
      this.logger.error(
        '"' +
          userWhoIsBlocking.name +
          '" tried to block a already-blocked user',
      );
      throw new ConflictException(userToBlock.name + ' is already blocked');
    }

    const friendshipToBreak: Friendship =
      await this.findFriendshipBySenderAndReceiver(
        userWhoIsBlocking,
        userToBlock,
      );
    if (friendshipToBreak) {
      await this.friendshipRepository.delete(friendshipToBreak);
    }

    await this.blockedUserRepository.save({
      user_who_blocked: userWhoIsBlocking,
      blocked_user: userToBlock,
    });
  }
}
