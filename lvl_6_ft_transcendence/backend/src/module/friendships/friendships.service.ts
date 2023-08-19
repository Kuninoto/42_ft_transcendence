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
import { BlockedUser, Friendship, User } from 'src/typeorm/index';
import { Repository } from 'typeorm';
import {
  BlockedUserInterface,
  ErrorResponse,
  Friend,
  FriendRequestInterface,
  FriendshipStatus,
  SuccessResponse,
} from 'types';
import { AchievementService } from '../achievement/achievement.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';

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

  public async getMyFriendRequests(
    meUser: User,
  ): Promise<FriendRequestInterface[]> {
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

    const myFriendRequestsInterfaces: FriendRequestInterface[] = [
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
    if (receiverUID == sender.id) {
      this.logger.warn(
        '"' + sender.name + '" tried to add himself as a friend',
      );
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const receiver: User | null = await this.usersRepository.findOneBy({
      id: receiverUID,
    });
    if (!receiver) {
      this.logger.warn(
        '"' +
          sender.name +
          '" tried to friend request a user that doesn\'t exist',
      );
      throw new BadRequestException(
        'User with id=' + receiverUID + " doesn't exist",
      );
    }

    const isSenderBlocked: boolean = await this.isSenderBlocked(
      sender.id,
      receiver.id,
    );
    if (isSenderBlocked) {
      this.logger.warn(
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
      sender.id,
      receiver.id,
    );
    if (isReceiverBlocked) {
      this.logger.warn(
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
      await this.hasFriendRequestBeenSentAlready(sender.id, receiver.id);
    if (hasBeenSentAlready) {
      this.logger.warn(
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
      this.logger.warn(
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

    this.connectionGateway.newFriendRequest(receiver.id);
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
      this.logger.warn(
        '"' + user.name + '" tried to answer a friend request that he has sent',
      );
      throw new BadRequestException(
        'You cannot answer a friend request that you have sent',
      );
    }

    if (
      newFriendshipStatus == FriendshipStatus.DECLINED ||
      newFriendshipStatus == FriendshipStatus.UNFRIEND
    ) {
      if (newFriendshipStatus == FriendshipStatus.DECLINED) {
        await this.achievementsService.grantDeclinedTomorrowBuddies(
          friendship.sender.id,
        );
      } else await this.achievementsService.grantBreakingThePaddleBond(user.id);

      await this.friendshipRepository.delete(friendship);
    } else {
      // ACCEPTED
      friendship.status = newFriendshipStatus;
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
      this.logger.warn('"' + sender.name + '" tried to block himself');
      throw new ConflictException('You cannot block yourself');
    }

    const userToBlock: User | null = await this.usersRepository.findOneBy({
      id: userToBlockId,
    });

    if (!userToBlock) {
      this.logger.warn(
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
      this.logger.warn('"' + sender.name + '" tried to unblock himself');
      throw new ConflictException('You cannot unblock yourself');
    }

    const userToUnblock: User | null = await this.usersRepository.findOneBy({
      id: userToUnblockId,
    });

    if (!userToUnblock) {
      this.logger.warn(
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
      userWhoIsBlocking.id,
      userToBlock.id,
    );
    if (isAlreadyBlocked) {
      this.logger.warn(
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
