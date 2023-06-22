import { useEffect, useRef } from 'react'
import { Press_Start_2P } from 'next/font/google'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })

const KEYDOWN = 'ArrowDown'
const KEYUP = 'ArrowUp'

const PADDLE_HEIGHT = 80
const PADDLE_WALL_OFFSET = 16
const PADDLE_WIDTH = 10
const PADDLE_SPEED = 6

const CANVAS_HEIGHT = 400
const CANVAS_WIDTH = 800


class Paddle {

	position: { x: number, y: number }
	fixedSpeed: number = 0

	constructor(offset: number) {
		this.position = {
			x: offset,
			y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
		}
	}

	get y(): number {
		return this.position.y
	}

	get x(): number {
		return this.position.x
	}

	reset() {
		this.position.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
		this.fixedSpeed = 0
	}

	move() {
		if (this.fixedSpeed === 0) return

		const nextPosition = this.position.y + this.fixedSpeed
		if ((nextPosition > 0 && nextPosition + PADDLE_HEIGHT < CANVAS_HEIGHT)) {
			this.position.y += this.fixedSpeed
		}
	}

	allowMove(moveDown: boolean) {
		if (moveDown) {
			this.fixedSpeed = PADDLE_SPEED
		} else {
			this.fixedSpeed = -PADDLE_SPEED
		}
	}

	blockMove() { this.fixedSpeed = 0 }

	isBallColliding(ballX: number, ballY: number): boolean {
		return ballX >= this.position.x && ballX <= this.position.x + PADDLE_WIDTH && ballY <= this.position.y + PADDLE_HEIGHT && ballY >= this.position.y
	}

}

export default function Pong({ givePoint }: { givePoint: (rightPlayer: boolean) => void }) {

	// const [pow] = useSound("./sounds/pow.wav")
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const leftPaddle = new Paddle(PADDLE_WALL_OFFSET)
	const rightPaddle = new Paddle(CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET)

	const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

	const ballSize = 4
	let ballX = 0
	let ballY = 0
	let ballSpeed = {
		x: 0,
		y: 0
	}

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas && canvas.getContext('2d')

		const draw = () => {
			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height)

				context.fillStyle = '#FFF'
				context.fillRect(rightPaddle.x, rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
				context.fillRect(leftPaddle.x, leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)

				context.beginPath()
				context.arc(ballX, ballY, ballSize, 0, Math.PI * 2)
				context.fill()
			}
		}

		const reset = async (delayTime: number) => {
			if (canvasRef.current) {
				leftPaddle.reset()
				rightPaddle.reset()
				ballX = canvasRef.current.width / 2
				ballY = canvasRef.current.height / 2
				ballSpeed = {
					x: Math.round(Math.random()) % 2 === 0 ? -4 : 4,
					y: 0
				}
			}

			draw()
			await delay(delayTime)
			update()
		}

		function update() {
			leftPaddle.move()
			rightPaddle.move()

			ballX += ballSpeed.x
			ballY += ballSpeed.y

			const colideWithHorizontalWall = canvas && ballY + ballSize > canvas.height || ballY - ballSize < 0
			if (colideWithHorizontalWall) {
				ballSpeed.y *= -1
			}

			const passVerticalWall = canvas && ballX > canvas.width || ballX < 0
			if (passVerticalWall) {
				givePoint(ballX < 0)
				reset(3000)
				return
			}

			if (leftPaddle.isBallColliding(ballX + ballSize, ballY + ballSize) || rightPaddle.isBallColliding(ballX + ballSize, ballY + ballSize)) {
				ballSpeed.x *= -1.1
				ballSpeed.y *= 1.1

				let relativeIntersectY: number

				if (ballX < CANVAS_WIDTH / 2) {
					relativeIntersectY = leftPaddle.y + PADDLE_HEIGHT / 2 - ballY
				} else {
					relativeIntersectY = rightPaddle.y + PADDLE_HEIGHT / 2 - ballY
				}
			}

			draw()
			requestAnimationFrame(update)
		}

		const handleKeyDown = ({ key }: KeyboardEvent) => {
			if (key === 's' || key === 'w') {
				leftPaddle.allowMove(key === 's')
			}

			if (key === KEYDOWN || key === KEYUP) {
				rightPaddle.allowMove(key === KEYDOWN)
			}
		}

		const handleKeyUp = ({ key }: KeyboardEvent) => {
			if ('s' === key || 'w' === key) {
				leftPaddle.blockMove()
			}

			if (KEYDOWN === key || KEYUP === key) {
				rightPaddle.blockMove()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keyup', handleKeyUp)

		reset(1000)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
		}
	}, [canvasRef])

	return <canvas className='border mx-auto' ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
}

