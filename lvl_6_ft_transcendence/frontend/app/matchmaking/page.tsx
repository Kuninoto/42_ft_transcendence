'use client'

import { PlayerSide, UserSearchInfo } from '@/common/types'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import Image from 'next/image'
import { useEffect } from 'react'

import Pong from './pong'

type card = {
	player: { avatar_url: string; id: number; name: string } | UserSearchInfo
	score: number
	side: PlayerSide
}

function HorizontalCard({ player, score, side }: card) {
	const textOrientation =
		side === PlayerSide.LEFT ? 'text-end' : 'text-start order-2'

	return (
		<div className="my-4 flex gap-4">
			<div className={`my-auto ${textOrientation}`}>
				<h3 className="text-2xl">{player?.name || 'NOT FOUND'}</h3>
				{score}
			</div>
			<div className="relative aspect-square w-20 overflow-hidden rounded">
				<Image
					alt={'one of the players profile picture'}
					className="object-cover"
					fill
					loader={removeParams}
					src={player?.avatar_url || '/placeholder.gif'}
				/>
			</div>
		</div>
	)
}

export default function Game() {
	const { user } = useAuth()
	const { leftPlayerScore, opponentFound, rightPlayerScore } = useGame()

	return (
		<div className="flex h-full flex-col">
			<div className="mx-auto my-8 flex gap-x-8">
				<HorizontalCard
					player={
						opponentFound.side === PlayerSide.LEFT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
					score={leftPlayerScore}
					side={PlayerSide.LEFT}
				/>
				<div className="h-full w-0.5 bg-white"></div>
				<HorizontalCard
					player={
						opponentFound.side === PlayerSide.RIGHT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
					score={rightPlayerScore}
					side={PlayerSide.RIGHT}
				/>
			</div>

			<Pong />
		</div>
	)
}
