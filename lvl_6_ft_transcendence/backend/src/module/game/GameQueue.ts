import { Player } from './Player';

export class GameQueue {
  private players: Player[];

  constructor() {
    this.players = [];
  }

  public enqueue(player: Player): void {
    this.players.push(player);
    console.log('gameQueue now has ' + this.size() + ' players');
  }

  public dequeue(): Player | undefined {
    console.log('gameQueue now has ' + (this.size() - 1) + ' players');
    return this.players.shift();
  }

  public isEmpty(): boolean {
    return this.players.length === 0;
  }

  public size(): number {
    return this.players.length;
  }

  public isPlayerInQueue(playerUID: number): boolean {
    const playerIndex: number = this.players.findIndex((player) => {
      return player.userId === playerUID;
    });

    if (playerIndex === -1) {
      return false;
    }

    return true;
  }

  public removePlayerFromQueueByClientId(clientId: string): Player | null {
    const playerIndex: number = this.players.findIndex((player) => {
      return player.client.id === clientId;
    });

    if (playerIndex === -1) {
      return null;
    }

    return this.players.splice(playerIndex, 1)[0];
  }
}
