'use client'

import { hasValues } from '@/common/utils/hasValues'
import { useAuth } from '@/contexts/AuthContext'
import { GameProvider, useGame } from '@/contexts/GameContext'
import Link from 'next/link'
import { ReactNode } from 'react'

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

export default function Layout({ children }: { children: ReactNode }) {
	return <GameProvider>{children}</GameProvider>
}
