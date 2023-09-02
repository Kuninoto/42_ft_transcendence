import { themes } from '@/common/themes'
import { PlayerSide } from '@/common/types/backend'
import { hasValues } from '@/common/utils/hasValues'
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

const KEYDOWN: string = 'ArrowDown'
const KEYUP: string = 'ArrowUp'

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
		if (hasValues(user)) {
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
					playerPaddleRef.current.x - PADDLE_WIDTH / 2,
					playerPaddleRef.current.y - PADDLE_HEIGHT / 2,
					PADDLE_WIDTH,
					PADDLE_HEIGHT
				)
				context.drawImage(
					paddleImageRef.current,
					opponentPaddleRef.current.x - PADDLE_WIDTH / 2,
					opponentPaddleRef.current.y - PADDLE_HEIGHT / 2,
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

					context.fillStyle = themes[user.game_theme].ball
					context.drawImage(
						paddleImageRef.current,
						playerPaddleRef.current.x - PADDLE_WIDTH / 2,
						playerPaddleRef.current.y - PADDLE_HEIGHT / 2,
						PADDLE_WIDTH,
						PADDLE_HEIGHT
					)
					context.drawImage(
						paddleImageRef.current,
						opponentPaddleRef.current.x - PADDLE_WIDTH / 2,
						opponentPaddleRef.current.y - PADDLE_HEIGHT / 2,
						PADDLE_WIDTH,
						PADDLE_HEIGHT
					)

					context.beginPath()
					context.arc(ball.current.x, ball.current.y, BALL_SIZE, 0, Math.PI * 2)
					context.fill()
				}
			}

			const update = () => {
				if (isMovingDown) {
					playerPaddleRef.current.moveDown()
				} else if (isMovingUp) {
					playerPaddleRef.current.moveUp()
				}
				opponentPaddleRef.current.move()

				draw()
				requestAnimationFrame(update)
			}

			let isMovingDown = false
			let isMovingUp = false

			const handleKeyDown = ({ key }: KeyboardEvent) => {
				if (key === 's' || key === 'w' || key === KEYDOWN || key === KEYUP) {
					if (key === 's' || key === KEYDOWN) {
						isMovingDown = true
					} else {
						isMovingUp = true
					}

					playerPaddleRef.current.allowMove(isMovingDown)
				}
			}

			const handleKeyUp = ({ key }: KeyboardEvent) => {
				if (key === 's' || key === 'w' || KEYDOWN === key || KEYUP === key) {
					if (key === 's' || key === KEYDOWN) {
						isMovingDown = false
					} else {
						isMovingUp = false
					}
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
