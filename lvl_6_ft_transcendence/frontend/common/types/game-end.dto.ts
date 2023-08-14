export interface GameEndDTO {
  winner: {
    userId: number;
    score: number;
  };

  loser: {
    userId: number;
    score: number;
  };
}
