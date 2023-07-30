export class GameQueue {
  private playersClientId: string[];

  constructor() {
    this.playersClientId = [];
  }

  public enqueue(newPlayerId: string): void {
    this.playersClientId.push(newPlayerId);
    console.log('gameQueue now has ' + this.size() + ' players');
  }

  public dequeue(): string | undefined {
    console.log('gameQueue now has ' + (this.size() - 1) + ' players');
    return this.playersClientId.shift();
  }

  public isEmpty(): boolean {
    return this.playersClientId.length === 0;
  }

  public removePlayerFromQueue(playerId: string): void {
    const indexOfPlayerID: number = this.playersClientId.indexOf(playerId);
    this.playersClientId.splice(indexOfPlayerID, 1);
  }

  public size(): number {
    return this.playersClientId.length;
  }
}
