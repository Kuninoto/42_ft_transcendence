import { Injectable } from '@nestjs/common';
import { GameQueue } from './GameQueue';

@Injectable()
export class GameService {
  constructor() {}

  private gameQueue: GameQueue;

  public async queueToLadder(userID: number) {
    this.gameQueue.enqueue(userID);
    return;
  }
}
