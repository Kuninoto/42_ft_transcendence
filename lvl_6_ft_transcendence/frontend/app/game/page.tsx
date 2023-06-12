'use client'

import { ReactElement, useEffect, useRef, useState } from "react"

const KEYDOWN = "ArrowDown"
const KEYUP = "ArrowUp"


const PADDLE_MOVESPEED = 7
const PADDLE_HEIGHT = 72
const PADDLE_LEFT_OFFSET = 16
const PADDLE_WIDTH = 16

function Game(): ReactElement {
	const ballRef = useRef<HTMLInputElement>(null);
	const fieldRef = useRef<HTMLInputElement>(null);
	const paddleRef = useRef<HTMLInputElement>(null);

	useEffect(() => {

		let ballPosition = { x: 0, y: 0 }
		let velocity = { x: 3, y: 3 }
		let ballSpeed: number = 3
		let paddleMoveDirection = 0
		let paddleTopOffset = 1

		const borders = {
			top: 0,
			bottom: fieldRef.current.offsetHeight,
			left: 0,
			right: fieldRef.current.offsetWidth
		}

		const gameLoop = () => {

			ballPosition.x += velocity.x;
			ballPosition.y += velocity.y;

			checkBallCollisions()
			movePaddle()
		};

		const checkBallCollisions = () => {
			if (ballPosition.y >= borders.bottom || ballPosition.y <= borders.top)
				velocity.y *= -1;

			if (ballPosition.x < borders.left || ballPosition.x > borders.right)
				velocity.x *= -1;

			const isBallInPaddleY = ballPosition.y > paddleTopOffset && ballPosition.y < paddleTopOffset + PADDLE_HEIGHT
			const isBallInPaddleX = ballPosition.x > PADDLE_LEFT_OFFSET && ballPosition.x < PADDLE_LEFT_OFFSET + PADDLE_WIDTH
			if (isBallInPaddleY && isBallInPaddleX) {
				const collisionPoint = (ballPosition.y - paddleTopOffset) / PADDLE_HEIGHT;
				const angle = (collisionPoint - 0.5) * Math.PI;

				ballSpeed += 0.5

				velocity.x = Math.cos(angle) * ballSpeed
				velocity.y = Math.sin(angle) * ballSpeed
			}

			ballRef.current.style.left = `${ballPosition.x}px`;
			ballRef.current.style.top = `${ballPosition.y}px`;

		}

		const movePaddle = () => {
			paddleTopOffset += paddleMoveDirection

			if (paddleTopOffset < 0)
				paddleTopOffset = borders.bottom - PADDLE_HEIGHT

			if (paddleTopOffset + PADDLE_HEIGHT > borders.bottom)
				paddleTopOffset = 0

			////		if (paddleTopOffset <= 0 || paddleTopOffset + PADDLE_HEIGHT >= fieldRef.current.clientHeight )
			////			return;

			paddleRef.current.style.top = `${paddleTopOffset}px`;
		}

		const startMovement = ({ key }: KeyboardEvent) => {
			if (KEYDOWN === key || "s" === key) {
				paddleMoveDirection = PADDLE_MOVESPEED
			} else if (KEYUP === key || "w" === key) {
				paddleMoveDirection = -PADDLE_MOVESPEED
			}
		}

		const stopMovement = ({ key }: KeyboardEvent) => {
			if (KEYDOWN === key || "s" === key || KEYUP === key || "w" === key)
				paddleMoveDirection = 0;
		}


		document.addEventListener("keydown", startMovement)
		document.addEventListener("keyup", stopMovement)
		const interval = setInterval(gameLoop, 10)

		return () => clearInterval(interval)
	}, []);

	return (
		<div ref={fieldRef} className='relative border-2 border-x-white border-l-red-500 border-r-blue-500 w-[820px] aspect-video my-8 mx-auto' >
			<div ref={paddleRef} className={`absolute bg-white`} style={{ left: `${PADDLE_LEFT_OFFSET}px`, width: `${PADDLE_WIDTH}px`, height: `${PADDLE_HEIGHT}px` }}></div>
			<div ref={ballRef} className={`absolute h-3 w-3 bg-white rounded-full`}></div>
		</div >
	)
}

export default function game() {

	return (
		<div className="flex flex-col h-full">
			<Game />
		</div>
	)
}
