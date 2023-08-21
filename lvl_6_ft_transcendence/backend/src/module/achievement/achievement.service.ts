import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Achievement } from 'src/entity/achievement.entity';
import { Repository } from 'typeorm';
import {
  AchievementDescriptions,
  AchievementInterface,
  Achievements,
} from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';

// Because the first achievement (PONG_FIGHT_MAESTRO OR NEW_PONGFIGHTER)
// is assigned right away upon user creation we must delay the socket event
// so that the user have the time to connect to the socket and receive it
const FIRST_ACHIEVEMENT_TIMEOUT = 20;

@Injectable()
export class AchievementService {
  private readonly logger: Logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

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

  public async grantPongFightMaestro(userId: number): Promise<void> {
    await this.grantAchievement(
      userId,
      Achievements.PONGFIGHT_MAESTRO,
      FIRST_ACHIEVEMENT_TIMEOUT,
    );
  }

  public async grantNewPongFighter(userId: number): Promise<void> {
    await this.grantAchievement(
      userId,
      Achievements.NEW_PONG_FIGHTER,
      FIRST_ACHIEVEMENT_TIMEOUT,
    );
  }

  public async grantUnexpectedVictory(userId: number): Promise<void> {
    if (
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.UNEXPECTED_VICTORY,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.UNEXPECTED_VICTORY);
    }
  }

  public async grantWinsAchievementsIfEligible(
    userId: number,
    nrWins: number,
  ): Promise<void> {
    if (
      nrWins === 1 &&
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.BEGINNERS_TRIUMPH,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.BEGINNERS_TRIUMPH);
    } else if (
      nrWins === 5 &&
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.PONG_MASTER,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.PONG_MASTER);
    }
  }

  public async grantLossesAchievementsIfEligible(
    userId: number,
    nrLosses: number,
  ): Promise<void> {
    if (
      nrLosses === 1 &&
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.FIRST_SETBACK,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.FIRST_SETBACK);
    }
  }

  public async grantFriendsAchievementsIfEligible(
    userId: number,
    nrFriends: number,
  ): Promise<void> {
    if (
      nrFriends === 1 &&
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.FIRST_BUDDY,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.FIRST_BUDDY);
    } else if (
      nrFriends === 5 &&
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.FRIENDLY,
      ))
    ) {
      await this.grantAchievement(userId, Achievements.FRIENDLY);
    }
  }

  public async grantDeclinedTomorrowBuddies(userId: number): Promise<void> {
    if (
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.DECLINED_TOMORROW_BUDDIES,
      ))
    ) {
      await this.grantAchievement(
        userId,
        Achievements.DECLINED_TOMORROW_BUDDIES,
      );
    }
  }

  public async grantBreakingThePaddleBond(userId: number): Promise<void> {
    if (
      !(await this.userAlreadyHaveThisAchievement(
        userId,
        Achievements.BREAKING_THE_PADDLE_BOND,
      ))
    ) {
      await this.grantAchievement(
        userId,
        Achievements.BREAKING_THE_PADDLE_BOND,
      );
    }
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
    timeout?: number,
  ): Promise<void> {
    this.achievementRepository.save({
      achievement: achievement,
      user: { id: userId },
    });

    if (timeout) {
      setTimeout(() => {
        this.connectionGateway.achievementUnlocked(userId, achievement);
      }, timeout);
    } else {
      this.connectionGateway.achievementUnlocked(userId, achievement);
    }

    this.logger.log(`User with id= ${userId} just received ${achievement}!`);
  }
}
