import { BlockedUser } from 'src/entity/blocked-user.entity';
import { ChatRoom } from 'src/entity/chat-room.entity';
import { DirectMessage } from 'src/entity/direct-messages.entity';
import { Friendship } from 'src/entity/friendship.entity';
import { Message } from 'src/entity/message.entity';
import { UserStats } from 'src/entity/user-stats.entity';
import { Achievement } from '../entity/achievement.entity';
import { GameResult } from '../entity/game-result.entity';
import { User } from '../entity/user.entity';

const entities = [
  Achievement,
  BlockedUser,
  ChatRoom,
  Friendship,
  GameResult,
  Message,
  DirectMessage,
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
  Message,
  User,
  UserStats,
};
export default entities;
