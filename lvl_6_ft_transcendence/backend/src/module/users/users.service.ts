import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedUser, Friendship, GameResult, User } from 'src/entity/index';
import { CreateUserDTO } from './dto/create-user.dto';
import { SuccessResponse } from '../../common/types/success-response.interface';
import { ErrorResponse } from '../../common/types/error-response.interface';
import * as path from 'path';
import * as fs from 'fs';
import { UserProfile } from '../../common/types/user-profile.interface';
import { UserStatus } from '../../common/types/user-status.enum';
import { UserSearchInfo } from '../../common/types/user-search-info.interface';
import { FriendshipStatus } from '../../common/types/friendship-status.enum';
import { FriendshipsService } from '../friendships/friendships.service';
import { GameThemes } from '../../common/types/game-themes.enum';
import { FriendInterface } from 'src/common/types/friend-interface.interface';
import { GameResultInterface } from 'src/common/types/game-result-interface.interface';
import { UserStats } from 'src/entity/user-stats.entity';
import { GameService } from '../game/game.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  private readonly logger: Logger = new Logger(UsersService.name);

  public async createUser(newUserInfo: CreateUserDTO): Promise<User> {
    const newUser: User = await this.usersRepository.save(newUserInfo);

    const newUserStats: UserStats = this.userStatsRepository.create();
    newUserStats.user = newUser;

    await this.userStatsRepository.save(newUserStats);
    return newUser;
  }

  public async findUserByName(name: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ name: name });
  }

  public async findUsersSearchInfoByUsernameProximity(
    meUser: User,
    usernameQuery: string,
  ): Promise<UserSearchInfo[]> {
    const meUserId = meUser.id;

    // Find users which name starts with <usernameQuery> and keep only up to 5 of those
    // ignoring blocked users and friends
    const users: User[] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name LIKE :usernameProximity', {
        usernameProximity: usernameQuery + '%',
      })
      .andWhere('user.id != :meUserId', { meUserId })
      .andWhere((qb) => {
        const subqueryBlockedMe = qb
          .subQuery()
          .select('*')
          .from(BlockedUser, 'blockedUser')
          .where('blockedUser.blocked_user = :meUserId', { meUserId })
          .getQuery();
        return `NOT EXISTS ${subqueryBlockedMe}`;
      })
      .andWhere((qb) => {
        const subqueryFriend = qb
          .subQuery()
          .select('*')
          .from(Friendship, 'friendship')
          .where(
            '(friendship.sender = user.id AND friendship.receiver = :meUserId) OR (friendship.sender = :meUserId AND friendship.receiver = user.id)',
            { meUserId },
          )
          .andWhere('friendship.status = :status', {
            status: FriendshipStatus.ACCEPTED,
          })
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
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          friendship_status: friendship ? friendship.status : null,
          friend_request_sent_by_me: friendship
            ? friendship.sender === meUser
            : null,
        };
      }),
    );

    return usersSearchInfo;
  }

  public async findUserByIntraName(intraName: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ intra_name: intraName });
  }

  public async findUserByUID(userID: number): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id: userID });
  }

  public async findUserProfileByUID(
    meUser: User,
    userID: number,
  ): Promise<UserProfile | null> {
    const user: User | null = await this.usersRepository.findOneBy({
      id: userID,
    });

    if (!user) {
      return null;
    }

    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(meUser, user);
    const isBlocked = await this.friendshipsService.isThereABlockRelationship(
      meUser,
      userID,
    );

    const friends: FriendInterface[] =
      await this.friendshipsService.getMyFriends(user);

    return {
      id: user.id,
      name: user.name,
      intra_name: user.intra_name,
      avatar_url: user.avatar_url,
      intra_profile_url: user.intra_profile_url,
      created_at: user.created_at,
      friendship_id: friendship ? friendship.id : null,
      friendship_status: friendship ? friendship.status : null,
      friend_request_sent_by_me: friendship
        ? friendship.sender === meUser
        : null,
      friends: friends,
      is_blocked: isBlocked,
      stats: user.user_stats,
    };
  }

  public async findUserSearchInfoByUID(
    meUID: number,
    userID: number,
  ): Promise<UserSearchInfo | null> {
    const meUser: User = await this.findUserByUID(meUID);
    const user: User = await this.findUserByUID(userID);
    const friendship: Friendship | null =
      await this.friendshipsService.findFriendshipBetween2Users(meUser, user);

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      friendship_status: friendship ? friendship.status : null,
      friend_request_sent_by_me: friendship
        ? friendship.sender === meUser
        : null,
    };
  }

  public async findBlockedUsersByUID(userId: number): Promise<BlockedUser[]> {
    const user: User = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['blocked_users', 'blocked_users.blocked_user'],
    });
    return user.blocked_users;
  }

  public async findMatchHistoryByUID(
    userId: number,
  ): Promise<GameResultInterface[]> {
    const gameResults: GameResult[] =
      await this.gameService.findGameResultsWhereUserPlayed(userId);

    const matchHistory: GameResultInterface[] = gameResults.map(
      (gameResult) => {
        return {
          winner: {
            userId: gameResult.winner.id,
            name: gameResult.winner.name,
            avatar_url: gameResult.winner.avatar_url,
            score: gameResult.winner_score,
          },
          loser: {
            userId: gameResult.loser.id,
            name: gameResult.loser.name,
            avatar_url: gameResult.loser.avatar_url,
            score: gameResult.loser_score,
          },
        };
      },
    );
    return matchHistory;
  }

  public async updateUsernameByUID(
    userID: number,
    newName: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    // Check name length boundaries (4-10)
    if (newName.length < 4 || newName.length > 10) {
      this.logger.error(
        'User which id=' +
          userID +
          ' failed to update his username due to length boundaries',
      );
      throw new BadRequestException(
        'Usernames length must at least 4 and up to 10 characters long',
      );
    }

    // Check if newName is only composed by
    // a-z, A-Z, 0-9 and _
    if (!newName.match('^[a-zA-Z0-9_]+$')) {
      this.logger.error(
        'User which id=' +
          userID +
          ' failed to update his username due to using forbidden chars',
      );
      throw new BadRequestException(
        'Usernames must only use a-z, A-Z, 0-9 and _',
      );
    }

    if (await this.isNameAlreadyTaken(newName)) {
      this.logger.error(
        'A request to update a name was made with a name already taken',
      );
      throw new ConflictException('Username is already taken');
    }

    if (await this.doesNameConflictWithAnyIntraName(newName, userID)) {
      this.logger.error(
        'A request to update a name was made with a intra name of another person',
      );
      throw new ConflictException(
        'You cannot change your name to the intra name of another person',
      );
    }

    await this.usersRepository.update(userID, {
      name: newName,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated username' };
  }

  public async updateUserAvatarByUID(
    userID: number,
    newAvatarURL: string,
  ): Promise<SuccessResponse> {
    const currentAvatarURL = (
      await this.usersRepository.findOneBy({ id: userID })
    ).avatar_url;
    const currentAvatarName = currentAvatarURL.slice(
      currentAvatarURL.lastIndexOf('/'),
    );
    const absoluteAvatarPath = path.join(
      __dirname,
      '../../../public',
      currentAvatarName,
    );

    // Delete the previous avatar from the file system
    fs.unlink(absoluteAvatarPath, () => {});

    await this.usersRepository.update(userID, {
      avatar_url: newAvatarURL,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated user avatar' };
  }

  public async updateUserStatusByUID(
    userID: number,
    newStatus: UserStatus,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      status: newStatus,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated user status' };
  }

  public async updateGameThemeByUID(
    userID: number,
    newGameTheme: GameThemes,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      game_theme: newGameTheme,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated game theme' };
  }

  public async updatePlayersStatsByUIDs(winnerUID: number, loserUID: number) {
    await this.userStatsRepository.update(winnerUID, {
      wins: () => 'wins + 1',
      win_rate: () =>
        'CAST(wins AS double precision) / (matches_played + 1) * 100.0',
      matches_played: () => 'matches_played + 1',
    });

    await this.userStatsRepository.update(loserUID, {
      losses: () => 'losses + 1',
      win_rate: () =>
        'CAST(wins AS double precision) / (matches_played + 1) * 100.0',
      matches_played: () => 'matches_played + 1',
    });
  }

  public async update2faSecretByUID(
    userID: number,
    newSecret: string,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      secret_2fa: newSecret,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated 2fa secret' };
  }

  public async enable2fa(
    userID: number,
    secret_2fa: string,
  ): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      has_2fa: true,
      secret_2fa: secret_2fa,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully enabled two factor authentication' };
  }

  public async disable2fa(userID: number): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      has_2fa: false,
      secret_2fa: null,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully disabled two factor authentication' };
  }

  public async deleteUserByUID(userID: number): Promise<SuccessResponse> {
    await this.usersRepository.delete(userID);
    return { message: 'Successfully deleted user' };
  }

  private async isNameAlreadyTaken(newName: string): Promise<boolean> {
    const user: User | null = await this.usersRepository.findOneBy({
      name: newName,
    });
    return user ? true : false;
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
}
