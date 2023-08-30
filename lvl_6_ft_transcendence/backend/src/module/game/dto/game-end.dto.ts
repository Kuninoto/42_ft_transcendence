export interface GameEndDTO {
  loser: {
    score: number;
    userId: number;
  };

  winner: {
    score: number;
    userId: number;
  };
}
