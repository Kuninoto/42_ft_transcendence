import { Message } from "../module/chat/message/entity/message.entity";
import { ChatRoom } from "../module/chat/room/entity/chatRoom.entity";
import { BlockedUser } from 'src/entity/blocked-user.entity';
import { Friendship } from 'src/entity/friendship.entity';
import { GameInfo } from 'src/entity/game.entity';
import { MatchHistory } from 'src/entity/match-history.entity';
import { UserRecord } from 'src/entity/user-record.entity';
import { User } from '../entity/user.entity';

const entities = [
  BlockedUser,
  Friendship,
  GameInfo,
  MatchHistory,
  UserRecord,
  User,
  Message,
  ChatRoom
];

export { BlockedUser, Friendship, GameInfo, MatchHistory, UserRecord, User, Message, ChatRoom };
export default entities;
