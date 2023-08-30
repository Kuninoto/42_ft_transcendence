import { Logger } from '@nestjs/common';

import { Player } from './Player';

export class GameQueue {
  private readonly logger: Logger = new Logger(GameQueue.name);

  private players: Player[];

  constructor() {
    this.players = [];
  }

  public dequeue(): Player | undefined {
    this.logger.log(`${this.size()} players in queue`);
    return this.players.shift();
  }

  public enqueue(player: Player): void {
    this.players.push(player);
    this.logger.log(`${this.size()} players in queue`);
  }

  public isEmpty(): boolean {
    return this.players.length === 0;
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

  public removePlayerFromQueueByUID(playerUID: number): null | Player {
    const playerIndex: number = this.players.findIndex((player) => {
      return player.userId === playerUID;
    });

    if (playerIndex === -1) {
      return null;
    }

    return this.players.splice(playerIndex, 1)[0];
  }

  public size(): number {
    return this.players.length;
  }
}
