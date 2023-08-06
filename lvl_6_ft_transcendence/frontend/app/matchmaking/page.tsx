'use client'

import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { UserSearchInfo } from '@/common/types/backend/user-search-info.interface'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import moment from 'moment'
import Image from 'next/image'
import { useState } from 'react'
import { useTimer } from 'react-timer-hook'

import Pong from './pong'

function LeftSide({
	player,
	playerScore,
}: {
	player: UserSearchInfo
	playerScore: number
}) {
	return (
		<div className="my-4 flex gap-4">
			<div className="my-auto text-end">
				<h3 className="text-2xl">{player.name}</h3>
				<h4 className="text-md">140 w</h4>
				{playerScore}
			</div>
			<Image
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				loader={removeParams}
				sizes="100vw"
				src={player.avatar_url || '/placeholder.jpg'}
				width="0"
			/>
		</div>
	)
}

function RightSide({
	player,
	playerScore,
}: {
	player: UserSearchInfo
	playerScore: number
}) {
	return (
		<div className="my-4 flex gap-4">
			<Image
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				loader={removeParams}
				sizes="100vw"
				src={player.avatar_url || '/placeholder.jpg'}
				width="0"
			/>
			<div className="my-auto text-start">
				<h3 className="text-2xl">{player.name}</h3>
				<h4 className="text-md">140 w</h4>
				{playerScore}
			</div>
		</div>
	)
}

export default function Game() {
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)
	const [rightPlayerScore, setRightPlayerScore] = useState(0)

	const { user } = useAuth()
	const { opponentFound } = useGame()

	const { minutes, restart, seconds } = useTimer({
		expiryTimestamp: moment().add(5, 'm').add(5, 's').toDate(),
		onExpire: () => console.warn('onExpire called'),
	})

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
				<LeftSide
					player={
						opponentFound.side === PlayerSide.LEFT
							? {
									avatar_url: user.avatar_url,
									id: user.id,
									name: user.name,
							  }
							: opponentFound.opponentInfo
					}
					playerScore={leftPlayerScore}
				/>
				<div className="h-full w-0.5 bg-white"></div>
				<RightSide
					player={
						opponentFound.side === PlayerSide.RIGHT
							? {
									avatar_url: user.avatar_url,
									id: user.id,
									name: user.name,
							  }
							: opponentFound.opponentInfo
					}
					playerScore={rightPlayerScore}
				/>
			</div>

			<div className="mx-auto">
				<span>{minutes}</span>:
				<span>
					{seconds < 10 ? '0' : ''}
					{seconds}
				</span>
			</div>

			<Pong givePoint={givePoint} />
		</div>
	)
}

