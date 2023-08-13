'use client'

import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { UserSearchInfo } from '@/common/types/backend/user-search-info.interface'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import Pong from './pong'
import { hasValues } from '@/common/utils/hasValues'

type card = {
	side: PlayerSide
	player: UserSearchInfo
	score: number	
}

function HorizontalCard({side, player, score} : card) {

	const textOrientation = side === PlayerSide.LEFT ? "text-end" : "text-start order-2"
	
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

	const { opponentFound, gameEndInfo, leftPlayerScore, rightPlayerScore } = useGame()
	const { user } = useAuth()

	if (!hasValues(gameEndInfo)) return

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<div className="absolute left-0 top-0 h-screen w-screen bg-black/70"></div>
			<div className="px-8 py-32 ">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative space-y-4 flex flex-col w-full place-content-center block items-center rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">

						<div className="text-4xl mb-8">
							{ gameEndInfo?.winner?.userId == user?.id
								? "Winner"
								: "Loser" 
							}
						</div>

						<div className="flex w-full">
							<div className={`mx-4 space-y-2 flex flex-col items-center w-1/2 ${opponentFound.side === PlayerSide.RIGHT && "order-2" }`}>
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
								<div>{opponentFound.side === PlayerSide.LEFT ? leftPlayerScore : rightPlayerScore }</div>
							</div>
							<div className="bg-white h-full w-2"></div>
							<div className="mx-4 space-y-2 flex flex-col items-center w-1/2">
								<Image
									alt={'opponent profile picture'}
									className="aspect-square w-20 rounded"
									height="0"
									loader={removeParams}
									sizes="100vw"
									src={opponentFound?.opponentInfo?.avatar_url || '/placeholder.gif'}
									width="0"
								/>
								<div>{opponentFound?.opponentInfo?.name}</div>
								<div>{opponentFound.side === PlayerSide.RIGHT ? leftPlayerScore : rightPlayerScore }</div>
							</div>
						</div>

						<Link href="/dashboard" className="rounded border border-white text-center w-full py-3 text-white mix-blend-lighten hover:bg-white hover:text-black">Home</Link>

					</div>
				</div>
			</div>
		</div>
	)
}

export default function Game() {
	const { user } = useAuth()
	const { opponentFound, leftPlayerScore, rightPlayerScore } = useGame()

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
					side={PlayerSide.LEFT}
					player={
						opponentFound.side === PlayerSide.LEFT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
					score={leftPlayerScore}
				/>
				<div className="h-full w-0.5 bg-white"></div>
				<HorizontalCard
					side={PlayerSide.RIGHT}
					player={
						opponentFound.side === PlayerSide.RIGHT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
					score={rightPlayerScore}
				/>
			</div>

			<Pong />
		</div>
	)
}
