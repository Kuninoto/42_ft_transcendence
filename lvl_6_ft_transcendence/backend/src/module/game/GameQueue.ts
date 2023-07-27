export class GameQueue {
  private players_id: string[];

  constructor() {
    this.players_id = [];
  }

  public enqueue(newPlayerId: string): void {
    this.players_id.push(newPlayerId);
  }

  public dequeue(): string | undefined {
    return this.players_id.shift();
  }

  public isEmpty(): boolean {
    return this.players_id.length === 0;
  }

  public removePlayerFromQueue(playerId: string): void {
    const indexOfPlayerID: number = this.players_id.indexOf(playerId);
    this.players_id.splice(indexOfPlayerID, 1);
  }

  public size(): number {
    return this.players_id.length;
  }
}
