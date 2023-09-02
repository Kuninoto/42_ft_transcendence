'use client'

import { PlayerSide, UserSearchInfo } from '@/common/types'
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

function FinalModal() {
	const { gameEndInfo } = useGame()
	const { user } = useAuth()

	if (!hasValues(gameEndInfo)) return

	return (
		<div className="absolute flex h-full w-full flex-col place-content-center items-center space-y-12 bg-black/50">
			<h1 className="text-6xl">
				{gameEndInfo?.winner?.userId == user?.id ? (
					<div>
						You <span className="animate-blink">win!</span>
					</div>
				) : (
					<div>
						Game <span className="animate-blink"> over</span>!
					</div>
				)}
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
		const handleNavigation = () => {
			// This function will be called when the user navigates.
			console.log('User navigated back. Calling your function.')
			// Call your function logic here
		}

		// Listen for the 'popstate' event which is triggered when the user goes back
		window.addEventListener('popstate', handleNavigation)

		// Clean up the event listener when the component is unmounted
		return () => {
			window.removeEventListener('popstate', handleNavigation)
		}
	}, [])

	useEffect(() => {
		const handleBeforeUnload = (e) => {
			e.preventDefault()
			e.returnValue = '' // This is needed for some browsers to show a confirmation message
			// Your function to trigger goes here
			if (window.confirm('You sure, you want to forfeit?')) {
				// Perform any cleanup or actions here if needed
			}
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
