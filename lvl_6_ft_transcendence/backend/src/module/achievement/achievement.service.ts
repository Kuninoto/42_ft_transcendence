import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AchievementInterface } from 'src/common/types/achievement-interface.interface';
import {
  Achievement,
  AchievementDescriptions,
  Achievements,
} from 'src/entity/achievement.entity';
import { Repository } from 'typeorm';
import { ChatGateway } from '../chat/chat.gateway';
import { FriendshipsService } from '../friendships/friendships.service';
import { UserStatsService } from '../user-stats/user-stats.service';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    private readonly userStatsService: UserStatsService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private readonly logger: Logger = new Logger(AchievementService.name);

  public async grantPongFightMaestro(userId: number): Promise<void> {
    this.grantAchievement(userId, Achievements.PONGFIGHT_MAESTRO);
  }

  public async grantNewPongFighter(userId: number): Promise<void> {
    this.grantAchievement(userId, Achievements.NEW_PONG_FIGHTER);
  }

  public async grantWinsAchievementsIfEligible(userId: number): Promise<void> {
    const nrWins: number = (
      await this.userStatsService.findUserStatsByUID(userId)
    ).wins;

    if (
      nrWins === 1 &&
      !this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.BEGINNERS_TRIUMPH,
      )
    ) {
      this.grantAchievement(userId, Achievements.BEGINNERS_TRIUMPH);
    } else if (
      nrWins === 5 &&
      !this.userAlreadyHaveThisAchievement(userId, Achievements.PONG_MASTER)
    ) {
      this.grantAchievement(userId, Achievements.PONG_MASTER);
    }
  }

  public async grantLossesAchievementsIfEligible(
    userId: number,
  ): Promise<void> {
    if (
      this.userAlreadyHaveThisAchievement(userId, Achievements.FIRST_SETBACK)
    ) {
      return;
    }

    const nrLosses: number = (
      await this.userStatsService.findUserStatsByUID(userId)
    ).losses;

    if (nrLosses === 1) {
      this.grantAchievement(userId, Achievements.FIRST_SETBACK);
    }
  }

  public async grantFriendsAchievementsIfEligible(
    userId: number,
  ): Promise<void> {
    const nrFriends: number = (
      await this.friendshipsService.findFriendsByUID(userId)
    ).length;

    if (
      nrFriends === 1 &&
      !this.userAlreadyHaveThisAchievement(userId, Achievements.FIRST_BUDDY)
    ) {
      this.grantAchievement(userId, Achievements.FIRST_BUDDY);
    } else if (
      nrFriends === 5 &&
      !this.userAlreadyHaveThisAchievement(userId, Achievements.FRIENDLY)
    ) {
      this.grantAchievement(userId, Achievements.FRIENDLY);
    }
  }

  public async grantDeclinedTomorrowBuddies(userId: number): Promise<void> {
    if (
      this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.DECLINED_TOMORROW_BUDDIES,
      )
    ) {
      return;
    }

    this.achievementRepository.save({
      achievement: Achievements.DECLINED_TOMORROW_BUDDIES,
      user: { id: userId },
    });

    this.chatGateway.achievementUnlocked(
      userId,
      Achievements.DECLINED_TOMORROW_BUDDIES,
    );

    this.logger.log(
      'User with id=' + userId + ' just received Declined Tomorrow Buddies!',
    );
  }

  public async grantBreakingThePaddleBond(userId: number): Promise<void> {
    if (
      this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.BREAKING_THE_PADDLE_BOND,
      )
    ) {
      return;
    }

    this.achievementRepository.save({
      achievement: Achievements.BREAKING_THE_PADDLE_BOND,
      user: { id: userId },
    });

    this.chatGateway.achievementUnlocked(
      userId,
      Achievements.BREAKING_THE_PADDLE_BOND,
    );

    this.logger.log(
      'User with id=' + userId + ' just received Breaking The Paddle Bond!',
    );
  }

  public async findAchievementsByUID(
    userId: number,
  ): Promise<AchievementInterface[]> {
    const userAchievements: Achievement[] =
      await this.achievementRepository.findBy({ user: { id: userId } });

    const achievementsInterface: AchievementInterface[] = userAchievements.map(
      (achievement: Achievement) => {
        return {
          achievement: achievement.achievement,
          description: AchievementDescriptions[achievement.achievement],
        };
      },
    );

    return achievementsInterface;
  }

  private async userAlreadyHaveThisAchievement(
    userId: number,
    achievementToCheck: Achievements,
  ): Promise<boolean> {
    const userAchievements: Achievement[] =
      await this.achievementRepository.findBy({ user: { id: userId } });

    return userAchievements.some(
      (achievement) => achievement.achievement === achievementToCheck,
    );
  }

  private async grantAchievement(
    userId: number,
    achievement: Achievements,
  ): Promise<void> {
    this.achievementRepository.save({
      achievement: achievement,
      user: { id: userId },
    });

    this.chatGateway.achievementUnlocked(userId, achievement);
    this.logger.log(
      'User with id=' + userId + ' just received ' + achievement + '!',
    );
  }
}
