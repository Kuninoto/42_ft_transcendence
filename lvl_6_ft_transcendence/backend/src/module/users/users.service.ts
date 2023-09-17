import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import {
  BlockedUserInterface,
  ChatRoomInterface,
  ErrorResponse,
  Friend,
  FriendRequest,
  GameResultInterface,
  GameThemes,
  MeUserInfo,
  SuccessResponse,
  UserBasicProfile,
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
} from '../../entity';
import { AchievementService } from '../achievement/achievement.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { FriendshipsService } from '../friendships/friendships.service';
import { UserStatsService } from '../user-stats/user-stats.service';
import { CreateUserDTO } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly userStatsService: UserStatsService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    private readonly achievementService: AchievementService,
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  private readonly logger: Logger = new Logger(UsersService.name);

  public async createUser(newUserInfo: CreateUserDTO): Promise<User> {
    const developersIntraName: string[] = ['nnuno-ca', 'roramos', 'jarsenio'];

    const newUser: User = await this.usersRepository.save(newUserInfo);
    await this.userStatsService.createUserStats(newUser);

    if (developersIntraName.includes(newUser.intra_name)) {
      this.achievementService.grantPongFightMaestro(newUser.id);
    } else {
      this.achievementService.grantNewPongFighter(newUser.id);
    }

    return newUser;
  }

  public async findMyInfo(meUser: User): Promise<MeUserInfo> {
    return {
      id: meUser.id,
      name: meUser.name,
      intra_name: meUser.intra_name,
      avatar_url: meUser.avatar_url,
      intra_profile_url: meUser.intra_profile_url,
      has_2fa: meUser.has_2fa,
      game_theme: meUser.game_theme,
      ladder_level: await this.userStatsService.findLadderLevelByUID(meUser.id),
      stats: await this.userStatsService.findUserStatsByUID(meUser.id),
      created_at: meUser.created_at,
    };
  }

  public async findMyFriendRequests(meUID: number): Promise<FriendRequest[]> {
    return await this.friendshipsService.findFriendRequestsByUID(meUID);
  }

  public async findMyFriendlist(meUID: number): Promise<Friend[]> {
    return await this.friendshipsService.findFriendsByUID(meUID);
  }

  public async findMyBlocklist(meUID: number): Promise<BlockedUserInterface[]> {
    return await this.friendshipsService.findBlocklistByUID(meUID);
  }

  public async findChatRoomsWhereUserIs(
    uid: number,
  ): Promise<ChatRoomInterface[]> {
    const rooms: ChatRoom[] | undefined = (await this.findUserByUID(uid))
      .chat_rooms;
    if (!rooms) return [];

    const roomInterfaces: ChatRoomInterface[] = rooms.map(
      (room: ChatRoom): ChatRoomInterface => ({
        id: room.id,
        name: room.name,
        type: room.type,
        ownerId: room.owner.id,
        participants: room.users.map(
          (user: User): UserBasicProfile => ({
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
          }),
        ),
      }),
    );

    return roomInterfaces;
  }

  public async findMatchHistoryByUID(
    userId: number,
  ): Promise<GameResultInterface[]> {
    // Find game results where winner or loser id = userId
    // and sort them from the newest to the latest (biggest id at index 0)
    const gameResults = await this.gameResultRepository
      .createQueryBuilder('game_result')
      .select()
      .leftJoinAndSelect('game_result.winner', 'winner')
      .leftJoinAndSelect('game_result.loser', 'loser')
      .where('winner.id = :userId OR loser.id = :userId', {
        userId,
      })
      .orderBy('game_result.id', 'DESC')
      .getMany();

    const matchHistory: GameResultInterface[] = gameResults.map(
      (result: GameResult): GameResultInterface => {
        return {
          winner: {
            userId: result.winner.id,
            name: result.winner.name,
            avatar_url: result.winner.avatar_url,
            score: result.winner_score,
          },

          loser: {
            userId: result.loser.id,
            name: result.loser.name,
            avatar_url: result.loser.avatar_url,
            score: result.loser_score,
          },

          gameType: result.game_type,
        };
      },
    );
    return matchHistory;
  }

  public async findUserBasicProfileByUID(
    userId: number,
  ): Promise<UserBasicProfile> {
    const user: User = await this.findUserByUID(userId);

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
    };
  }

  public async findUserByIntraName(intraName: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { intra_name: intraName },
      relations: [
        'chat_rooms',
        'chat_rooms.admins',
        'chat_rooms.owner',
        'chat_rooms.users',
        'banned_rooms',
      ],
    });
  }

  public async findUserByName(name: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { name: name },
      relations: [
        'chat_rooms',
        'chat_rooms.admins',
        'chat_rooms.owner',
        'chat_rooms.users',
        'banned_rooms',
      ],
    });
  }

  public async findUserByUID(userId: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'chat_rooms',
        'chat_rooms.admins',
        'chat_rooms.owner',
        'chat_rooms.users',
        'banned_rooms',
      ],
    });
  }

  public async findUserProfileByUID(
    meUser: User,
    userId: number,
  ): Promise<UserProfile | null> {
    const user: User | null = await this.usersRepository.findOneBy({
      id: userId,
    });

    // If user doesn't exist or if sender is blocked by him
    if (
      !user ||
      (await this.friendshipsService.isSenderBlocked(meUser.id, userId))
    )
      throw new NotFoundException('User not found');

    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(
        meUser.id,
        user.id,
      );

    return {
      id: user.id,
      name: user.name,
      intra_name: user.intra_name,
      avatar_url: user.avatar_url,
      intra_profile_url: user.intra_profile_url,
      friends: await this.friendshipsService.findFriendsByUID(user.id),
      friendship_id: friendship?.id,
      friendship_status: friendship?.status,
      friend_request_sent_by_me: friendship
        ? friendship.sender.id == meUser.id
        : null,
      blocked_by_me: await this.friendshipsService.isReceiverBlocked(
        meUser.id,
        userId,
      ),
      ladder_level: await this.userStatsService.findLadderLevelByUID(userId),
      match_history: await this.findMatchHistoryByUID(userId),
      stats: await this.userStatsService.findUserStatsByUID(userId),
      achievements: await this.achievementService.findAchievementsByUID(userId),
      created_at: user.created_at,
    };
  }

  public async findUserSearchInfoByUID(
    meUID: number,
    userId: number,
  ): Promise<UserSearchInfo | null> {
    const user: User = await this.findUserByUID(userId);
    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(meUID, userId);

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      friendship_id: friendship?.id,
      friendship_status: friendship?.status,
      friend_request_sent_by_me: friendship
        ? friendship.sender.id == meUID
        : null,
      blocked_by_me: await this.friendshipsService.isReceiverBlocked(
        meUID,
        userId,
      ),
    };
  }

  public async findUsersSearchInfoByUsernameProximity(
    meUser: User,
    usernameQuery: string,
  ): Promise<UserSearchInfo[]> {
    const meUserId: number = meUser.id;

    // Find users which name starts with <usernameQuery> and keep only up to 5 of those
    // ignoring users that blocked me and friends
    const users: User[] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name LIKE :usernameProximity', {
        usernameProximity: usernameQuery + '%',
      })
      .andWhere('user.id != :meUserId', { meUserId })
      .andWhere((qb): string => {
        const subqueryBlockedMe: string = qb
          .subQuery()
          .select('*')
          .from(BlockedUser, 'blockedUser')
          .where('blockedUser.blocked_user.id = :meUserId', { meUserId })
          .getQuery();
        return `NOT EXISTS ${subqueryBlockedMe}`;
      })
      .take(5)
      .getMany();

    const usersSearchInfo: UserSearchInfo[] = await Promise.all(
      users.map(async (user: User): Promise<UserSearchInfo> => {
        const friendship: Friendship | null =
          await this.friendshipsService.findFriendshipBetween2Users(
            meUser.id,
            user.id,
          );

        return {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          friendship_id: friendship?.id,
          friendship_status: friendship?.status,
          friend_request_sent_by_me: friendship
            ? friendship.sender.id === meUser.id
              ? true
              : false
            : null,
          blocked_by_me: await this.friendshipsService.isReceiverBlocked(
            meUserId,
            user.id,
          ),
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
      secret_2fa: newSecret,
      last_updated_at: new Date(),
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
    fs.unlink(absoluteAvatarPath, (err: any) => {
      if (err) this.logger.error(err);
    });

    await this.usersRepository.update(userId, {
      avatar_url: newAvatarURL,
      last_updated_at: new Date(),
    });

    this.connectionGateway.sendRefreshUserToFriendRoom(userId);
    return { message: 'Successfully updated user avatar' };
  }

  public async updateUsernameByUID(
    userId: number,
    newName: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    // Check name length boundaries (4-10)
    if (newName.length < 4 || newName.length > 10) {
      throw new BadRequestException(
        'Usernames length must be 4-10 characters long',
      );
    }

    // Check if newName is only composed by
    // a-z, A-Z, 0-9, _ and -
    if (!newName.match('^[a-zA-Z0-9_-]+$')) {
      throw new BadRequestException(
        'Usernames can only by composed by letters (both cases), underscore and hiphen',
      );
    }

    if (await this.isNameAlreadyTaken(newName))
      throw new ConflictException('Username is already taken');

    if (await this.doesNameConflictWithAnyIntraName(newName, userId)) {
      this.logger.warn(
        'A request to update a name was made with a intra name of another person',
      );
      throw new ConflictException(
        'You cannot change your name to the intra name of another person',
      );
    }

    await this.usersRepository.update(userId, {
      name: newName,
      last_updated_at: new Date(),
    });
  
    this.connectionGateway.sendRefreshUserToFriendRoom(userId);
    return { message: 'Successfully updated username' };
  }

  public async updateUserStatusByUID(
    userId: number,
    newStatus: UserStatus,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      status: newStatus,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated user status' };
  }

  /**********************************
   *               2FA               *
   **********************************/

  public async enable2fa(
    userId: number,
    secret_2fa: string,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      has_2fa: true,
      secret_2fa: secret_2fa,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully enabled two factor authentication' };
  }

  public async disable2fa(userId: number): Promise<SuccessResponse> {
    await this.usersRepository.update(userId, {
      has_2fa: false,
      secret_2fa: null,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully disabled two factor authentication' };
  }

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
}
