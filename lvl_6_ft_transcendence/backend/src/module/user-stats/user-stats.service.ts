import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStats } from 'src/typeorm';
import { Repository } from 'typeorm';
import { UserStatsForLeaderboard, UserStatsInterface } from 'types';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    @Inject(forwardRef(() => AchievementService))
    private readonly achievementService: AchievementService,
  ) {}

  public async createUserStats(forUser: User): Promise<UserStats> {
    const newUserStats: UserStats = this.userStatsRepository.create();
    newUserStats.user = forUser;
    return await this.userStatsRepository.save(newUserStats);
  }

  public async getLeaderboard(): Promise<UserStatsForLeaderboard[]> {
    // Get user ids, avatar_urls, names, wins and win_rates
    // and sort them by wins and win_rates in descending order
    // if the number of wins of two players are equal
    // the one with the bigger win rate is placed above
    const leaderboardData: UserStatsForLeaderboard[] =
      await this.userStatsRepository
        .createQueryBuilder('userStats')
        .select('user.id', 'uid')
        .addSelect('user.avatar_url', 'avatar_url')
        .addSelect('user.name', 'name')
        .addSelect('userStats.wins', 'wins')
        .addSelect('win_rate')
        .leftJoin('userStats.user', 'user')
        .orderBy('userStats.wins', 'DESC')
        .addOrderBy('win_rate', 'DESC')
        .getRawMany();

    return leaderboardData.map((leaderboardRow) => ({
      uid: leaderboardRow.uid,
      avatar_url: leaderboardRow.avatar_url,
      name: leaderboardRow.name,
      wins: leaderboardRow.wins,
      win_rate: leaderboardRow.win_rate === null ? 0 : leaderboardRow.win_rate,
    }));
  }

  public async findUserStatsByUID(userId: number): Promise<UserStatsInterface> {
    const userStats: UserStats = await this.userStatsRepository.findOneBy({
      user: { id: userId },
    });

    const userStatsInterfaces: UserStatsInterface = {
      wins: userStats.wins,
      losses: userStats.losses,
      win_rate:
        userStats.win_rate == null
          ? 0
          : parseFloat(userStats.win_rate.toPrecision(3)),
      matches_played: userStats.matches_played,
    };

    return userStatsInterfaces;
  }

  public async updateUserStatsUponGameEnd(
    winnerUID: number,
    loserUID: number,
    wonByDisconnection: boolean,
  ) {
    await this.userStatsRepository.update(winnerUID, {
      wins: () => 'wins + 1',
      win_rate: () =>
        'CAST(wins + 1 AS double precision) / (matches_played + 1) * 100.0',
      matches_played: () => 'matches_played + 1',
    });

    await this.userStatsRepository.update(loserUID, {
      losses: () => 'losses + 1',
      win_rate: () =>
        'CAST(wins AS double precision) / (matches_played + 1) * 100.0',
      matches_played: () => 'matches_played + 1',
    });

    const winnerWins: number = Number(
      (await this.findUserStatsByUID(winnerUID)).wins,
    );
    const loserLosses: number = Number(
      (await this.findUserStatsByUID(loserUID)).losses,
    );

    await this.achievementService.grantWinsAchievementsIfEligible(
      winnerUID,
      winnerWins,
    );

    if (wonByDisconnection) {
      await this.achievementService.grantUnexpectedVictory(winnerUID);
    }

    await this.achievementService.grantLossesAchievementsIfEligible(
      loserUID,
      loserLosses,
    );
  }
}
