export enum PlayerSide {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum QueueMessage {
  WAITING_FOR_OPPONENT = 'Waiting for opponent',
  OPPONENT_FOUND = 'Opponent found!',
}

export interface GameQueueDataDTO {
  side: PlayerSide;
  message: string;
}
