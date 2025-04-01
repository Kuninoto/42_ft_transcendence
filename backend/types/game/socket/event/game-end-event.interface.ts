export interface GameEndEvent {
  winner: {
    userId: number;
    score: number;
  };

  loser: {
    userId: number;
    score: number;
  };
}
