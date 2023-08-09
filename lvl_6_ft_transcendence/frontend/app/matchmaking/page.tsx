'use client'

import moment from 'moment'
import Image from 'next/image'
import io from "socket.io-client";
import { useState } from 'react'
import { useTimer } from 'react-timer-hook'

import Pong from './pong'
import { UserSearchInfo } from '@/common/types/backend/user-search-info.interface'
import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext';

function LeftSide({ player } : {player: UserSearchInfo}) {

	const { leftPlayerScore } = useGame()

	return(
		<div className="my-4 flex gap-4">
			<div className="my-auto text-end">
				<h3 className="text-2xl">{ player?.name }</h3>
				<h4 className="text-md">140 w</h4>
				{leftPlayerScore}
			</div>
			<Image
				loader={removeParams}
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				sizes="100vw"
				src={player?.avatar_url || '/placeholder.jpg'}
				width="0"
			/>
		</div>
	)
}

function RightSide({player } : {player: UserSearchInfo}) {

	const { rightPlayerScore } = useGame()

	return(
		<div className="my-4 flex gap-4">
			<Image
				loader={removeParams}
				alt={'player 1 profile picture'}
				className="aspect-square w-20 rounded-full"
				height="0"
				sizes="100vw"
				src={player?.avatar_url || '/placeholder.jpg'}
				width="0"
			/>
			<div className="my-auto text-start">
				<h3 className="text-2xl">{ player?.name }</h3>
				<h4 className="text-md">140 w</h4>
				{rightPlayerScore}
			</div>
		</div>
	)
}

export default function Game() {
	const { user } = useAuth()
	const { opponentFound } = useGame()

	return (
		<div className="flex h-full flex-col">
			<div className="mx-auto my-8 flex gap-x-8">
				<LeftSide 
					player={
						opponentFound.side === PlayerSide.LEFT
						?  { avatar_url: user?.avatar_url,
							id: user?.id,
							name: user?.name }
						: opponentFound.opponentInfo
						} />
				<div className="h-full w-0.5 bg-white"></div>
				<RightSide 
					player={
						opponentFound.side === PlayerSide.RIGHT 
						?  { avatar_url: user?.avatar_url,
							id: user?.id,
							name: user?.name }
						: opponentFound.opponentInfo
						} />
			</div>

			<Pong />
		</div>
	)
}