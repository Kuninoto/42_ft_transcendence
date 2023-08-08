import { User } from "../../../../entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatRoom } from "./chatRoom.entity";

@Entity()
export class JoinedRoomEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  socketId: string;

  @ManyToOne(() => User, user => user.room)
  @JoinColumn()
  user: User;

  @ManyToOne(() => ChatRoom, room => room.users)
  @JoinColumn()
  room: ChatRoom;

}