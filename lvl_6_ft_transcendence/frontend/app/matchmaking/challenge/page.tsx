'use client'

import { hasValues } from '@/common/utils/hasValues'
import { useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import { useGame } from '@/contexts/GameContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Loading() {
	const router = useRouter()

	const { canCancel, cancel, opponentFound } = useGame()
	const { user } = useAuth()
	const { challengeInfo, getChallengeData } = useFriends()

	useEffect(() => {
		if (hasValues(opponentFound)) router.push('/matchmaking')
		else if (!hasValues(challengeInfo)) router.push('/dashboard')
		else getChallengeData()
	}, [])

	return (
		<div className="flex h-full">
			<div className="m-auto flex flex-col place-content-center items-center space-y-10 text-4xl">
				<div className="flex items-end space-x-4 text-center text-3xl">
					<div>{user?.name || 'NOT FOUND'}</div>
					<div className="text-xl">vs.</div>
					<div>
						{opponentFound?.opponentInfo?.name || (
							<span className="animate-blink">
								{challengeInfo.opponentName || '????'}
							</span>
						)}
					</div>
				</div>
				<div className="relative h-72 w-96 overflow-hidden rounded">
					<Image
						alt={'cats playing pong (loading screen)'}
						className="object-cover"
						fill
						sizes="100%"
						src={'/catpong.gif'}
					/>
				</div>
				<div>WAITING RESPONSE</div>
				{canCancel && challengeInfo.invite && (
					<button
						className="rounded border border-white px-4 py-2 hover:bg-white hover:text-[#170317]"
						onClick={cancel}
					>
						Cancel
					</button>
				)}
			</div>
		</div>
	)
}
