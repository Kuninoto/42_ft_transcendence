export interface JoinRoomRequest {
  readonly roomId: number;
  readonly password?: string;
  readonly inviteId?: number;
}
