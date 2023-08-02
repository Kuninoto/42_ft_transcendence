import { GameRoom } from './GameRoom';

export class GameRoomsMap {
  private gameMap: Map<string, GameRoom> = new Map<string, GameRoom>();

  public createNewGameRoom(newGameRoom: GameRoom): void {
    this.gameMap.set(newGameRoom.roomId, newGameRoom);
  }

  public updateGameRoomById(roomId: string, newInfo: Partial<GameRoom>): void {
    const gameRoom: GameRoom = this.gameMap.get(roomId);
    if (!gameRoom) {
      return;
    }

    // Merge the info on GameRoom with the new coming on newInfo
    // refer to:
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#partial-readonly-record-and-pick
    const updatedGameRoom: GameRoom = { ...gameRoom, ...newInfo };
    this.gameMap.set(roomId, updatedGameRoom);
  }

  public findGameRoomById(roomId: string): GameRoom | undefined {
    return this.gameMap.get(roomId);
  }

  public deleteGameRoomById(roomId: string): void {
    this.gameMap.delete(roomId);
  }
}
