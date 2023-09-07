import { RoomInvite } from 'types';
import { CreateRoomInviteDTO } from './dto/create-room-invite.dto';
import { UUID } from 'crypto';

export class RoomInviteMap {
  /* As JS is a fuckfest maps with numbers as keys don't work
    because under the hood the keys are always strings,
    due to that, I'm forced to use the string type for Ids, which are numbers :) */
  private roomInviteMap: Map<string, RoomInvite> = new Map<
    string,
    RoomInvite
  >();

  public createRoomInvite(createRoomInviteDto: CreateRoomInviteDTO): UUID {
    const inviteId: UUID = crypto.randomUUID();

    this.roomInviteMap.set(inviteId.toString(), {
      roomId: createRoomInviteDto.roomId,
      inviterUID: createRoomInviteDto.inviterUID,
      receiverUID: createRoomInviteDto.receiverUID,
    });
    return inviteId;
  }

  public deleteInviteByInviteId(inviteId: UUID): void {
    this.roomInviteMap.delete(inviteId.toString());
  }

  public deleteAllInvitesToUser(userId: number): void {
    this.roomInviteMap.forEach((value: RoomInvite, key: string): void => {
      if (userId == value.receiverUID) this.roomInviteMap.delete(key);
    });
  }

  public findInviteById(inviteId: UUID): RoomInvite {
    return this.roomInviteMap.get(inviteId.toString());
  }
}
