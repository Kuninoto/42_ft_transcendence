'use client'

import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { UserSearchInfo } from '@/common/types/backend/user-search-info.interface'
import { hasValues } from '@/common/utils/hasValues'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import Image from 'next/image'
import Link from 'next/link'
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
				<h3 className="text-2xl">{player?.name}</h3>
				<h4 className="text-md">140 w</h4>
				{score}
			</div>
			<Image
				alt={'one of the players profile picture'}
				className="aspect-square w-20 rounded"
				height="0"
				loader={removeParams}
				sizes="100vw"
				src={player?.avatar_url || '/placeholder.gif'}
				width="0"
			/>
		</div>
	)
}

function FinalModal() {
	const { gameEndInfo } = useGame()
	const { user } = useAuth()

	if (!hasValues(gameEndInfo)) return

	return (
		<div className="absolute flex h-full w-full flex-col place-content-center items-center space-y-12 bg-black/50">
			<h1 className="text-8xl">
				{gameEndInfo?.winner?.userId == user?.id ? 'You win!' : 'You lose!'}
			</h1>
			<Link
				className="rounded border border-white px-16 py-3 text-center text-white mix-blend-lighten hover:bg-white hover:text-black"
				href="/dashboard"
			>
				Home
			</Link>
		</div>
	)
}

export default function Game() {
	const { user } = useAuth()
	const { leftPlayerScore, opponentFound, rightPlayerScore } = useGame()

	useEffect(() => {
		const handleBeforeUnload = (event) => {
			event.preventDefault()
			event.returnValue = 'monkey'
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [])

	return (
		<div className="flex h-full flex-col">
			<FinalModal />
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
