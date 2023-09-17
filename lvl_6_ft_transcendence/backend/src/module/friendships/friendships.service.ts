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
  NewFriendshipStatus,
  SuccessResponse,
} from 'types';
import { AchievementService } from '../achievement/achievement.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { UserStatsService } from '../user-stats/user-stats.service';

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
    private readonly usersStatsService: UserStatsService,
  ) {}

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
  ): Promise<SuccessResponse | ErrorResponse> {
    const userToBlock: User | null = await this.usersRepository.findOneBy({
      id: userToBlockUID,
    });

    await this.ensureValidBlock(sender, userToBlock, userToBlockUID);
    await this.blockAndDeleteFriendship(sender, userToBlock);

    this.logger.log(`"${sender.name}" blocked ${userToBlock.name}"`);
    return { message: `Successfully blocked "${userToBlock.name}"` };
  }

  public async findFriendsByUID(meUID: number): Promise<Friend[]> {
    const myFriendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        { receiver: { id: meUID }, status: FriendshipStatus.ACCEPTED },
        { sender: { id: meUID }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: {
        receiver: true,
        sender: true,
      },
    });

    const myFriendsInterfaces: Friend[] = await Promise.all(
      myFriendships.map(async (friendship: Friendship): Promise<Friend> => {
        let friend: User;
        if (meUID === friendship.sender.id) {
          friend = friendship.receiver;
        } else if (meUID === friendship.receiver.id) {
          friend = friendship.sender;
        }

        return {
          uid: friend.id,
          name: friend.name,
          avatar_url: friend.avatar_url,
          friendship_id: friendship.id,
          status: friend.status,
          ladder_level: await this.usersStatsService.findLadderLevelByUID(
            friend.id,
          ),
        };
      }),
    );
    return myFriendsInterfaces;
  }

  public async findFriendshipBetween2Users(
    user1UID: number,
    user2UID: number,
  ): Promise<Friendship | null> {
    return await this.friendshipRepository.findOne({
      where: [
        { receiver: { id: user2UID }, sender: { id: user1UID } }, // user1 -> user2
        { receiver: { id: user1UID }, sender: { id: user2UID } }, // user2 -> user1
      ],
      relations: {
        receiver: true,
        sender: true,
      },
    });
  }

  public async findBlocklistByUID(
    userId: number,
  ): Promise<BlockedUserInterface[]> {
    const myBlockedUsers: BlockedUser[] = (
      await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['blocked_users', 'blocked_users.blocked_user'],
      })
    ).blocked_users;

    const myBlockedUsersInterfaces: BlockedUserInterface[] = myBlockedUsers.map(
      (blockedUser: BlockedUser): BlockedUserInterface => {
        return {
          blocked_uid: blockedUser.blocked_user.id,
          avatar_url: blockedUser.blocked_user.avatar_url,
          name: blockedUser.blocked_user.name,
        };
      },
    );

    return myBlockedUsersInterfaces;
  }

  public async findFriendRequestsByUID(
    userId: number,
  ): Promise<FriendRequest[]> {
    const [myFriendRequestsAsReceiver, myFriendRequestsAsSender] =
      await Promise.all([
        this.friendshipRepository.find({
          where: { receiver: { id: userId }, status: FriendshipStatus.PENDING },
          relations: { sender: true },
        }),
        this.friendshipRepository.find({
          where: { sender: { id: userId }, status: FriendshipStatus.PENDING },
          relations: { receiver: true },
        }),
      ]);

    const myFriendRequestsInterfaces: FriendRequest[] = [
      ...myFriendRequestsAsReceiver.map(
        (friendrequest: Friendship): FriendRequest => ({
          friendship_id: friendrequest.id,
          uid: friendrequest.sender.id,
          name: friendrequest.sender.name,
          avatar_url: friendrequest.sender.avatar_url,
          status: friendrequest.status,
          sent_by_me: false,
        }),
      ),
      ...myFriendRequestsAsSender.map(
        (friendrequest: Friendship): FriendRequest => ({
          friendship_id: friendrequest.id,
          uid: friendrequest.receiver.id,
          name: friendrequest.receiver.name,
          avatar_url: friendrequest.receiver.avatar_url,
          status: friendrequest.status,
          sent_by_me: true,
        }),
      ),
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
      receiver: receiver,
      sender: sender,
    });

    this.connectionGateway.sendfriendRequestReceived(receiver.id);
    return { message: 'Friend request successfully sent' };
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
      throw new NotFoundException("User doesn't exist");
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
    newStatus: NewFriendshipStatus,
  ): Promise<SuccessResponse | ErrorResponse> {
    const friendship: Friendship | null =
      await this.friendshipRepository.findOne({
        where: { id: friendshipId },
        relations: {
          receiver: true,
          sender: true,
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
      (newStatus == NewFriendshipStatus.ACCEPTED ||
        newStatus == NewFriendshipStatus.DECLINED)
    ) {
      this.logger.warn(
        `"${user.name}" tried to answer a friend request that he has sent`,
      );
      throw new BadRequestException(
        'You cannot answer a friend request that you have sent',
      );
    }

    switch (newStatus) {
      case NewFriendshipStatus.ACCEPTED:
        await this.acceptFriendRequest(friendship);
        break;

      case NewFriendshipStatus.DECLINED:
        await this.declineFriendRequest(friendship);
        break;

      case NewFriendshipStatus.CANCEL:
        await this.deleteFriendRequest(user.id, friendship);
        break;
      
      case NewFriendshipStatus.UNFRIEND:
        await this.unfriend(user.id, friendship);
        break;
    }

    this.logger.log(
      `"${user.name}" ${newStatus} the friendship with ${friendship.sender.name}`,
    );
    return { message: `Successfully ${newStatus} friendship` };
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && user_who_blocked = receiver */
  public async isSenderBlocked(
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

  /* Searches for an entry on the blocked_user table
  where blockedUser = receiver && user_who_blocked = sender */
  public async isReceiverBlocked(
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

  private async acceptFriendRequest(friendship: Friendship) {
    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipRepository.save(friendship);

    const senderUID: number = friendship.sender.id;
    const receiverUID: number = friendship.receiver.id;

    this.connectionGateway.makeFriendsJoinEachOthersRoom(
      senderUID,
      receiverUID,
    );

    this.connectionGateway.sendRefreshUser(senderUID);

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

  private async declineFriendRequest(friendship: Friendship): Promise<void> {
    await this.achievementsService.grantRejectedButNotDejected(
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
    userType: 'sender' | 'receiver',
  ): Promise<void> {
    const isBlocked: boolean =
      userType === 'sender'
        ? await this.isSenderBlocked(user.id, target.id)
        : await this.isReceiverBlocked(user.id, target.id);

    if (isBlocked) {
      const message: string =
        userType === 'sender'
          ? 'You are blocked by the receiver of this friend request'
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
      throw new NotFoundException("User doesn't exist");
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

   private async deleteFriendRequest(
    userId: number,
    friendship: Friendship,
  ): Promise<void> {
    if (friendship.status !== FriendshipStatus.PENDING)
      throw new ConflictException("Friend request already dispatched")

    await this.friendshipRepository.delete(friendship);
    await this.achievementsService.grantBreakingThePaddleBond(userId);
  }

  private async unfriend(
    userId: number,
    friendship: Friendship,
  ): Promise<void> {
    this.connectionGateway.leaveFriendRooms(
      friendship.sender.id,
      friendship.receiver.id,
    );

    const removedUserId: number =
      friendship.sender.id == userId
        ? friendship.receiver.id
        : friendship.sender.id;

    this.connectionGateway.sendRefreshUser(removedUserId);
    
    await this.friendshipRepository.delete(friendship);
    await this.achievementsService.grantBreakingThePaddleBond(userId);
  }
}
