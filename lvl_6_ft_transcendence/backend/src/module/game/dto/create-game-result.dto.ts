import { GameType } from 'src/common/types/game-type.enum';
import { User } from 'src/entity/index';

export interface CreateGameResultDTO {
  game_type: GameType;
  winner: User;
  winner_score: number;
  loser: User;
  loser_score: number;
}
