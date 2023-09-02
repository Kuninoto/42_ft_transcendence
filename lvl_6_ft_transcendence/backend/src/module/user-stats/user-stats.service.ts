import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStats } from 'src/entity';
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

  public async findLadderLevelByUID(userId: number): Promise<number> {
    /* +1 due to the manner that the frontend is rendering the leaderboard
     the user at
     index 0 = first place
     index 1 = second place
     etc... */
    return (
      (await this.getLeaderboard()).findIndex(
        (leaderBoardRow: UserStatsForLeaderboard) => {
          return leaderBoardRow.uid == userId;
        },
      ) + 1
    );
  }

  public async findUserStatsByUID(userId: number): Promise<UserStatsInterface> {
    const userStats: UserStats = await this.userStatsRepository.findOneBy({
      user: { id: userId },
    });

    const userStatsInterfaces: UserStatsInterface = {
      losses: userStats.losses,
      matches_played: userStats.matches_played,
      win_rate:
        userStats.win_rate == null
          ? 0
          : parseFloat(userStats.win_rate.toPrecision(3)),
      wins: userStats.wins,
    };

    return userStatsInterfaces;
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

    return leaderboardData.map((leaderboardRow: UserStatsForLeaderboard): UserStatsForLeaderboard => ({
      uid: leaderboardRow.uid,
      name: leaderboardRow.name,
      avatar_url: leaderboardRow.avatar_url,
      wins: leaderboardRow.wins,
      win_rate: leaderboardRow.win_rate === null ? 0 : leaderboardRow.win_rate,
    }));
  }

  public async updateUserStatsUponGameEnd(
    winnerUID: number,
    loserUID: number,
    wonByDisconnection: boolean,
  ) {
    await this.userStatsRepository.update(winnerUID, {
      matches_played: () => 'matches_played + 1',
      win_rate: () =>
        'CAST(wins + 1 AS double precision) / (matches_played + 1) * 100.0',
      wins: () => 'wins + 1',
    });

    await this.userStatsRepository.update(loserUID, {
      losses: () => 'losses + 1',
      matches_played: () => 'matches_played + 1',
      win_rate: () =>
        'CAST(wins AS double precision) / (matches_played + 1) * 100.0',
    });

    const winnerWins = Number((await this.findUserStatsByUID(winnerUID)).wins);
    const loserLosses = Number(
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
