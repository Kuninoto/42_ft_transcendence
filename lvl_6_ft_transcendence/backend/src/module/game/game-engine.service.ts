import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PlayerSide } from 'types';
import { Ball, BALL_RADIUS } from './Ball';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { CANVAS_HEIGHT, CANVAS_WIDTH, GameRoom } from './GameRoom';
import { GameRoomMap } from './GameRoomMap';
import { MAX_SCORE, PADDLE_HEIGHT, PADDLE_WIDTH, Player } from './Player';

const GAME_LOOP_INTERVAL = 7.5;
const RESET_GAME_DELAY = 6;

// Hacky way to make js wait
const sleep = (ms: number) => new Promise(() => setTimeout(() => {}, ms));

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
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly GameRoomMap: GameRoomMap,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
  ) {}

  public startGame(roomId: string): void {
    const gameRoom: GameRoom | undefined =
      this.GameRoomMap.findGameRoomById(roomId);

    // If a user disconnects right upon game start
    // gameRoom will be undefined
    if (!gameRoom) {
      return;
    }

    gameRoom.gameLoopIntervalId = setInterval(() => {
      // Fetch the game room info (which can possibly be updated by
      // game-gateway on 'paddle-move' message) and pass it to the gameLoop()
      this.gameLoop(this.GameRoomMap.findGameRoomById(roomId));
    }, GAME_LOOP_INTERVAL);
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

  private gameLoop(gameRoom: GameRoom): void {
    gameRoom.ball.moveBySpeed();
    this.gameGateway.broadcastGameRoomInfo(gameRoom);

    if (this.ballCollidedWithWall(gameRoom.ball)) {
      this.gameGateway.broadcastGameRoomInfo(gameRoom);
    }

    if (this.ballCollidedWithPaddle(gameRoom)) {
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
    const isWithinPaddleHeight = (ballY: number, paddleY: number): boolean => {
      return (
        ballY + BALL_RADIUS <= paddleY + PADDLE_HEIGHT / 2 &&
        ballY - BALL_RADIUS >= paddleY - PADDLE_HEIGHT / 2
      );
    };

    let player: Player;

    if (gameRoom.ball.x < CANVAS_WIDTH / 2) {
      // If ball X position is smaller than canvas'
      // midpoint it's on the left side
      player = gameRoom.leftPlayer;

      // Collided with paddle's right side && is within the paddle height
      if (
        gameRoom.ball.x - BALL_RADIUS <= player.paddleX + PADDLE_WIDTH / 2 &&
        isWithinPaddleHeight(gameRoom.ball.y, player.paddleY) &&
        gameRoom.ball.x - BALL_RADIUS > player.paddleX - PADDLE_WIDTH / 2 &&
        gameRoom.ball.speed.x < 0
      ) {
        gameRoom.ball.bounceOnCollidePoint(
          player.paddleY + PADDLE_HEIGHT / 2 - gameRoom.ball.y + BALL_RADIUS,
        );
        return true;
      }
    } else {
      player = gameRoom.rightPlayer;

      // Collided with paddle's left side && is within the paddle height
      if (
        gameRoom.ball.x + BALL_RADIUS >= player.paddleX - PADDLE_WIDTH / 2 &&
        isWithinPaddleHeight(gameRoom.ball.y, player.paddleY) &&
        gameRoom.ball.x + BALL_RADIUS < player.paddleX + PADDLE_WIDTH / 2 &&
        gameRoom.ball.speed.x > 0
      ) {
        gameRoom.ball.bounceOnCollidePoint(
          player.paddleY + PADDLE_HEIGHT / 2 - gameRoom.ball.y + BALL_RADIUS,
        );
        return true;
      }
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
