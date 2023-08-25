export interface GameResultInterface {
  winner: {
    userId: number;
    name: string;
    avatar_url: string;
    score: number;
  };
  loser: {
    userId: number;
    name: string;
    avatar_url: string;
    score: number;
  };
}
