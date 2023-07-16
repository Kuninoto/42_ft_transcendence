import { Friendship } from 'src/entity/friendship.entity';
import { User } from '../entity/user.entity';
import { BlockedUser } from 'src/entity/blocked-user.entity';

const entities = [User, Friendship, BlockedUser];

export { User, Friendship, BlockedUser };
export default entities;
