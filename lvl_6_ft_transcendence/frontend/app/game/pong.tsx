import { useEffect, useRef } from "react";
import { Press_Start_2P } from "next/font/google";

import {
  Paddle,
  Ball,
  PADDLE_HEIGHT,
  PADDLE_WALL_OFFSET,
  PADDLE_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from "./definitions";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"] });

const KEYDOWN = "ArrowDown";
const KEYUP = "ArrowUp";

export default function Pong({
  givePoint,
}: {
  givePoint: (rightPlayer: boolean) => void;
}) {
  // const [pow] = useSound("./sounds/pow.wav")
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const leftPaddle = new Paddle(PADDLE_WALL_OFFSET);
  const rightPaddle = new Paddle(
    CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
  );
  const ball = new Ball();

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas && canvas.getContext("2d");

    const draw = () => {
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "#FFF";
        context.fillRect(
          rightPaddle.x,
          rightPaddle.y,
          PADDLE_WIDTH,
          PADDLE_HEIGHT
        );
        context.fillRect(
          leftPaddle.x,
          leftPaddle.y,
          PADDLE_WIDTH,
          PADDLE_HEIGHT
        );

        context.beginPath();
        context.arc(ball.left, ball.top, ball.size, 0, Math.PI * 2);
        context.fill();
      }
    };

    const reset = async (delayTime: number) => {
      leftPaddle.reset();
      rightPaddle.reset();
      ball.reset();

      draw();
      await delay(delayTime);
      update();
    };

    function update() {
      leftPaddle.move();
      rightPaddle.move();
      ball.move();

      const colideWithHorizontalWall =
        ball.bottom > CANVAS_HEIGHT || ball.top < 0;
      if (colideWithHorizontalWall) {
        ball.ySpeed *= -1;
      }

      if (
        leftPaddle.isBallColliding(ball.speed, ball.left, ball.top) ||
        rightPaddle.isBallColliding(ball.speed, ball.right, ball.top)
      ) {
        ball.verticalBounce();

        let relativeIntersectY: number;

        if (ball.left < CANVAS_WIDTH / 2) {
          relativeIntersectY = leftPaddle.y + PADDLE_HEIGHT / 2 - ball.top;
        } else {
          relativeIntersectY = rightPaddle.y + PADDLE_HEIGHT / 2 - ball.top;
        }

        ball.ySpeed = (-relativeIntersectY / (PADDLE_HEIGHT / 2)) * 4;
      } else if (ball.left > CANVAS_WIDTH || ball.right < 0) {
        givePoint(ball.left < 0);
        reset(3 * 1000);
        return;
      }

      draw();
      requestAnimationFrame(update);
    }

    const handleKeyDown = ({ key }: KeyboardEvent) => {
      if (key === "s" || key === "w") {
        leftPaddle.allowMove(key === "s");
      }

      if (key === KEYDOWN || key === KEYUP) {
        rightPaddle.allowMove(key === KEYDOWN);
      }
    };

    const handleKeyUp = ({ key }: KeyboardEvent) => {
      if (key === "s" || key === "w") {
        leftPaddle.blockMove();
      }

      if (KEYDOWN === key || KEYUP === key) {
        rightPaddle.blockMove();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    reset(1000);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasRef]);

  return (
    <canvas
      className="border mx-auto"
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    ></canvas>
  );
}
