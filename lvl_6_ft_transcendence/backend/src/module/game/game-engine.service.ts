import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { BALL_RADIUS, Ball } from './Ball';
import {
  CANVAS_HEIGHT,
  CANVAS_MID_WIDTH,
  CANVAS_WIDTH,
  GameRoom,
} from './GameRoom';
import { GameRoomMap } from './GameRoomMap';
import { MAX_SCORE, PADDLE_HEIGHT, PADDLE_WIDTH, Player } from './Player';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

const GAME_LOOP_INTERVAL: number = 8;
const RESET_GAME_DELAY: number = 2;

// Hacky way to make js wait
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* 
CANVAS AXIS

0,0
º _ _ _ _ _ _ _ _ →
|
|
|
|
|
|
↓
*/

@Injectable()
export class GameEngineService {
  constructor(
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly GameRoomMap: GameRoomMap,
  ) {}

  public startGame(roomId: string): void {
    const gameRoom: GameRoom = this.GameRoomMap.findGameRoomById(roomId);
    gameRoom.gameLoopIntervalId = setInterval(() => {
      // Fetch the game room info (which can possibly be updated by
      // game-gateway on 'paddle-move' message) and pass it to the gameLoop()
      this.gameLoop(this.GameRoomMap.findGameRoomById(roomId));
    }, GAME_LOOP_INTERVAL);
  }

  private gameLoop(gameRoom: GameRoom): void {
    console.log(gameRoom.leftPlayer.paddleX, gameRoom.leftPlayer.paddleY)
    console.log(gameRoom.rightPlayer.paddleX, gameRoom.rightPlayer.paddleY)
    gameRoom.ball.moveBySpeed();
    this.gameGateway.broadcastGameRoomInfo(gameRoom);

    if (this.ballCollidedWithPaddle(gameRoom)) {
      this.gameGateway.broadcastGameRoomInfo(gameRoom);
    }

    if (this.ballCollidedWithWall(gameRoom.ball)) {
      this.gameGateway.broadcastGameRoomInfo(gameRoom);
    }

    if (this.somePlayerScored(gameRoom)) {
      this.gameGateway.broadcastGameRoomInfo(gameRoom);

      // Check if game should end
      if (
        gameRoom.rightPlayer.score === MAX_SCORE ||
        gameRoom.leftPlayer.score === MAX_SCORE
      ) {
        this.endGame(gameRoom);
        return;
      }

      sleep(RESET_GAME_DELAY);
    }
  }

  public async endGame(gameRoom: GameRoom) {
    clearInterval(gameRoom.gameLoopIntervalId);

    if (gameRoom.leftPlayer.score === MAX_SCORE) {
      // LEFT PLAYER WINS
      await this.gameService.gameEnded(
        gameRoom.gameType,
        gameRoom.roomId,
        gameRoom.leftPlayer,
        gameRoom.rightPlayer,
        false,
      );
    } else {
      // RIGHT PLAYER WINS
      await this.gameService.gameEnded(
        gameRoom.gameType,
        gameRoom.roomId,
        gameRoom.rightPlayer,
        gameRoom.leftPlayer,
        false,
      );
    }
  }

  public async endGameDueToDisconnection(
    gameRoom: GameRoom,
    winnerSide: PlayerSide,
  ) {
    clearInterval(gameRoom.gameLoopIntervalId);

    if (winnerSide === PlayerSide.LEFT) {
      // LEFT PLAYER WINS
      await this.gameService.gameEnded(
        gameRoom.gameType,
        gameRoom.roomId,
        gameRoom.leftPlayer,
        gameRoom.rightPlayer,
        true,
      );
    } else {
      // RIGHT PLAYER WINS
      await this.gameService.gameEnded(
        gameRoom.gameType,
        gameRoom.roomId,
        gameRoom.rightPlayer,
        gameRoom.leftPlayer,
        true,
      );
    }
  }

  private ballCollidedWithWall(ball: Ball): boolean {
    // TOP || BOTTOM
    if (
      (ball.y - BALL_RADIUS <= 0 && ball.speed.y < 0) ||
      (ball.y + BALL_RADIUS >= CANVAS_HEIGHT && ball.speed.y > 0)
    ) {
      ball.bounceInY();
      return true;
    }
    return false;
  }

  /* Verifies if the ball is colliding with a paddle and updates
  its direction if so */
  private ballCollidedWithPaddle(gameRoom: GameRoom): boolean {
    // If ball X position is smaller than canvas'
    // midpoint it is on the left side
    const player: Player =
      gameRoom.ball.x < CANVAS_MID_WIDTH
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    if (
      gameRoom.ball.x >= player.paddleX - PADDLE_WIDTH &&
      gameRoom.ball.x - BALL_RADIUS <= player.paddleX + PADDLE_WIDTH &&
      gameRoom.ball.y < player.paddleY + PADDLE_HEIGHT &&
      gameRoom.ball.y > player.paddleY
    ) {
      gameRoom.ball.bounceInX();
      gameRoom.ball.bounceOnCollidePoint(
        player.paddleY + PADDLE_HEIGHT / 2 - gameRoom.ball.y + BALL_RADIUS,
      );
      return true;
    }
    return false;
  }

  private somePlayerScored(gameRoom: GameRoom): boolean {
    if (gameRoom.ball.x - BALL_RADIUS <= 0) {
      // BALL PASSED LEFT SIDE

      gameRoom.rightPlayer.score += 1;
      gameRoom.ball.reset();
      this.gameGateway.emitPlayerScoredEvent(
        gameRoom.roomId,
        gameRoom.leftPlayer.score,
        gameRoom.rightPlayer.score,
      );
      return true;
    } else if (gameRoom.ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
      // BALL PASSED RIGHT SIDE

      gameRoom.leftPlayer.score += 1;
      gameRoom.ball.reset();
      this.gameGateway.emitPlayerScoredEvent(
        gameRoom.roomId,
        gameRoom.leftPlayer.score,
        gameRoom.rightPlayer.score,
      );
      return true;
    }
    return false;
  }
}
