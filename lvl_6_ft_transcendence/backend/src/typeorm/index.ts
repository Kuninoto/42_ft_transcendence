import { Friendship } from 'src/entity/friendship.entity';
import { User } from '../entity/user.entity';
import { FriendRequest } from 'src/entity/friend-request.entity';

const entities = [User, FriendRequest, Friendship];

export { User, FriendRequest, Friendship };
export default entities;
