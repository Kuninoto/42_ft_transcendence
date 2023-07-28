import { BlockedUser } from 'src/entity/blocked-user.entity';
import { Friendship } from 'src/entity/friendship.entity';
import { GamesInfo } from 'src/entity/game-info.entity';
import { MatchHistory } from 'src/entity/match-history.entity';
import { UserRecord } from 'src/entity/user-record.entity';
import { User } from '../entity/user.entity';

const entities = [
  BlockedUser,
  Friendship,
  GamesInfo,
  MatchHistory,
  UserRecord,
  User,
];

export { BlockedUser, Friendship, GamesInfo, MatchHistory, UserRecord, User };
export default entities;
