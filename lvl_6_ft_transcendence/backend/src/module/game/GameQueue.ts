export class GameQueue {
  private players_id: number[];

  constructor() {
    this.players_id = [];
  }

  public enqueue(newPlayerId: number): void {
    this.players_id.push(newPlayerId);
  }

  public dequeue(): number | undefined {
    return this.players_id.shift();
  }

  public isEmpty(): boolean {
    return this.players_id.length === 0;
  }

  public size(): number {
    return this.players_id.length;
  }
}
