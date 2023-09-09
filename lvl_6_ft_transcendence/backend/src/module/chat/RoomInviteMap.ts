import { nanoid } from 'nanoid';
import { RoomInvite } from 'types';
import { CreateRoomInviteDTO } from './dto/create-room-invite.dto';

export class RoomInviteMap {
  /* As JS is a fuckfest maps with numbers as keys don't work
    because under the hood the keys are always strings,
    due to that, I'm forced to use the string type for Ids, which are numbers :) */
  private roomInviteMap: Map<string, RoomInvite> = new Map<
    string,
    RoomInvite
  >();

  public createRoomInvite(createRoomInviteDto: CreateRoomInviteDTO): string {
    const inviteId: string = nanoid();

    this.roomInviteMap.set(inviteId, {
      roomId: createRoomInviteDto.roomId,
      inviterUID: createRoomInviteDto.inviterUID,
      receiverUID: createRoomInviteDto.receiverUID,
    });
    return inviteId;
  }

  public findInviteById(inviteId: string): RoomInvite {
    return this.roomInviteMap.get(inviteId);
  }

  public findAllInvitesWithUser(userId: number): RoomInvite[] {
    let invites: RoomInvite[] = [];

    this.roomInviteMap.forEach((invite: RoomInvite): void => {
      if (userId == invite.inviterUID || userId == invite.receiverUID)
        invites.push(invite);
    })

    return invites;
  }

  public deleteInviteByInviteId(inviteId: string): void {
    this.roomInviteMap.delete(inviteId);
  }

  public deleteAllInvitesToUser(userId: number): void {
    this.roomInviteMap.forEach((value: RoomInvite, key: string): void => {
      if (userId == value.receiverUID) this.roomInviteMap.delete(key);
    });
  }
}
