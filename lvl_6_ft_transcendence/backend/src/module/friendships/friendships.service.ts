import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
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

  private readonly logger: Logger = new Logger(FriendshipsService.name);

  public async getMyFriendRequests(meUser: User): Promise<FriendRequest[]> {
    const [myFriendRequestsAsReceiver, myFriendRequestsAsSender] =
      await Promise.all([
        this.friendshipRepository.find({
          where: { receiver: meUser, status: FriendshipStatus.PENDING },
          relations: { sender: true },
        }),
        this.friendshipRepository.find({
          where: { sender: meUser, status: FriendshipStatus.PENDING },
          relations: { receiver: true },
        }),
      ]);

    const myFriendRequestsInterfaces: FriendRequest[] = [
      ...myFriendRequestsAsReceiver.map((friendrequest: Friendship) => ({
        friendship_id: friendrequest.id,
        uid: friendrequest.sender.id,
        name: friendrequest.sender.name,
        avatar_url: friendrequest.sender.avatar_url,
        status: friendrequest.status,
        sent_by_me: false,
      })),
      ...myFriendRequestsAsSender.map((friendrequest: Friendship) => ({
        friendship_id: friendrequest.id,
        uid: friendrequest.receiver.id,
        name: friendrequest.receiver.name,
        avatar_url: friendrequest.receiver.avatar_url,
        status: friendrequest.status,
        sent_by_me: true,
      })),
    ];

    return myFriendRequestsInterfaces;
  }

  public async findFriendsByUID(userId: number): Promise<Friend[]> {
    const myFriendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        { receiver: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { sender: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: {
        sender: true,
        receiver: true,
      },
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
    const myBlockedUsers: BlockedUser[] = (
      await this.usersRepository.findOne({
        where: { id: meUID },
        relations: ['blocked_users', 'blocked_users.blocked_user'],
      })
    ).blocked_users;

    const myBlockedUsersInterfaces: BlockedUserInterface[] = myBlockedUsers.map(
      (blockedUser) => {
        return {
          blocked_uid: blockedUser.blocked_user.id,
          name: blockedUser.blocked_user.name,
          avatar_url: blockedUser.blocked_user.avatar_url,
        };
      },
    );

    return myBlockedUsersInterfaces;
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
  ): Promise<SuccessResponse | ErrorResponse> {
    const receiver: User | null = await this.usersRepository.findOneBy({
      id: receiverUID,
    });

    // Throws if the friend request matches wrong conditions
    await this.ensureValidFriendRequest(sender, receiver, receiverUID);

    this.logger.log(
      `"${sender.name}" sent a friend request to "${receiver.name}"`,
    );

    await this.friendshipRepository.save({
      sender: sender,
      receiver: receiver,
    });

    this.connectionGateway.friendRequestReceived(receiver.id);
    return { message: 'Friend request successfully sent' };
  }

  public async updateFriendshipStatus(
    user: User,
    friendshipId: number,
    newFriendshipStatus: FriendshipStatus,
  ): Promise<SuccessResponse | ErrorResponse> {
    const friendship: Friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: {
        sender: true,
        receiver: true,
      },
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

      case FriendshipStatus.UNFRIEND:
        await this.unfriendOrDeleteFriendRequest(user.id, friendship);
    }

    this.logger.log(
      `"${user.name}" ${newFriendshipStatus} the friendship with ${friendship.sender.name}`,
    );
    return {
      message: `Successfully ${newFriendshipStatus} friendship`,
    };
  }

  public async blockUserByUID(
    sender: User,
    userToBlockUID: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const userToBlock: User | null = await this.usersRepository.findOneBy({
      id: userToBlockUID,
    });

    await this.ensureValidBlock(sender, userToBlock, userToBlockUID);
    await this.blockAndDeleteFriendship(sender, userToBlock);

    this.logger.log(`"${sender.name}" blocked ${userToBlock.name}"`);
    return { message: `Successfully blocked "${userToBlock.name}"` };
  }

  public async unblockUserByUID(
    sender: User,
    userToUnblockId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (sender.id == userToUnblockId) {
      this.logger.warn(`"${sender.name}" tried to unblock himself`);
      throw new ConflictException('You cannot unblock yourself');
    }

    const userToUnblock: User | null = await this.usersRepository.findOneBy({
      id: userToUnblockId,
    });

    if (!userToUnblock) {
      this.logger.warn(`"${sender.name}" tried to unblock a non-existing user`);
      throw new NotFoundException(
        `User with id= ${userToUnblockId} doesn't exist`,
      );
    }

    await this.blockedUserRepository.delete({
      user_who_blocked: sender,
      blocked_user: userToUnblock,
    });

    this.logger.log(`"${sender.name}" unblocked "${userToUnblock.name}"`);
    return { message: `Successfully unblocked ${userToUnblock.name}` };
  }

  public async findFriendshipBetween2Users(
    user1: User,
    user2: User,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOne({
      where: [
        { sender: user1, receiver: user2 }, // user1 -> user2
        { sender: user2, receiver: user1 }, // user2 -> user1
      ],
      relations: {
        sender: true,
        receiver: true,
      },
    });
  }

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

  private async declineFriendRequest(friendship: Friendship) {
    await this.achievementsService.grantDeclinedTomorrowBuddies(
      friendship.sender.id,
    );
    await this.friendshipRepository.delete(friendship);
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
    if (receiverUID == sender.id) {
      this.logger.warn(`"${sender.name}" tried to add himself as a friend`);
      throw new BadRequestException('You cannot add yourself as a friend');
    }
    await this.ensureNotBlocked(sender, receiver, 'sender');
    await this.ensureNotBlocked(receiver, sender, 'receiver');
    await this.ensureNoExistingFriendRequest(sender, receiver);
    await this.ensureNotAlreadyFriends(sender, receiver);
  }

  private async ensureNotBlocked(
    user: User,
    target: User,
    userType: 'sender' | 'receiver',
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

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && user_who_blocked = receiver */
  private async isSenderBlocked(
    senderUID: number,
    receiverUID: number,
  ): Promise<boolean> {
    const blockedUserEntry: BlockedUser =
      await this.blockedUserRepository.findOneBy([
        {
          user_who_blocked: { id: receiverUID },
          blocked_user: { id: senderUID },
        }, // sender is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
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
          user_who_blocked: { id: senderUID },
          blocked_user: { id: receiverUID },
        }, // receiver is the blockedUser
      ]);

    return blockedUserEntry ? true : false;
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
          sender: { id: senderUID },
          receiver: { id: receiverUID },
          status: FriendshipStatus.PENDING,
        }, // sender -> receiver
        {
          sender: { id: receiverUID },
          receiver: { id: senderUID },
          status: FriendshipStatus.PENDING,
        }, // receiver -> sender
      ],
    );

    return friendRequest ? true : false;
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
          sender: { id: senderUID },
          receiver: { id: receiverUID },
          status: FriendshipStatus.ACCEPTED,
        },
        // receiver -> sender
        {
          sender: { id: receiverUID },
          receiver: { id: senderUID },
          status: FriendshipStatus.ACCEPTED,
        },
      ]);

    return friendship ? true : false;
  }

  private async findFriendshipBySenderAndReceiver(
    senderUID: number,
    receiverUID: number,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOneBy([
      // sender -> receiver && ACCEPTED
      {
        sender: { id: senderUID },
        receiver: { id: receiverUID },
        status: FriendshipStatus.ACCEPTED,
      },
      // receiver -> sender && ACCEPTED
      {
        sender: { id: receiverUID },
        receiver: { id: senderUID },
        status: FriendshipStatus.ACCEPTED,
      },
      // sender -> receiver && PENDING
      {
        sender: { id: senderUID },
        receiver: { id: receiverUID },
        status: FriendshipStatus.PENDING,
      },
      // receiver -> sender && PENDING
      {
        sender: { id: receiverUID },
        receiver: { id: senderUID },
        status: FriendshipStatus.PENDING,
      },
    ]);
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
      user_who_blocked: userWhoIsBlocking,
      blocked_user: userToBlock,
    });
  }
}
