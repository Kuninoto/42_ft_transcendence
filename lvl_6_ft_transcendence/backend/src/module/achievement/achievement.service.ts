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

/* Because the first achievement (PONG_FIGHT_MAESTRO or NEW_PONGFIGHTER)
is assigned right away upon user creation we must delay the socket event
so that the user have the time to connect to the socket and receive it */
const FIRST_ACHIEVEMENT_TIMEOUT: number = 2 * 1000; // 2 seconds

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  private readonly logger: Logger = new Logger(AchievementService.name);

  public async findAchievementsByUID(
    userId: number,
  ): Promise<AchievementInterface[]> {
    const userAchievements: Achievement[] =
      await this.achievementRepository.findBy({ user: { id: userId } });

    const achievementsInterface: AchievementInterface[] = userAchievements.map(
      (achievement: Achievement): AchievementInterface => ({
        achievement: achievement.achievement,
        description: AchievementDescriptions[achievement.achievement],
      }),
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
    await this.grantAchievement(userId, Achievements.UNEXPECTED_VICTORY);
  }

  public async grantGoofyQuitter(userId: number): Promise<void> {
    await this.grantAchievement(userId, Achievements.GOOFY_QUITTER);
  }

  public async grantWinsAchievementsIfEligible(
    userId: number,
    nrWins: number,
  ): Promise<void> {
    if (nrWins === 1)
      await this.grantAchievement(userId, Achievements.BEGINNERS_TRIUMPH);
    else if (nrWins === 5)
      await this.grantAchievement(userId, Achievements.PONG_MASTER);
  }

  public async grantLossesAchievementsIfEligible(
    userId: number,
    nrLosses: number,
  ): Promise<void> {
    if (nrLosses === 1)
      await this.grantAchievement(userId, Achievements.FIRST_SETBACK);
    else if (nrLosses === 5)
      await this.grantAchievement(userId, Achievements.THE_STYLISH_ONE);
  }

  public async grantFriendsAchievementsIfEligible(
    userId: number,
    nrFriends: number,
  ): Promise<void> {
    if (nrFriends === 1)
      await this.grantAchievement(userId, Achievements.FIRST_BUDDY);
    else if (nrFriends === 5)
      await this.grantAchievement(userId, Achievements.FRIENDLY);
  }

  public async grantRejectedButNotDejected(userId: number): Promise<void> {
    await this.grantAchievement(userId, Achievements.REJECTED_BUT_NOT_DEJECTED);
  }

  public async grantBreakingThePaddleBond(userId: number): Promise<void> {
    await this.grantAchievement(userId, Achievements.BREAKING_THE_PADDLE_BOND);
  }

  private async grantAchievement(
    userId: number,
    achievement: Achievements,
    timeout?: number,
  ): Promise<void> {
    if (await this.userAlreadyHaveThisAchievement(userId, achievement)) {
      return;
    }

    await this.achievementRepository.save({
      user: { id: userId },
      achievement: achievement,
    });

    if (timeout) {
      setTimeout((): void => {
        this.connectionGateway.sendAchievementUnlocked(userId);
      }, timeout);
    } else {
      this.connectionGateway.sendAchievementUnlocked(userId);
    }

    this.logger.log(`UID= ${userId} just received ${achievement}!`);
  }

  private async userAlreadyHaveThisAchievement(
    userId: number,
    achievementToCheck: Achievements,
  ): Promise<boolean> {
    const userAchievements: Achievement[] =
      await this.achievementRepository.findBy({ user: { id: userId } });

    return userAchievements.some(
      (achievement: Achievement): boolean =>
        achievement.achievement === achievementToCheck,
    );
  }
}
