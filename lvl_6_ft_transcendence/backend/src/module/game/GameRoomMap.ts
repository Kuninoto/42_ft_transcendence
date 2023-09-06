import { GameRoom } from './GameRoom';

export class GameRoomMap {
  private gameRoomMap: Map<string, GameRoom> = new Map<string, GameRoom>();

  public createNewGameRoom(newGameRoom: GameRoom): void {
    this.gameRoomMap.set(newGameRoom.roomId, newGameRoom);
  }

  public deleteGameRoomByRoomId(roomId: string): void {
    this.gameRoomMap.delete(roomId);
  }

  public findGameRoomById(roomId: string): GameRoom | undefined {
    return this.gameRoomMap.get(roomId);
  }

  public findRoomWithPlayerByUID(userId: number): GameRoom | null {
    for (const gameRoom of this.gameRoomMap.values()) {
      if (
        gameRoom.leftPlayer.userId === userId ||
        gameRoom.rightPlayer.userId === userId
      ) {
        return gameRoom;
      }
    }
    return null;
  }

  public isPlayerInGame(userId: number): boolean {
    for (const gameRoom of this.gameRoomMap.values()) {
      if (
        gameRoom.leftPlayer.userId === userId ||
        gameRoom.rightPlayer.userId === userId
      ) {
        return true;
      }
    }
    return false;
  }

  public updateGameRoomById(roomId: string, newInfo: Partial<GameRoom>): void {
    const gameRoom: GameRoom | undefined = this.gameRoomMap.get(roomId);

    if (!gameRoom) return;

    // Merge the info on GameRoom with the new coming on newInfo
    // refer to:
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#partial-readonly-record-and-pick
    const updatedGameRoom: GameRoom = { ...gameRoom, ...newInfo };
    this.gameRoomMap.set(roomId, updatedGameRoom);
  }
}
