'use client'

import { useEffect, useRef } from 'react'
import { Press_Start_2P } from 'next/font/google'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })

const KEYDOWN = 'ArrowDown'
const KEYUP = 'ArrowUp'

const PADDLE_OFFSET = 16
const PADDLE_HEIGHT = 80
const PADDLE_WIDTH = 10
const PADDLE_SPEED = 6

export default function Pong({ givePoint }: { givePoint: (rightPlayer: boolean) => void }) {

	// const [pow] = useSound("./sounds/pow.wav")
	const canvasRef = useRef<HTMLCanvasElement>(null)

	let leftPaddleY = canvasRef.current ? canvasRef.current.height / 2 - PADDLE_HEIGHT / 2 : 0
	let rightPaddleY = canvasRef.current ? canvasRef.current.height / 2 - PADDLE_HEIGHT / 2 : 0

	const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

	const ballSize = 4
	let ballX = 0
	let ballY = 0
	let ballSpeed = {
		x: 0,
		y: 0
	}
	let paddleMoveDirection = 0

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas && canvas.getContext('2d')

		const draw = () => {
			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height)

				context.fillStyle = '#FFF'
				context.fillRect(canvas.width - PADDLE_WIDTH - PADDLE_OFFSET, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT)
				context.fillRect(0 + PADDLE_OFFSET, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT)

				context.beginPath()
				context.arc(ballX, ballY, ballSize, 0, Math.PI * 2)
				context.fill()
			}
		}

		const reset = async (delayTime: number) => {
			if (canvasRef.current) {
				leftPaddleY = canvasRef.current.height / 2 - PADDLE_HEIGHT / 2
				rightPaddleY = canvasRef.current.height / 2 - PADDLE_HEIGHT / 2
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
			movePaddle()

			ballX += ballSpeed.x
			ballY += ballSpeed.y

			if (canvas && ballY + ballSize > canvas.height || ballY - ballSize < 0) {
				ballSpeed.y *= -1

			}

			if (
				canvas &&
				ballX > canvas.width ||
				ballX < 0
			) {
				givePoint(ballX < 0)
				reset(3000)
				return
			} else if (
				canvas &&
				ballX + ballSize > canvas.width - PADDLE_WIDTH - PADDLE_OFFSET &&
				ballX + ballSize < canvas.width - PADDLE_OFFSET &&
				ballY + ballSize > rightPaddleY &&
				ballY - ballSize < rightPaddleY + PADDLE_HEIGHT ||
				ballX - ballSize < PADDLE_WIDTH + PADDLE_OFFSET &&
				ballY + ballSize > leftPaddleY &&
				ballY - ballSize < leftPaddleY + PADDLE_HEIGHT
			) {
				ballSpeed.x *= -1
				const relativeIntersectY = leftPaddleY + PADDLE_HEIGHT / 2 - ballY
				const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2)
				ballSpeed.y = -normalizedIntersectY * 4
			}
			draw()
			requestAnimationFrame(update)
		}

		const handleKeyDown = ({ key }: KeyboardEvent) => {
			if (KEYDOWN === key || 's' === key) {
				paddleMoveDirection = PADDLE_SPEED
			} else if (KEYUP === key || 'w' === key) {
				paddleMoveDirection = -PADDLE_SPEED
			}
		}

		const handleKeyUp = ({ key }: KeyboardEvent) => {
			if (KEYDOWN === key || 's' === key || KEYUP === key || 'w' === key)
				paddleMoveDirection = 0
		}

		const movePaddle = () => {
			if (canvas && (leftPaddleY + paddleMoveDirection < 0 || leftPaddleY + paddleMoveDirection + PADDLE_HEIGHT > canvas.height))
				return

			leftPaddleY += paddleMoveDirection
			rightPaddleY += paddleMoveDirection
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keyup', handleKeyUp)

		reset(1000)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
		}
	}, [canvasRef])

	return <canvas className='border mx-auto' ref={canvasRef} width={800} height={400}></canvas>
}

