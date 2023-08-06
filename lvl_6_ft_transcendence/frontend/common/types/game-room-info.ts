export interface Ball {
  x: number;
  y: number;
}

export interface Player {
  paddleY: number;
  score: number;
}

export interface GameRoomDTO {
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}