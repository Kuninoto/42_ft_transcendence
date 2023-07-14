export const PADDLE_HEIGHT = 80
export const PADDLE_WALL_OFFSET = 16
export const PADDLE_WIDTH = 10
export const PADDLE_SPEED = 6

export const CANVAS_HEIGHT = 400
export const CANVAS_WIDTH = 800

const SPEED_CAP = 18

export class Paddle {
	#position: { x: number; y: number }
	#fixedSpeed: number = 0

	constructor(offset: number) {
		this.#position = {
			x: offset,
			y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
		}
	}

	get y(): number {
		return this.#position.y
	}

	get x(): number {
		return this.#position.x
	}

	reset() {
		this.#position.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
		this.#fixedSpeed = 0
	}

	move() {
		if (this.#fixedSpeed === 0) return

		const nextPosition = this.#position.y + this.#fixedSpeed
		if (nextPosition > 0 && nextPosition + PADDLE_HEIGHT < CANVAS_HEIGHT) {
			this.#position.y += this.#fixedSpeed
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

	isBallColliding(left: boolean, ballSpeed: number, ballX: number, ballY: number): boolean {
		if (left && ballSpeed < 0) {
			return (
				ballX + ballSpeed <= this.#position.x + PADDLE_WIDTH &&
				ballY <= this.#position.y + PADDLE_HEIGHT &&
				ballY >= this.#position.y
			)
		}
		if (!left && ballSpeed > 0) {
			return (
				ballX + ballSpeed >= this.#position.x &&
				ballY <= this.#position.y + PADDLE_HEIGHT &&
				ballY >= this.#position.y
			)
		}
		return false
	}
}

export class Ball {
	#size: number = 4
	#speed: { x: number; y: number } = {
		x: 0,
		y: 0,
	}
	#position: { x: number; y: number } = {
		x: 0,
		y: 0,
	}

	constructor() { }

	set ySpeed(speed: number) {
		this.#speed.y = speed
	}

	get left(): number {
		return this.#position.x
	}

	get top(): number {
		return this.#position.y
	}

	get right(): number {
		return this.#position.x + this.#size
	}

	get bottom(): number {
		return this.#position.y + this.#size
	}

	get size(): number {
		return this.#size
	}

	get speed(): number {
		return this.#speed.x
	}

	bounceInX() {
		this.#speed.y *= -1
	}

	bounceInY() {
		console.log(this.#speed.x)
		if (Math.abs(this.#speed.x) >= SPEED_CAP) {
			this.#speed.x *= -1
		} else {
			this.#speed.x *= -1.1
		}
	}

	reset() {
		this.#position = {
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
		}
		this.#speed = {
			x: 0,
			y: 0
		}
		this.#speed.x = Math.round(Math.random()) % 2 === 0 ? -4 : 4
	}

	move() {
		this.#position.x += this.#speed.x
		this.#position.y += this.#speed.y
	}
}
