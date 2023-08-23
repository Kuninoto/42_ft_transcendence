import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedUser, Friendship, User } from 'src/entity/index';
import { Repository } from 'typeorm';
import {
  BlockedUserInterface,
  ErrorResponse,
  Friend,
  FriendRequest,
  FriendshipStatus,
  SuccessResponse,
} from 'types';

import { AchievementService } from '../achievement/achievement.service';
import { ConnectionGateway } from '../connection/connection.gateway';

@Injectable()
export class FriendshipsService {
  private readonly logger: Logger = new Logger(FriendshipsService.name);

  constructor(
    @Inject(forwardRef(() => AchievementService))
    private readonly achievementsService: AchievementService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  private async acceptFriendRequest(friendship: Friendship) {
    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipRepository.save(friendship);

    const senderUID: number = friendship.sender.id;
    const receiverUID: number = friendship.receiver.id;

    this.connectionGateway.makeFriendsJoinEachOthersRoom(
      senderUID,
      receiverUID,
    );

    const senderNrFriends: number = (
      await this.findFriendsByUID(friendship.sender.id)
    ).length;
    const receiverNrFriends: number = (
      await this.findFriendsByUID(friendship.receiver.id)
    ).length;

    await this.achievementsService.grantFriendsAchievementsIfEligible(
      senderUID,
      senderNrFriends,
    );

    await this.achievementsService.grantFriendsAchievementsIfEligible(
      receiverUID,
      receiverNrFriends,
    );
  }

  private async blockAndDeleteFriendship(
    userWhoIsBlocking: User,
    userToBlock: User,
  ): Promise<void> {
    const friendshipToBreak: Friendship =
      await this.findFriendshipBySenderAndReceiver(
        userWhoIsBlocking.id,
        userToBlock.id,
      );
    if (friendshipToBreak) {
      await this.friendshipRepository.delete(friendshipToBreak);
    }

    await this.blockedUserRepository.save({
      blocked_user: userToBlock,
      user_who_blocked: userWhoIsBlocking,
    });
  }

  private async declineFriendRequest(friendship: Friendship) {
    await this.achievementsService.grantDeclinedTomorrowBuddies(
      friendship.sender.id,
    );
    await this.friendshipRepository.delete(friendship);
  }

  private async ensureNoExistingFriendRequest(
    sender: User,
    receiver: User,
  ): Promise<void> {
    const hasBeenSentAlready: boolean =
      await this.hasFriendRequestBeenSentAlready(sender.id, receiver.id);
    if (hasBeenSentAlready) {
      throw new ConflictException(
        'A friend request has already been sent or received on your account',
      );
    }
  }

  private async ensureNotAlreadyFriends(
    sender: User,
    receiver: User,
  ): Promise<void> {
    const areTheyFriends: boolean = await this.areTheyFriends(
      sender.id,
      receiver.id,
    );
    if (areTheyFriends) {
      throw new ConflictException("You're friends already");
    }
  }

  private async ensureNotBlocked(
    user: User,
    target: User,
    userType: 'receiver' | 'sender',
  ): Promise<void> {
    const isBlocked: boolean =
      userType === 'sender'
        ? await this.isSenderBlocked(user.id, target.id)
        : await this.isReceiverBlocked(user.id, target.id);

    if (isBlocked) {
      const message: string =
        userType === 'sender'
          ? 'You are blocked by the recipient of this friend request'
          : "You've blocked the user that you're trying to send a friend request to";
      throw new ForbiddenException(message);
    }
  }

  private async ensureValidBlock(
    sender: User,
    userToBlock: User,
    userToBlockUID: number,
  ): Promise<void> {
    if (!userToBlock) {
      this.logger.warn(`"${sender.name}" tried to block a non-existing user`);
      throw new NotFoundException(
        `User with id= ${userToBlockUID} doesn't exist`,
      );
    }

    if (sender.id == userToBlockUID) {
      this.logger.warn(`"${sender.name}" tried to block himself`);
      throw new ConflictException('You cannot block yourself');
    }

    const isAlreadyBlocked: boolean = await this.isReceiverBlocked(
      sender.id,
      userToBlockUID,
    );
    if (isAlreadyBlocked) {
      this.logger.warn(
        `"${sender.name}" tried to block a already-blocked user`,
      );
      throw new ConflictException(userToBlock.name + ' is already blocked');
    }
  }

  private async ensureValidFriendRequest(
    sender: User,
    receiver: User,
    receiverUID: number,
  ): Promise<void> {
    if (!receiver) {
      this.logger.warn(
        `"${sender.name}" tried to friend request a user that doesn't exist`,
      );
      throw new BadRequestException(
        `User with id= ${receiverUID} doesn't exist`,
      );
    }
    if (receiverUID === sender.id) {
      this.logger.warn(`"${sender.name}" tried to add himself as a friend`);
      throw new BadRequestException('You cannot add yourself as a friend');
    }
    await this.ensureNotBlocked(sender, receiver, 'sender');
    await this.ensureNotBlocked(receiver, sender, 'receiver');
    await this.ensureNoExistingFriendRequest(sender, receiver);
    await this.ensureNotAlreadyFriends(sender, receiver);
  }

  private async findFriendshipBySenderAndReceiver(
    senderUID: number,
    receiverUID: number,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOneBy([
      // sender -> receiver && ACCEPTED
      {
        receiver: { id: receiverUID },
        sender: { id: senderUID },
        status: FriendshipStatus.ACCEPTED,
      },
      // receiver -> sender && ACCEPTED
      {
        receiver: { id: senderUID },
        sender: { id: receiverUID },
        status: FriendshipStatus.ACCEPTED,
      },
      // sender -> receiver && PENDING
      {
        receiver: { id: receiverUID },
        sender: { id: senderUID },
        status: FriendshipStatus.PENDING,
      },
      // receiver -> sender && PENDING
      {
        receiver: { id: senderUID },
        sender: { id: receiverUID },
        status: FriendshipStatus.PENDING,
      },
    ]);
  }

  private async hasFriendRequestBeenSentAlready(
    senderUID: number,
    receiverUID: number,
  ): Promise<boolean> {
    // Check if a friend request between the two users
    // has already been made by one of the parts
    const friendRequest: Friendship = await this.friendshipRepository.findOneBy(
      [
        {
          receiver: { id: receiverUID },
          sender: { id: senderUID },
          status: FriendshipStatus.PENDING,
        }, // sender -> receiver
        {
          receiver: { id: senderUID },
          sender: { id: receiverUID },
          status: FriendshipStatus.PENDING,
        }, // receiver -> sender
      ],
    );

    return friendRequest ? true : false;
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = receiver && user_who_blocked = sender */
  private async isReceiverBlocked(
    senderUID: number,
    receiverUID: number,
  ): Promise<boolean> {
    const blockedUserEntry: BlockedUser =
      await this.blockedUserRepository.findOneBy([
        {
          blocked_user: { id: receiverUID },
          user_who_blocked: { id: senderUID },
        }, // receiver is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && user_who_blocked = receiver */
  private async isSenderBlocked(
    senderUID: number,
    receiverUID: number,
  ): Promise<boolean> {
    const blockedUserEntry: BlockedUser =
      await this.blockedUserRepository.findOneBy([
        {
          blocked_user: { id: senderUID },
          user_who_blocked: { id: receiverUID },
        }, // sender is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
  }

  private async unfriendOrDeleteFriendRequest(
    userId: number,
    friendship: Friendship,
  ) {
    await this.achievementsService.grantBreakingThePaddleBond(userId);
    this.connectionGateway.leaveFriendRooms(
      friendship.sender.id,
      friendship.receiver.id,
    );
    await this.friendshipRepository.delete(friendship);
  }

  public async areTheyFriends(
    senderUID: number,
    receiverUID: number,
  ): Promise<boolean> {
    // Check if a friendship exists between the two users
    const friendship: Friendship | null =
      await this.friendshipRepository.findOneBy([
        // sender -> receiver
        {
          receiver: { id: receiverUID },
          sender: { id: senderUID },
          status: FriendshipStatus.ACCEPTED,
        },
        // receiver -> sender
        {
          receiver: { id: senderUID },
          sender: { id: receiverUID },
          status: FriendshipStatus.ACCEPTED,
        },
      ]);

    return friendship ? true : false;
  }

  public async blockUserByUID(
    sender: User,
    userToBlockUID: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    const userToBlock: null | User = await this.usersRepository.findOneBy({
      id: userToBlockUID,
    });

    await this.ensureValidBlock(sender, userToBlock, userToBlockUID);
    await this.blockAndDeleteFriendship(sender, userToBlock);

    this.logger.log(`"${sender.name}" blocked ${userToBlock.name}"`);
    return { message: `Successfully blocked "${userToBlock.name}"` };
  }

  public async findFriendsByUID(userId: number): Promise<Friend[]> {
    const myFriendships: Friendship[] = await this.friendshipRepository.find({
      relations: {
        receiver: true,
        sender: true,
      },
      where: [
        { receiver: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { sender: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
    });

    const myFriendsInterfaces: Friend[] = myFriendships.map(
      (friendship: Friendship) => {
        let friend: User;
        if (userId === friendship.sender.id) {
          friend = friendship.receiver;
        } else if (userId === friendship.receiver.id) {
          friend = friendship.sender;
        }

        return {
          avatar_url: friend.avatar_url,
          friendship_id: friendship.id,
          name: friend.name,
          status: friend.status,
          uid: friend.id,
        };
      },
    );

    return myFriendsInterfaces;
  }

  public async findFriendshipBetween2Users(
    user1: User,
    user2: User,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOne({
      relations: {
        receiver: true,
        sender: true,
      },
      where: [
        { receiver: user2, sender: user1 }, // user1 -> user2
        { receiver: user1, sender: user2 }, // user2 -> user1
      ],
    });
  }

  public async getMyBlocklist(meUID: number): Promise<BlockedUserInterface[]> {
    const myBlockedUsers: BlockedUser[] = (
      await this.usersRepository.findOne({
        relations: ['blocked_users', 'blocked_users.blocked_user'],
        where: { id: meUID },
      })
    ).blocked_users;

    const myBlockedUsersInterfaces: BlockedUserInterface[] = myBlockedUsers.map(
      (blockedUser) => {
        return {
          avatar_url: blockedUser.blocked_user.avatar_url,
          blocked_uid: blockedUser.blocked_user.id,
          name: blockedUser.blocked_user.name,
        };
      },
    );

    return myBlockedUsersInterfaces;
  }

  public async getMyFriendRequests(meUser: User): Promise<FriendRequest[]> {
    const [myFriendRequestsAsReceiver, myFriendRequestsAsSender] =
      await Promise.all([
        this.friendshipRepository.find({
          relations: { sender: true },
          where: { receiver: meUser, status: FriendshipStatus.PENDING },
        }),
        this.friendshipRepository.find({
          relations: { receiver: true },
          where: { sender: meUser, status: FriendshipStatus.PENDING },
        }),
      ]);

    const myFriendRequestsInterfaces: FriendRequest[] = [
      ...myFriendRequestsAsReceiver.map((friendrequest: Friendship) => ({
        avatar_url: friendrequest.sender.avatar_url,
        friendship_id: friendrequest.id,
        name: friendrequest.sender.name,
        sent_by_me: false,
        status: friendrequest.status,
        uid: friendrequest.sender.id,
      })),
      ...myFriendRequestsAsSender.map((friendrequest: Friendship) => ({
        avatar_url: friendrequest.receiver.avatar_url,
        friendship_id: friendrequest.id,
        name: friendrequest.receiver.name,
        sent_by_me: true,
        status: friendrequest.status,
        uid: friendrequest.receiver.id,
      })),
    ];

    return myFriendRequestsInterfaces;
  }

  public async isThereABlockRelationship(
    meUserUID: number,
    user2UID: number,
  ): Promise<boolean> {
    return (
      (await this.isSenderBlocked(meUserUID, user2UID)) ||
      (await this.isReceiverBlocked(meUserUID, user2UID))
    );
  }

  public async sendFriendRequest(
    sender: User,
    receiverUID: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    const receiver: null | User = await this.usersRepository.findOneBy({
      id: receiverUID,
    });

    // Throws if the friend request matches wrong conditions
    await this.ensureValidFriendRequest(sender, receiver, receiverUID);

    this.logger.log(
      `"${sender.name}" sent a friend request to "${receiver.name}"`,
    );

    await this.friendshipRepository.save({
      receiver: receiver,
      sender: sender,
    });

    this.connectionGateway.friendRequestReceived(receiver.id);
    return { message: 'Friend request successfully sent' };
  }

  public async unblockUserByUID(
    sender: User,
    userToUnblockId: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    if (sender.id == userToUnblockId) {
      this.logger.warn(`"${sender.name}" tried to unblock himself`);
      throw new ConflictException('You cannot unblock yourself');
    }

    const userToUnblock: null | User = await this.usersRepository.findOneBy({
      id: userToUnblockId,
    });

    if (!userToUnblock) {
      this.logger.warn(`"${sender.name}" tried to unblock a non-existing user`);
      throw new NotFoundException(
        `User with id= ${userToUnblockId} doesn't exist`,
      );
    }

    await this.blockedUserRepository.delete({
      blocked_user: userToUnblock,
      user_who_blocked: sender,
    });

    this.logger.log(`"${sender.name}" unblocked "${userToUnblock.name}"`);
    return { message: `Successfully unblocked ${userToUnblock.name}` };
  }

  public async updateFriendshipStatus(
    user: User,
    friendshipId: number,
    newFriendshipStatus: FriendshipStatus,
  ): Promise<ErrorResponse | SuccessResponse> {
    const friendship: Friendship = await this.friendshipRepository.findOne({
      relations: {
        receiver: true,
        sender: true,
      },
      where: { id: friendshipId },
    });

    if (!friendship) {
      this.logger.warn(
        `"${user.name}" tried to update the status of a non-existing friendship`,
      );
      throw new NotFoundException('Friendship not found');
    }

    // Sender trying to answer the friend request he sent
    if (
      user.id === friendship.sender.id &&
      (newFriendshipStatus == FriendshipStatus.ACCEPTED ||
        newFriendshipStatus == FriendshipStatus.DECLINED)
    ) {
      this.logger.warn(
        `"${user.name}" tried to answer a friend request that he has sent`,
      );
      throw new BadRequestException(
        'You cannot answer a friend request that you have sent',
      );
    }

    switch (newFriendshipStatus) {
      case FriendshipStatus.ACCEPTED:
        await this.acceptFriendRequest(friendship);
        break;

      case FriendshipStatus.DECLINED:
        await this.declineFriendRequest(friendship);
        break;

      case FriendshipStatus.UNFRIEND:
        await this.unfriendOrDeleteFriendRequest(user.id, friendship);
        break;
    }

    this.logger.log(
      `"${user.name}" ${newFriendshipStatus} the friendship with ${friendship.sender.name}`,
    );
    return {
      message: `Successfully ${newFriendshipStatus} friendship`,
    };
  }
}
