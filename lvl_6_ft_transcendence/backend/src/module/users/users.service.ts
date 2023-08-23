import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import {
  ChatRoomI,
  ErrorResponse,
  Friend,
  FriendshipStatus,
  GameResultInterface,
  GameThemes,
  MeUserInfo,
  OpponentInfo,
  SuccessResponse,
  UserProfile,
  UserSearchInfo,
  UserStatus,
} from 'types';

import {
  BlockedUser,
  ChatRoom,
  Friendship,
  GameResult,
  User,
} from '../../entity/index';
import { AchievementService } from '../achievement/achievement.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { UserStatsService } from '../user-stats/user-stats.service';
import { CreateUserDTO } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly userStatsService: UserStatsService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    private readonly achievementService: AchievementService,
  ) {}

  private async doesNameConflictWithAnyIntraName(
    newName: string,
    userId: number,
  ): Promise<boolean> {
    const user: User | null = await this.usersRepository.findOneBy({
      intra_name: newName,
    });

    // If a user with intra_name = newName exists
    // and it isn't the requesting user it's because
    // newName would conflict with someone else's intra_name
    return user && user.id != userId;
  }

  private async isNameAlreadyTaken(newName: string): Promise<boolean> {
    const user: User | null = await this.usersRepository.findOneBy({
      name: newName,
    });
    return user ? true : false;
  }

  public async createUser(newUserInfo: CreateUserDTO): Promise<User> {
    const developersIntraName: string[] = ['nnuno-ca', 'roramos', 'jarsenio'];

    const newUser: User = await this.usersRepository.save(newUserInfo);
    this.userStatsService.createUserStats(newUser);

    if (developersIntraName.includes(newUser.intra_name)) {
      this.achievementService.grantPongFightMaestro(newUser.id);
    } else {
      this.achievementService.grantNewPongFighter(newUser.id);
    }

    return newUser;
  }

  public async deleteUserByUID(userId: number): Promise<SuccessResponse> {
    await this.usersRepository.delete(userId);
    return { message: 'Successfully deleted user' };
  }

  public async disable2fa(userId: number): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      has_2fa: false,
      last_updated_at: new Date(),
      secret_2fa: null,
    });
    return { message: 'Successfully disabled two factor authentication' };
  }

  public async enable2fa(
    userId: number,
    secret_2fa: string,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      has_2fa: true,
      last_updated_at: new Date(),
      secret_2fa: secret_2fa,
    });
    return { message: 'Successfully enabled two factor authentication' };
  }

  public async findBlockedUsersByUID(userId: number): Promise<BlockedUser[]> {
    const user: User = await this.usersRepository.findOne({
      relations: ['blocked_users', 'blocked_users.blocked_user'],
      where: { id: userId },
    });
    return user.blocked_users;
  }

  public async findChatRoomsWhereUserIs(
    uid: number,
  ): Promise<ChatRoomI[] | null> {
    const rooms: ChatRoom[] | undefined = (
      await this.usersRepository.findOne({
        relations: ['chat_rooms', 'chat_rooms.owner', 'chat_rooms.users'],
        where: { id: uid },
      })
    ).chat_rooms;

    if (!rooms) {
      return null;
    }

    const roomInterfaces: ChatRoomI[] = rooms.map((room: ChatRoom) => ({
      id: room.id,
      name: room.name,
      ownerName: room.owner.name,
      users: room.users,
    }));

    return roomInterfaces;
  }

  public async findMatchHistoryByUID(
    userId: number,
  ): Promise<GameResultInterface[]> {
    // Find game results where winner or loser id = userId
    const gameResults: GameResult[] = await this.gameResultRepository.find({
      relations: { loser: true, winner: true },
      where: [{ winner: { id: userId } }, { loser: { id: userId } }],
    });

    const matchHistory: GameResultInterface[] = gameResults.map(
      (gameResult) => {
        return {
          loser: {
            avatar_url: gameResult.loser.avatar_url,
            name: gameResult.loser.name,
            score: gameResult.loser_score,
            userId: gameResult.loser.id,
          },
          winner: {
            avatar_url: gameResult.winner.avatar_url,
            name: gameResult.winner.name,
            score: gameResult.winner_score,
            userId: gameResult.winner.id,
          },
        };
      },
    );
    return matchHistory;
  }

  public async findMyInfo(meUID: number): Promise<MeUserInfo> {
    // Fetch user's table info of me user and get his ladder level
    // Populate the resulting object with both all those properties
    return {
      ...(await this.usersRepository.findOneBy({ id: meUID })),
      ladder_level: await this.userStatsService.findLadderLevelByUID(meUID),
    };
  }

  public async findOpponentInfoByUID(userId: number): Promise<OpponentInfo> {
    const user: User = await this.findUserByUID(userId);

    return {
      avatar_url: user.avatar_url,
      id: user.id,
      name: user.name,
    };
  }

  public async findUserByIntraName(intraName: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ intra_name: intraName });
  }

  public async findUserByName(name: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ name: name });
  }

  public async findUserByUID(userId: number): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id: userId });
  }

  public async findUserProfileByUID(
    meUser: User,
    userId: number,
  ): Promise<UserProfile | null> {
    const user: User | null = await this.usersRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      return null;
    }

    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(meUser, user);
    const isBlocked = await this.friendshipsService.isThereABlockRelationship(
      meUser.id,
      userId,
    );

    const friends: Friend[] = await this.friendshipsService.findFriendsByUID(
      user.id,
    );

    return {
      achievements: await this.achievementService.findAchievementsByUID(userId),
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      friend_request_sent_by_me: friendship
        ? friendship.sender.id === meUser.id
        : null,
      friends: friends,
      friendship_id: friendship ? friendship.id : null,
      friendship_status: friendship ? friendship.status : null,
      id: user.id,
      intra_name: user.intra_name,
      intra_profile_url: user.intra_profile_url,
      is_blocked: isBlocked,
      ladder_level: await this.userStatsService.findLadderLevelByUID(userId),
      match_history: await this.findMatchHistoryByUID(userId),
      name: user.name,
      stats: await this.userStatsService.findUserStatsByUID(userId),
    };
  }

  /**********************************
   *               2FA               *
   **********************************/

  public async findUserSearchInfoByUID(
    meUID: number,
    userId: number,
  ): Promise<UserSearchInfo | null> {
    const meUser: User = await this.findUserByUID(meUID);
    const user: User = await this.findUserByUID(userId);
    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(meUser, user);

    return {
      avatar_url: user.avatar_url,
      friend_request_sent_by_me: friendship
        ? friendship.sender === meUser
        : null,
      friendship_status: friendship ? friendship.status : null,
      id: user.id,
      name: user.name,
    };
  }

  public async findUsersSearchInfoByUsernameProximity(
    meUser: User,
    usernameQuery: string,
  ): Promise<UserSearchInfo[]> {
    const meUserId: number = meUser.id;

    // Find users which name starts with <usernameQuery> and keep only up to 5 of those
    // ignoring blocked users and friends
    const users: User[] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name LIKE :usernameProximity', {
        usernameProximity: usernameQuery + '%',
      })
      .andWhere('user.id != :meUserId', { meUserId })
      .andWhere((qb) => {
        const subqueryBlockedMe: string = qb
          .subQuery()
          .select('*')
          .from(BlockedUser, 'blockedUser')
          .where('blockedUser.blocked_user = :meUserId', { meUserId })
          .getQuery();
        return `NOT EXISTS ${subqueryBlockedMe}`;
      })
      .andWhere((qb) => {
        const subqueryFriend: string = qb
          .subQuery()
          .select('*')
          .from(Friendship, 'friendship')
          .where(
            '(friendship.sender = :meUserId OR friendship.receiver = :meUserId) AND friendship.status = :acceptedStatus',
            { acceptedStatus: FriendshipStatus.ACCEPTED, meUserId },
          )
          .getQuery();
        return `NOT EXISTS ${subqueryFriend}`;
      })
      .take(5)
      .getMany();

    const usersSearchInfo: UserSearchInfo[] = await Promise.all(
      users.map(async (user: User) => {
        const friendship: Friendship | null =
          await this.friendshipsService.findFriendshipBetween2Users(
            meUser,
            user,
          );

        return {
          avatar_url: user.avatar_url,
          friend_request_sent_by_me: friendship
            ? friendship.sender.id === meUser.id
              ? true
              : false
            : null,
          friendship_status: friendship ? friendship.status : null,
          id: user.id,
          name: user.name,
        };
      }),
    );

    return usersSearchInfo;
  }

  public async update2faSecretByUID(
    userId: number,
    newSecret: string,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      last_updated_at: new Date(),
      secret_2fa: newSecret,
    });
    return { message: 'Successfully updated 2fa secret' };
  }

  public async updateGameThemeByUID(
    userId: number,
    newGameTheme: GameThemes,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      game_theme: newGameTheme,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated game theme' };
  }

  public async updateUserAvatarByUID(
    userId: number,
    newAvatarURL: string,
  ): Promise<SuccessResponse> {
    const currentAvatarURL: string = (await this.findUserByUID(userId))
      .avatar_url;
    const currentAvatarName: string = currentAvatarURL.slice(
      currentAvatarURL.lastIndexOf('/'),
    );
    const absoluteAvatarPath: string = path.join(
      __dirname,
      '../../../public',
      currentAvatarName,
    );

    // Delete the previous avatar from the file system
    fs.unlink(absoluteAvatarPath, () => {});

    await this.usersRepository.update(userId, {
      avatar_url: newAvatarURL,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated user avatar' };
  }

  public async updateUsernameByUID(
    userId: number,
    newName: string,
  ): Promise<ErrorResponse | SuccessResponse> {
    // Check name length boundaries (4-10)
    if (!(newName.length <= 4 && newName.length >= 10)) {
      this.logger.warn(
        `UID= ${userId} failed to update his username due to length boundaries`,
      );
      throw new BadRequestException(
        'Usernames length must be 4-10 characters long',
      );
    }

    // Check if newName is only composed by
    // a-z, A-Z, 0-9, _ and -
    if (!newName.match('^[a-zA-Z0-9_-]+$')) {
      this.logger.warn(
        `UID= ${userId} failed to update his username due to using forbidden chars`,
      );
      throw new BadRequestException(
        'Usernames can only by composed by letters (both cases), underscore and hiphen',
      );
    }

    if (await this.isNameAlreadyTaken(newName)) {
      this.logger.warn(
        'A request to update a name was made with a name already taken',
      );
      throw new ConflictException('Username is already taken');
    }

    if (await this.doesNameConflictWithAnyIntraName(newName, userId)) {
      this.logger.warn(
        'A request to update a name was made with a intra name of another person',
      );
      throw new ConflictException(
        'You cannot change your name to the intra name of another person',
      );
    }

    await this.usersRepository.update(userId, {
      last_updated_at: new Date(),
      name: newName,
    });
    return { message: 'Successfully updated username' };
  }

  public async updateUserStatusByUID(
    userId: number,
    newStatus: UserStatus,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      last_updated_at: new Date(),
      status: newStatus,
    });
    return { message: 'Successfully updated user status' };
  }
}
