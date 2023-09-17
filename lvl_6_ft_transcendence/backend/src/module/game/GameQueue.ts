import { Logger } from '@nestjs/common';
import { Player } from './Player';

export class GameQueue {
  private players: Player[];

  constructor() {
    this.players = [];
  }

  private readonly logger: Logger = new Logger(GameQueue.name);

  public enqueue(player: Player): void {
    this.players.push(player);
    this.logger.log(`${this.size()} players in queue`);
  }

  public dequeue(): Player | undefined {
    this.logger.log(`${this.size()} players in queue`);
    return this.players.shift();
  }

  public size(): number {
    return this.players.length;
  }

  public isEmpty(): boolean {
    return this.players.length === 0;
  }

  public isPlayerInQueue(playerUID: number): boolean {
    const playerIndex: number = this.players.findIndex(
      (player: Player): boolean => {
        return player.userId === playerUID;
      },
    );

    return playerIndex !== -1;
  }

  public removePlayerFromQueueByUID(playerUID: number): Player | null {
    const playerIndex: number = this.players.findIndex(
      (player: Player): boolean => {
        return player.userId === playerUID;
      },
    );

    return playerIndex === -1 ? null : this.players.splice(playerIndex, 1)[0];
  }
}
