export interface GameEndEvent {
  readonly winner: {
    readonly userId: number;
    readonly score: number;
  };

  readonly loser: {
    readonly userId: number;
    readonly score: number;
  };
}
