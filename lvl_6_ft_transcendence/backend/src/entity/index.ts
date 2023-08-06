import { BlockedUser } from 'src/entity/blocked-user.entity';
import { Friendship } from 'src/entity/friendship.entity';
import { GameResult } from './game-result.entity';
import { UserStats } from 'src/entity/user-stats.entity';
import { User } from './user.entity';

const entities = [BlockedUser, Friendship, GameResult, UserStats, User];

export { BlockedUser, Friendship, GameResult, UserStats, User };
export default entities;
