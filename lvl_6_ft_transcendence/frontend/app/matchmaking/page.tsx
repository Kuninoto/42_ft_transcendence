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
	player: UserSearchInfo
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
	const { gameEndInfo, leftPlayerScore, opponentFound, rightPlayerScore } =
		useGame()
	const { user } = useAuth()

	if (!hasValues(gameEndInfo)) return

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<div className="absolute left-0 top-0 h-screen w-screen bg-black/70"></div>
			<div className="px-8 py-32 ">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative flex w-full flex-col place-content-center items-center space-y-4 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">
						<div className="mb-8 text-4xl">
							{gameEndInfo?.winner?.userId == user?.id ? 'Winner' : 'Loser'}
						</div>

						<div className="flex w-full">
							<div
								className={`mx-4 flex w-1/2 flex-col items-center space-y-2 ${
									opponentFound.side === PlayerSide.RIGHT && 'order-2'
								}`}
							>
								<Image
									alt={'user profile picture'}
									className="aspect-square w-20 rounded"
									height="0"
									loader={removeParams}
									sizes="100vw"
									src={user?.avatar_url || '/placeholder.gif'}
									width="0"
								/>
								<div>{user?.name}</div>
								<div>
									{opponentFound.side === PlayerSide.LEFT
										? leftPlayerScore
										: rightPlayerScore}
								</div>
							</div>
							<div className="h-full w-2 bg-white"></div>
							<div className="mx-4 flex w-1/2 flex-col items-center space-y-2">
								<Image
									src={
										opponentFound?.opponentInfo?.avatar_url ||
										'/placeholder.gif'
									}
									alt={'opponent profile picture'}
									className="aspect-square w-20 rounded"
									height="0"
									loader={removeParams}
									sizes="100vw"
									width="0"
								/>
								<div>{opponentFound?.opponentInfo?.name}</div>
								<div>
									{opponentFound.side === PlayerSide.RIGHT
										? leftPlayerScore
										: rightPlayerScore}
								</div>
							</div>
						</div>

						<Link
							className="w-full rounded border border-white py-3 text-center text-white mix-blend-lighten hover:bg-white hover:text-black"
							href="/dashboard"
						>
							Home
						</Link>
					</div>
				</div>
			</div>
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
