import { PlayerSide } from '@/common/types/backend/player-side.enum'

export const PADDLE_HEIGHT = 80
export const PADDLE_WALL_OFFSET = 16
export const PADDLE_WIDTH = 10
export const PADDLE_SPEED = 6

export const BALL_SIZE = 4

export const CANVAS_HEIGHT = 400
export const CANVAS_WIDTH = 800

enum Direction {
	STOP,
	UP,
	DOWN,
}

export class Paddle {
	#emitPaddleMovement: (newY: number) => void
	#moveDirection: Direction = Direction.STOP
	#position: { x: number; y: number }

	constructor(emitPaddleMovement: (newY: number) => void, offset: number) {
		this.#emitPaddleMovement = emitPaddleMovement
		this.#position = {
			x: offset,
			y: CANVAS_HEIGHT / 2,
		}
	}

	allowMove(moveDown: boolean) {
		if (moveDown) {
			this.#moveDirection = Direction.DOWN
		} else {
			this.#moveDirection = Direction.UP
		}
	}

	blockMove() {
		this.#moveDirection = Direction.STOP
	}

	move() {
		if (this.#moveDirection === Direction.STOP) return

		if (this.#moveDirection === Direction.UP && this.#position.y > 0) {
			this.#position.y -= PADDLE_SPEED
		} else if (
			this.#moveDirection === Direction.DOWN &&
			this.#position.y + PADDLE_HEIGHT < CANVAS_HEIGHT
		) {
			this.#position.y += PADDLE_SPEED
		}
		this.#emitPaddleMovement(this.#position.y)
	}

	moveDown() {
		if (this.#position.y + PADDLE_HEIGHT / 2 > CANVAS_HEIGHT) return

		this.#position.y += PADDLE_SPEED
		this.#emitPaddleMovement(this.#position.y)
	}

	moveUp() {
		if (this.#position.y - PADDLE_HEIGHT / 2 < 0) return

		this.#position.y += -PADDLE_SPEED
		this.#emitPaddleMovement(this.#position.y)
	}

	get x(): number {
		return this.#position.x
	}

	get y(): number {
		return this.#position.y
	}

	set y(position: number) {
		this.#position.y = position
	}
}

export class Ball {
	#position: { x: number; y: number } = {
		x: 0,
		y: 0,
	}

	move({ x, y }: { x: number; y: number }) {
		this.#position.x = x
		this.#position.y = y
	}

	get x(): number {
		return this.#position.x
	}

	get y(): number {
		return this.#position.y
	}
}
