import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Achievement,
  AchievementDescriptions,
  Achievements,
} from 'src/entity/achievement.entity';
import { Repository } from 'typeorm';
import { UserStatsService } from '../user-stats/user-stats.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { AchievementInterface } from 'src/common/types/achievement-interface.interface';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    private readonly userStatsService: UserStatsService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
  ) {}

  private readonly logger: Logger = new Logger(AchievementService.name);

  public async grantNewPongFighter(userId: number): Promise<void> {
    this.achievementRepository.save({
      achievement: Achievements.NEW_PONG_FIGHTER,
      user: { id: userId },
    });

    this.logger.log('User with id=' + userId + " just received New Pong Fighter!");
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
      this.achievementRepository.save({
        achievement: Achievements.BEGINNERS_TRIUMPH,
        user: { id: userId },
      });

      this.logger.log('User with id=' + userId + " just received Beginners Triumph!");
    } else if (
      nrWins === 5 &&
      !this.userAlreadyHaveThisAchievement(userId, Achievements.PONG_MASTER)
    ) {
      this.achievementRepository.save({
        achievement: Achievements.PONG_MASTER,
        user: { id: userId },
      });

      this.logger.log('User with id=' + userId + " just received Pong Master!");
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
      this.achievementRepository.save({
        achievement: Achievements.FIRST_SETBACK,
        user: { id: userId },
      });

      this.logger.log('User with id=' + userId + " just received First Setback!");
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
      this.achievementRepository.save({
        achievement: Achievements.FIRST_BUDDY,
        user: { id: userId },
      });

      this.logger.log('User with id=' + userId + " just received First Buddy!");
    } else if (
      nrFriends === 5 &&
      !this.userAlreadyHaveThisAchievement(userId, Achievements.FRIENDLY)
    ) {
      this.achievementRepository.save({
        achievement: Achievements.FRIENDLY,
        user: { id: userId },
      });

      this.logger.log('User with id=' + userId + " just received Friendly!");
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

    this.logger.log('User with id=' + userId + " just received Declined Tomorrow Buddies!");
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

    this.logger.log('User with id=' + userId + " just received Breaking The Paddle Bond!");
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
}
