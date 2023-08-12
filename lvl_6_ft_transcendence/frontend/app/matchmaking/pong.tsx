import { themes } from '@/common/themes'
import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import { useEffect, useRef } from 'react'

import {
	Ball,
	BALL_SIZE,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	Paddle,
	PADDLE_HEIGHT,
	PADDLE_WALL_OFFSET,
	PADDLE_WIDTH,
} from './definitions'

const KEYDOWN = 'ArrowDown'
const KEYUP = 'ArrowUp'

export default function Pong() {
	const {
		ballPosition,
		emitOnReady,
		emitPaddleMovement,
		opponentFound,
		opponentPosition,
	} = useGame()
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
	)

	const opponentPaddleRef = useRef<Paddle>(
		new Paddle(
			emitPaddleMovement,
			opponentFound.side === PlayerSide.RIGHT
				? PADDLE_WALL_OFFSET
				: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
		)
	)

	const ball = useRef<Ball>(new Ball())

	useEffect(() => {
		opponentPaddleRef.current.y = opponentPosition
	}, [opponentPosition])

	useEffect(() => {
		ball.current.move(ballPosition)
	}, [ballPosition])

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas && canvas.getContext('2d')

		const backgroundImage = new Image()
		const paddleImage = new Image()

		backgroundImage.src = `/game/backgrounds/${themes[user.game_theme]
			?.background}`
		paddleImage.src = `/game/paddles/${themes[user.game_theme]?.paddle}`

		backgroundImageRef.current = backgroundImage
		paddleImageRef.current = paddleImage

		backgroundImage.onload = () => {
			context.drawImage(
				backgroundImageRef.current,
				0,
				0,
				CANVAS_WIDTH,
				CANVAS_HEIGHT
			)
		}

		paddleImage.onload = () => {
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
		}

		emitOnReady()

		const draw = () => {
			if (context) {
				context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

				context.drawImage(
					backgroundImageRef.current,
					0,
					0,
					CANVAS_WIDTH,
					CANVAS_HEIGHT
				)

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
				context.arc(ball.current.x, ball.current.y, BALL_SIZE, 0, Math.PI * 2)
				context.fill()
			}
		}

		const update = () => {
			playerPaddleRef.current.move()
			opponentPaddleRef.current.move()

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

		update()
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
			context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
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
