import { PlayerSide } from "@/common/types/backend/player-side.enum"

export const PADDLE_HEIGHT = 80
export const PADDLE_WALL_OFFSET = 16
export const PADDLE_WIDTH = 10
export const PADDLE_SPEED = 6

export const CANVAS_HEIGHT = 400
export const CANVAS_WIDTH = 800

const SPEED_CAP = 18

export class Paddle {

	#fixedSpeed: number = 0
	#position: { x: number; y: number }

	#emitPaddleMovement: (newY: number) => void

	constructor(emitPaddleMovement: (newY: number) => void, offset: number) {
		this.#emitPaddleMovement = emitPaddleMovement
		this.#position = {
			x: offset,
			y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
		}
	}

	allowMove(moveDown: boolean) {
		if (moveDown) {
			this.#fixedSpeed = PADDLE_SPEED
		} else {
			this.#fixedSpeed = -PADDLE_SPEED
		}
	}

	blockMove() {
		this.#fixedSpeed = 0
	}

	isBallColliding(
		side: PlayerSide,
		ballSpeed: number,
		ballX: number,
		ballY: number
	): boolean {
		if (side === PlayerSide.LEFT && ballSpeed < 0) {
			return (
				ballX + ballSpeed <= this.#position.x + PADDLE_WIDTH &&
				ballY <= this.#position.y + PADDLE_HEIGHT &&
				ballY >= this.#position.y
			)
		}
		if (side === PlayerSide.RIGHT && ballSpeed > 0) {
			return (
				ballX + ballSpeed >= this.#position.x &&
				ballY <= this.#position.y + PADDLE_HEIGHT &&
				ballY >= this.#position.y
			)
		}
		return false
	}

	move() {
		if (this.#fixedSpeed === 0) return

		const nextPosition = this.#position.y + this.#fixedSpeed
		if (nextPosition < 0) {
			this.#position.y = 0
		} else if (nextPosition + PADDLE_HEIGHT > CANVAS_HEIGHT) {
			this.#position.y = CANVAS_HEIGHT - PADDLE_HEIGHT
		} else {
			this.#position.y += this.#fixedSpeed
		}
		this.#emitPaddleMovement(this.#position.y)
	}

	reset() {
		this.#position.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
		this.#fixedSpeed = 0
	}

	set y(position: number) {
		this.#position.y = position
	}

	get x(): number {
		return this.#position.x
	}

	get y(): number {
		return this.#position.y
	}
}

export class Ball {
	#position: { x: number; y: number } = {
		x: 0,
		y: 0,
	}
	#size: number = 4
	#speed: { x: number; y: number } = {
		x: 0,
		y: 0,
	}

	get bottom(): number {
		return this.#position.y + this.#size
	}

	bounceInX() {
		this.#speed.y *= -1
	}

	bounceInY() {
		if (Math.abs(this.#speed.x) >= SPEED_CAP) {
			this.#speed.x *= -1
		} else {
			this.#speed.x *= -1.1
		}
	}

	get left(): number {
		return this.#position.x
	}

	move() {
		this.#position.x += this.#speed.x
		this.#position.y += this.#speed.y
	}

	reset() {
		this.#position = {
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
		}
		this.#speed = {
			x: 0,
			y: 0,
		}
		this.#speed.x = Math.round(Math.random()) % 2 === 0 ? -4 : 4
	}

	get right(): number {
		return this.#position.x + this.#size
	}

	get size(): number {
		return this.#size
	}

	get speed(): number {
		return this.#speed.x
	}

	get top(): number {
		return this.#position.y
	}

	set ySpeed(speed: number) {
		this.#speed.y = speed
	}
}
