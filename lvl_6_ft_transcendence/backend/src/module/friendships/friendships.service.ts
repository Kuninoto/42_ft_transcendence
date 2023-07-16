import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Friendship, BlockedUser } from 'src/typeorm';
import { UsersService } from '../users/users.service';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import { FriendInterface } from './types/friend-interface.interface';
import { BlockedUserInterface } from 'src/common/types/blocked-user-interface.interface';
import { FriendshipStatus } from 'src/entity/friendship.entity';
import { FriendRequestInterface } from './types/friend-request.interface';

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>
  ) { }

  public async getMyFriendRequests(meUser: User): Promise<FriendRequestInterface[]> {
    const myFriendRequests: Friendship[] = await this.friendshipRepository.find({
      where: [
        { receiver: meUser, status: FriendshipStatus.PENDING },
      ],
      relations: ['sender'],
    });

    const myFriendRequestsInterfaces: FriendRequestInterface[]
      = myFriendRequests.map((friendrequest: Friendship) => {
        return {
          friendship_id: friendrequest.id,
          friend_uid: friendrequest.sender.id,
          friend_name: friendrequest.sender.name,
          friend_avatar_url: friendrequest.sender.avatar_url,
          friendship_status: friendrequest.sender.status,
        }
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

    const myFriendsInterfaces: FriendInterface[] = myFriendships.map((friendship: Friendship) => {
      let friend: User;
      if (meUser.id === friendship.sender.id) {
        friend = friendship.receiver;
      } else if (meUser.id === friendship.receiver.id) {
        friend = friendship.sender;
      }

      return {
        friendship_id: friendship.id,
        friend_uid: friend.id,
        friend_name: friend.name,
        friend_avatar_url: friend.avatar_url,
        friend_status: friend.status,
      };
    });

    return myFriendsInterfaces;
  }

  public async getMyBlockedUsers(meUID: number): Promise<BlockedUserInterface[]> {
    const myBlockedUsersInfo: BlockedUser[] = await this.usersService.getMyBlockedUsersInfo(meUID);

    const myBlockedUsersInterfaces: BlockedUserInterface[] = myBlockedUsersInfo.map((blockedUserEntry) => {
      return {
        blocked_uid: blockedUserEntry.id,
        name: blockedUserEntry.blockedUser.name,
        avatar_url: blockedUserEntry.blockedUser.avatar_url
      }
    });

    return myBlockedUsersInterfaces;
  }

  public async sendFriendRequest(sender: User, receiverUID: number)
    : Promise<SuccessResponse | ErrorResponse> {
    if (receiverUID == sender.id) {
      throw new BadRequestException("You cannot add yourself as a friend");
    }

    const receiver: User | null = await this.usersService.findUserByUID(receiverUID);
    if (!receiver) {
      throw new BadRequestException("User with id=" + receiverUID + " doesn't exist");
    }

    const isSenderBlocked: boolean = await this.isSenderBlocked(sender, receiver)
    if (isSenderBlocked) {
      throw new ForbiddenException("You are blocked by the recipient");
    }

    const hasBeenSentAlready: boolean = await this.hasFriendshipBeenEstabilishedAlready(sender, receiver);
    if (hasBeenSentAlready) {
      throw new ConflictException("A friend request has already been sent (to) or received (on) your account");
    }

    const areTheyFriends: boolean = await this.areTheyFriendsAlready(sender, receiver);
    if (areTheyFriends) {
      throw new ConflictException("You're already friends")
    }

    Logger.log("\"" + sender.name + "\" sent a friend request to \"" + receiver.name + "\"");

    await this.friendshipRepository.save({
      sender: sender,
      receiver: receiver
    });
    return { message: "Friend request successfully sent" };
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
      throw new NotFoundException("Friendship not found");
    }

    // Sender trying to answer the friend request he sent
    if (user.id === friendship.sender.id
      && (newFriendshipStatus == FriendshipStatus.ACCEPTED
        || newFriendshipStatus == FriendshipStatus.DECLINED)) {
      throw new BadRequestException("You cannot answer a friend request that you have sent");
    }

    if (newFriendshipStatus == FriendshipStatus.CANCEL
      || newFriendshipStatus == FriendshipStatus.UNFRIEND) {
      await this.friendshipRepository.delete(friendship);
    } else {
      friendship.status = newFriendshipStatus;
      await this.friendshipRepository.save(friendship);
    }

    Logger.log(user.name + " " + newFriendshipStatus + " the friendship with " + friendship.sender.name);
    return { message: "Successfully updated friendship status" };
  }

  public async blockUserByUID(
    sender: User,
    userToBlockId: number
  ): Promise<SuccessResponse | ErrorResponse> {
    if (sender.id === userToBlockId) {
      throw new ConflictException("You cannot block yourself");
    }
    
    const userToBlock: User | null = await this.usersService.findUserByUID(userToBlockId);

    if (!userToBlock) {
      throw new NotFoundException("User with id=" + userToBlockId + " doesn't exist");
    }

    await this.blockAndDeleteFriendship(sender, userToBlock);

    Logger.log("\"" + sender.name + "\" blocked \"" + userToBlock.name + "\"")
    return { message: "Successfully blocked " + userToBlock.name };
  }

  public async unblockUserByUID(
    sender: User,
    userToUnblockId: number
  ): Promise<SuccessResponse | ErrorResponse> {
    if (sender.id == userToUnblockId) {
      throw new ConflictException("You cannot unblock yourself");
    }

    const userToUnblock: User | null = await this.usersService.findUserByUID(userToUnblockId);
    if (!userToUnblock) {
      throw new NotFoundException("User with id=" + userToUnblockId + " doesn't exist");
    }

    await this.blockedUserRepository.delete({ userWhoBlocked: sender, blockedUser: userToUnblock });

    Logger.log("\"" + sender.name + "\" unblocked \"" + userToUnblock.name + "\"")
    return { message: "Successfully unblocked " + userToUnblock.name };
  }

  private async hasFriendshipBeenEstabilishedAlready(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    // Check if a friend request between the two users
    // has already been made by one of the parts
    const friendRequest: Friendship = await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.PENDING }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.PENDING }, // receiver -> sender
    ]);

    return friendRequest ? true : false;
  }

  private async areTheyFriendsAlready(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    // Check if a friendship exists between the two users
    const friendship: Friendship = await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.ACCEPTED }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.ACCEPTED }, // receiver -> sender
    ]);

    return friendship ? true : false;
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && userWhoBlocked = receiver */
  private async isSenderBlocked(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    const blockedUserEntry: BlockedUser = await this.blockedUserRepository.findOneBy([
      { userWhoBlocked: receiver, blockedUser: sender } // sender is the blockedUser
    ]);

    return blockedUserEntry ? true : false;
  }

  private async isReceiverAlreadyBlocked(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    const blockedUserEntry: BlockedUser = await this.blockedUserRepository.findOneBy([
      { userWhoBlocked: sender, blockedUser: receiver } // sender is the blockedUser
    ]);

    return blockedUserEntry ? true : false;
  }

  private async findFriendShipBySenderAndReceiver(
    sender: User,
    receiver: User
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.ACCEPTED }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.ACCEPTED } // receiver -> sender
    ]);
  }

  private async blockAndDeleteFriendship(
    userWhoIsBlocking: User,
    userToBlock: User
  ): Promise<void> {
    const isAlreadyBlocked: boolean = await this.isReceiverAlreadyBlocked(userWhoIsBlocking, userToBlock);
    if (isAlreadyBlocked) {
      throw new ConflictException(userToBlock.name + " is already blocked");
    }

    const friendshipToBreak: Friendship = await this.findFriendShipBySenderAndReceiver(userWhoIsBlocking, userToBlock);
    if (friendshipToBreak) {
      await this.friendshipRepository.delete(friendshipToBreak);
    }

    await this.blockedUserRepository.save({
      userWhoBlocked: userWhoIsBlocking,
      blockedUser: userToBlock
    })
  }
}
