import { Achievement } from './achievement.entity';
import { BlockedUser } from './blocked-user.entity';
import { ChatRoom } from './chat-room.entity';
import { DirectMessage } from './direct-messages.entity';
import { Friendship } from './friendship.entity';
import { GameResult } from './game-result.entity';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';

const entities: any[] = [
  Achievement,
  BlockedUser,
  ChatRoom,
  DirectMessage,
  Friendship,
  GameResult,
  User,
  UserStats,
];

export {
  Achievement,
  BlockedUser,
  ChatRoom,
  DirectMessage,
  Friendship,
  GameResult,
  User,
  UserStats,
};
export default entities;
