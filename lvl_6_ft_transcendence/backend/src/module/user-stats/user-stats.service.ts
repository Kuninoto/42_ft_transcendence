import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatsForLeaderboard } from 'src/common/types/user-stats-for-leaderboard.interface';
import { UserStatsInterface } from 'src/common/types/user-stats-interface.interface';
import { User, UserStats } from 'src/entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  public async createUserStats(forUser: User): Promise<UserStats> {
    const newUserStats: UserStats = this.userStatsRepository.create();
    newUserStats.user = forUser;
    return await this.userStatsRepository.save(newUserStats);
  }

  public async getLeaderboard(): Promise<UserStatsForLeaderboard[]> {
    // Get user ids, names, wins and win_rates
    // and sort them by wins and win_rates in descending order
    // if the number of wins of two players are equal
    // the one with the bigger win rate is placed above
    const leaderboardData: {
      wins: number;
      uid: number;
      name: string;
      win_rate: number;
    }[] = await this.userStatsRepository
      .createQueryBuilder('userStats')
      .select('user.id', 'uid')
      .addSelect('user.name', 'name')
      .addSelect('userStats.wins', 'wins')
      .addSelect('win_rate')
      .leftJoin('userStats.user', 'user')
      .orderBy('userStats.wins', 'DESC')
      .addOrderBy('win_rate', 'DESC')
      .getRawMany();

    return leaderboardData.map((leaderboardRow) => ({
      uid: leaderboardRow.uid,
      name: leaderboardRow.name,
      wins: leaderboardRow.wins,
      win_rate: leaderboardRow.win_rate,
    }));
  }

  public async findUserStatsByUID(userId: number): Promise<UserStatsInterface> {
    const userStats: UserStats = await this.userStatsRepository.findOneBy({
      user: { id: userId },
    });

    const userStatsInterfaces: UserStatsInterface = {
      wins: userStats.wins,
      losses: userStats.losses,
      win_rate: userStats.win_rate == null ? 0 : userStats.win_rate,
      matches_played: userStats.matches_played,
    };

    return userStatsInterfaces;
  }

  public async updateUserStatsUponGameEnd(winnerUID: number, loserUID: number) {
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
}