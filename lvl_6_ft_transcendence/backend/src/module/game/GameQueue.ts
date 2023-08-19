import { Logger } from '@nestjs/common';
import { Player } from './Player';

export class GameQueue {
  private players: Player[];

  private readonly logger: Logger = new Logger(GameQueue.name);

  constructor() {
    this.players = [];
  }

  public enqueue(player: Player): void {
    this.players.push(player);
    this.logger.log(`${this.size()} players in queue`);
  }

  public dequeue(): Player | undefined {
    this.logger.log(`${this.size()} players in queue`);
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

  public removePlayerFromQueueByUID(playerUID: number): Player | null {
    const playerIndex: number = this.players.findIndex((player) => {
      return player.userId === playerUID;
    });

    if (playerIndex === -1) {
      return null;
    }

    return this.players.splice(playerIndex, 1)[0];
  }
}
