import { GameType } from "./game-type.enum";

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

  gameType: GameType;
}
