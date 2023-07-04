import { User } from "../entity/user.entity";
import { Message } from "../module/chat/entities/message.entity";
import { ChatRoom } from "../module/chat/entities/chatRoom.entity";

const entities = [User, Message];

export { User };
export { Message };
export { ChatRoom };
export default entities;
