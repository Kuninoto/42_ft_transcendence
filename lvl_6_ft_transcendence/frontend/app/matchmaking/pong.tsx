import { useEffect, useRef } from 'react'

import io from "socket.io-client";
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

const KEYDOWN = 'ArrowDown'
const KEYUP = 'ArrowUp'

type props = {
	givePoint: (rightPlayer: boolean) => void
}

export default function Pong({ givePoint }: props) {

	const { opponentFound, emitPaddleMovement } = useGame()

	const canvasRef = useRef<HTMLCanvasElement>(null)

	const playerPaddle = new Paddle(
		opponentFound.side === PlayerSide.LEFT 
			? PADDLE_WALL_OFFSET
			: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET)
	const opponentPaddle = new Paddle(
		opponentFound.side === PlayerSide.RIGHT 
			? PADDLE_WALL_OFFSET
			: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET)
	
	const ball = new Ball()

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas && canvas.getContext('2d')

		const draw = () => {
			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height)

				context.fillStyle = '#FFF'
				context.fillRect(
					playerPaddle.x,
					playerPaddle.y,
					PADDLE_WIDTH,
					PADDLE_HEIGHT
				)
				context.fillRect(
					opponentPaddle.x,
					opponentPaddle.y,
					PADDLE_WIDTH,
					PADDLE_HEIGHT
				)

				context.beginPath()
				context.arc(ball.left, ball.top, ball.size, 0, Math.PI * 2)
				context.fill()
			}
		}

		const reset = async (delayTime: number) => {
			playerPaddle.reset()
			opponentPaddle.reset()
			ball.reset()

			draw()
			await delay(delayTime)
			update()
		}

		function update() {
			playerPaddle.move()
//			emitPaddleMovement(playerPaddle.y)

			// ball.move()

			/* const colideWithHorizontalWall =
				ball.bottom > CANVAS_HEIGHT || ball.top < 0
			if (colideWithHorizontalWall) {
				ball.bounceInX()
			}

			if (playerPaddle.isBallColliding(opponentFound.side, ball.speed, ball.left, ball.top)) {
				ball.bounceInY()
				const relativeIntersectY = playerPaddle.y + PADDLE_HEIGHT / 2 - ball.top
				ball.ySpeed = (-relativeIntersectY / (PADDLE_HEIGHT / 2)) * 6 + (-1 + Math.random() * 2)
				
			} else if (opponentPaddle.isBallColliding(opponentFound.side, ball.speed, ball.right, ball.top)) {
				ball.bounceInY()
				const relativeIntersectY = opponentPaddle.y + PADDLE_HEIGHT / 2 - ball.top
				balopponentPaddlel.ySpeed = (-relativeIntersectY / (PADDLE_HEIGHT / 2)) * 6 + (-1 + Math.random() * 2)

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
				playerPaddle.allowMove(key === 's' || key === KEYDOWN)
			}
		}

		const handleKeyUp = ({ key }: KeyboardEvent) => {
			if (key === 's' || key === 'w' || KEYDOWN === key || KEYUP === key) {
				playerPaddle.blockMove()
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
