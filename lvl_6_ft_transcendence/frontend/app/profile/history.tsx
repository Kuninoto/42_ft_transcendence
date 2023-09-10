import {
	GameResultInterface,
	GameType,
	UserProfile as IUserProfile,
} from '@/common/types'
import { hasValues } from '@/common/utils/hasValues'
import { IoPodiumOutline } from 'react-icons/io5'
import { LiaUserFriendsSolid } from 'react-icons/lia'
import { removeParams } from '@/contexts/AuthContext'
import Tippy from '@tippyjs/react'
import Image from 'next/image'
import Link from 'next/link'

export default function History({
	history,
	userProfile,
}: {
	history: GameResultInterface[]
	userProfile: IUserProfile
}) {
	return (
		<div className="w-full space-y-2">
			{!hasValues(history) ? (
				<div className="w-full py-8 text-center text-2xl">Go play outside</div>
			) : (
				history?.map((match, index) => {
					const userWon = match.winner.userId === userProfile.id

					const opponent = userWon ? match.loser : match.winner
					const isLadder = match.gameType === GameType.LADDER

					const score = userWon ? (
						<>
							{match.winner.score}{' '}
							{match.loser.score}
						</>
					) : (
						<>
							{match.winner.score}{' '}
							{match.loser.score}
						</>
					)

					return (
						<div
							className={`flex w-full place-content-between items-center rounded-sm bg-gradient-to-r 
							${userWon ? "from-gray-400/40" : "from-primary-fushia/40"} px-4 py-3 text-xl`}
							key={index}
						>
							<Link
								className="flex items-center space-x-4 hover:underline"
								href={`/profile?id=${opponent.userId}`}
							>
								<Tippy className="text-xs" content={
									<div className="p-2 border border-white rounded bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80%">
										{isLadder ? "Ladder" : "Friendly"}
									</div>
								}>
									<button>
										{isLadder ? <IoPodiumOutline/> : <LiaUserFriendsSolid/>}
									</button>
								</Tippy>
								<div className="relative aspect-square w-12 overflow-hidden rounded">
									<Image
										alt={'player profile picture'}
										className="object-cover"
										fill
										loader={removeParams}
										sizes="100vw"
										src={opponent.avatar_url}
									/>
								</div>
								<span className="text-start">{opponent.name}</span>
							</Link>
							<p className="text-2xl">{score}</p>
							<p className="text-2xl">{userWon ? "Victory" : "Defeat"  }</p>
						</div>
					)
				})
			)}
		</div>
	)
}
