import { User } from "../entity/user.entity";
import { Message } from "../module/chat/message/entity/message.entity";
import { ChatRoom } from "../module/chat/room/entity/chatRoom.entity";

const entities = [User, Message];

export { User };
export { Message };
export { ChatRoom };
export default entities;
