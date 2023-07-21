import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class GameQueue {
  constructor(private usersService: UsersService) {}

  private game_queue: Set<number> = new Set();

  public enqueue(userId: number): void {
    this.usersService
    this.game_queue.add(userId);
  }

  public dequeue(userId: number): void {
    this.game_queue.delete(userId);
  }

  public chooseRandomOpponent(): number {
    const idsFromUsersInQueue: number[] = Array.from(this.game_queue);
    const randomUserIdIndex: number = Math.floor(
      Math.random() * idsFromUsersInQueue.length,
    );

    return idsFromUsersInQueue[randomUserIdIndex];
  }

  public clear(): void {
    this.game_queue.clear();
  }

  public size(): number {
    return this.game_queue.size;
  }

  public isInQueue(userId: number): boolean {
    return this.game_queue.has(userId);
  }
}
