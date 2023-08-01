import { useEffect, useRef } from 'react'

import {
	Ball,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	Paddle,
	PADDLE_HEIGHT,
	PADDLE_WALL_OFFSET,
	PADDLE_WIDTH,
} from './definitions'
import { useGame } from '@/contexts/GameContext';
import { PlayerSide } from '@/common/types/backend/player-side.enum';
import { useAuth } from '@/contexts/AuthContext';
import { themes } from '@/common/themes';

const KEYDOWN = 'ArrowDown'
const KEYUP = 'ArrowUp'

type props = {
	givePoint: (rightPlayer: boolean) => void
}

export default function Pong({ givePoint }: props) {

	const { opponentFound, emitPaddleMovement, gameInfo } = useGame()
	const { user } = useAuth()

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const backgroundImageRef = useRef(null)
	const paddleImageRef = useRef(null)

	const playerPaddleRef = useRef<Paddle>(
		new Paddle(
			emitPaddleMovement,
			opponentFound.side === PlayerSide.LEFT
				? PADDLE_WALL_OFFSET
				: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
		)
	);

	const opponentPaddleRef = useRef<Paddle>(
		new Paddle(
			emitPaddleMovement,
			opponentFound.side === PlayerSide.RIGHT
				? PADDLE_WALL_OFFSET
				: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
		)
	);

	const ball = new Ball()

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

	useEffect(() => {
		if (Object.keys(gameInfo).length !== 0) {
			if ( opponentFound.side === PlayerSide.LEFT ) {
				opponentPaddleRef.current.y = gameInfo.rightPlayer.paddleY
			} else {
				opponentPaddleRef.current.y = gameInfo.leftPlayer.paddleY
			}
		}
	}, [gameInfo])

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas && canvas.getContext('2d')

		const backgroundImage = new Image();
		const paddleImage = new Image();

		backgroundImage.src = `/game/backgrounds/${themes[user.game_theme].background}`;
		paddleImage.src = `/game/paddles/${themes[user.game_theme].paddle}`;

		backgroundImageRef.current = backgroundImage;
		paddleImageRef.current = paddleImage;

		backgroundImage.onload = () => {
			context.drawImage(backgroundImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		}

		paddleImage.onload = () => {
			context.drawImage(paddleImageRef.current, playerPaddleRef.current.x , playerPaddleRef.current.y, PADDLE_WIDTH, PADDLE_HEIGHT);
			context.drawImage(paddleImageRef.current, opponentPaddleRef.current.x, opponentPaddleRef.current.y , PADDLE_WIDTH, PADDLE_HEIGHT);
		}

		const draw = () => {
			if (context) {
				context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

				context.drawImage(backgroundImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

				context.fillStyle = '#FFF'
				context.drawImage(
					paddleImageRef.current,
					playerPaddleRef.current.x,
					playerPaddleRef.current.y,
					PADDLE_WIDTH,
					PADDLE_HEIGHT
				)
				context.drawImage(
					paddleImageRef.current,
					opponentPaddleRef.current.x,
					opponentPaddleRef.current.y,
					PADDLE_WIDTH,
					PADDLE_HEIGHT
				)

				context.beginPath()
				context.arc(ball.left, ball.top, ball.size, 0, Math.PI * 2)
				context.fill()
			}
		}

		const reset = async (delayTime: number) => {
			playerPaddleRef.current.reset()
			opponentPaddleRef.current.reset()
			ball.reset()

			draw()
			await delay(delayTime)
			update()
		}

		function update() {
			playerPaddleRef.current.move()
			opponentPaddleRef.current.move()

			// ball.move()

			/* const colideWithHorizontalWall =
				ball.bottom > CANVAS_HEIGHT || ball.top < 0
			if (colideWithHorizontalWall) {
				ball.bounceInX()
			}

			if (playerPaddleRef.isBallColliding(opponentFound.side, ball.speed, ball.left, ball.top)) {
				ball.bounceInY()
				const relativeIntersectY = playerPaddleRef.y + PADDLE_HEIGHT / 2 - ball.top
				ball.ySpeed = (-relativeIntersectY / (PADDLE_HEIGHT / 2)) * 6 + (-1 + Math.random() * 2)
				
			} else if (opponentPaddleRef.isBallColliding(opponentFound.side, ball.speed, ball.right, ball.top)) {
				ball.bounceInY()
				const relativeIntersectY = opponentPaddleRef.y + PADDLE_HEIGHT / 2 - ball.top
				balopponentPaddleRefl.ySpeed = (-relativeIntersectY / (PADDLE_HEIGHT / 2)) * 6 + (-1 + Math.random() * 2)

			} else if (ball.left > CANVAS_WIDTH || ball.right < 0) {
				givePoint(ball.left < 0)
				reset(3 * 1000)
				return
			} */

			draw()
			requestAnimationFrame(update)
		}

		const handleKeyDown = ({ key }: KeyboardEvent) => {
			if (key === 's' || key === 'w' || key === KEYDOWN || key === KEYUP) {
				playerPaddleRef.current.allowMove(key === 's' || key === KEYDOWN)
			}
		}

		const handleKeyUp = ({ key }: KeyboardEvent) => {
			if (key === 's' || key === 'w' || KEYDOWN === key || KEYUP === key) {
				playerPaddleRef.current.blockMove()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keyup', handleKeyUp)

		reset(5000)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
		}
	}, [canvasRef])

	return (
		<canvas
			className="mx-auto border"
			height={CANVAS_HEIGHT}
			ref={canvasRef}
			width={CANVAS_WIDTH}
		></canvas>
	)
}
