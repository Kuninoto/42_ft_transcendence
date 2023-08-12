'use client'

import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { UserSearchInfo } from '@/common/types/backend/user-search-info.interface'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import Image from 'next/image'

import Pong from './pong'

function LeftSide({ player }: { player: UserSearchInfo }) {
	const { leftPlayerScore } = useGame()

	return (
		<div className="my-4 flex gap-4">
			<div className="my-auto text-end">
				<h3 className="text-2xl">{player?.name}</h3>
				<h4 className="text-md">140 w</h4>
				{leftPlayerScore}
			</div>
			<Image
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				loader={removeParams}
				sizes="100vw"
				src={player?.avatar_url || '/placeholder.gif'}
				width="0"
			/>
		</div>
	)
}

function RightSide({ player }: { player: UserSearchInfo }) {
	const { rightPlayerScore } = useGame()

	return (
		<div className="my-4 flex gap-4">
			<Image
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				loader={removeParams}
				sizes="100vw"
				src={player?.avatar_url || '/placeholder.gif'}
				width="0"
			/>
			<div className="my-auto text-start">
				<h3 className="text-2xl">{player?.name}</h3>
				<h4 className="text-md">140 w</h4>
				{rightPlayerScore}
			</div>
		</div>
	)
}

function FinalModal() {
	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<div className="absolute left-0 top-0 h-screen w-screen bg-black/70"></div>
			<div className="px-8 py-32 ">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none"></div>
				</div>
			</div>
		</div>
	)
}

export default function Game() {
	const { user } = useAuth()
	const { opponentFound } = useGame()

	return (
		<div className="flex h-full flex-col">
			<FinalModal />
			<div className="mx-auto my-8 flex gap-x-8">
				<LeftSide
					player={
						opponentFound.side === PlayerSide.LEFT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
				/>
				<div className="h-full w-0.5 bg-white"></div>
				<RightSide
					player={
						opponentFound.side === PlayerSide.RIGHT
							? { avatar_url: user?.avatar_url, id: user?.id, name: user?.name }
							: opponentFound.opponentInfo
					}
				/>
			</div>

			<Pong />
		</div>
	)
}
