'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTimer } from 'react-timer-hook'

import Pong from './pong'

function Timer() {
	const time: Date = new Date()
	time.setSeconds(time.getSeconds() + 5 * 60 + 5)

	const { minutes, seconds } = useTimer({
		onExpire: () => console.warn('onExpire called'),
		time,
	})

	return (
		<div style={{ textAlign: 'center' }}>
			<span>{minutes}</span>:
			<span>
				{seconds < 10 ? '0' : ''}
				{seconds}
			</span>
		</div>
	)
}

export default function Game() {
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)
	const [rightPlayerScore, setRightPlayerScore] = useState(0)

	const givePoint = (rigthPlayer: boolean): void => {
		if (rigthPlayer) {
			setRightPlayerScore((rightPlayerScore: number) => rightPlayerScore + 1)
		} else {
			setLeftPlayerScore((leftPlayerScore: number) => leftPlayerScore + 1)
		}
	}

	return (
		<div className="flex h-full flex-col">
			<div className="mx-auto my-8 flex gap-x-8">
				<div className="my-4 flex gap-4">
					<div className="my-auto text-end">
						<h3 className="text-2xl">Macaco</h3>
						<h4 className="text-md">140 w</h4>
						{leftPlayerScore}
					</div>
					<Image
						alt={'player 1 profile picutre'}
						className="aspect-square w-20 rounded-full"
						height="0"
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width="0"
					/>
				</div>
				<div className="h-full w-0.5 bg-white"></div>
				<div className="my-4 flex gap-4">
					<Image
						alt={'player 1 profile picutre'}
						className="aspect-square w-20 rounded-full"
						height="0"
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width="0"
					/>
					<div className="my-auto">
						<h3 className="text-2xl">Macaco</h3>
						<h4 className="text-md">140 w</h4>
						{rightPlayerScore}
					</div>
				</div>
			</div>

			<div className="mx-auto">
				<Timer />
			</div>

			<Pong givePoint={givePoint} />
		</div>
	)
}
