import { Injectable } from '@nestjs/common';
import { GameQueue } from './game-queue';

@Injectable()
export class GameService {
  constructor(private gameQueue: GameQueue) {}

  public async queueToLadder(userID: number) {
    // userID or clientId from the socket?

    this.gameQueue.enqueue(userID);
  }
}
