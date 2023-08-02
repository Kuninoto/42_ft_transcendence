import { BlockedUser } from 'src/entity/blocked-user.entity';
import { Friendship } from 'src/entity/friendship.entity';
import { GameResult } from './game-result.entity';
import { UserRecord } from 'src/entity/user-record.entity';
import { User } from './user.entity';

const entities = [BlockedUser, Friendship, GameResult, UserRecord, User];

export { BlockedUser, Friendship, GameResult, UserRecord, User };
export default entities;
