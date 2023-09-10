import {
	GameResultInterface,
	GameType,
	UserProfile as IUserProfile,
} from '@/common/types'
import { hasValues } from '@/common/utils/hasValues'
import { removeParams } from '@/contexts/AuthContext'
import Tippy from '@tippyjs/react'
import Image from 'next/image'
import Link from 'next/link'
import { IoPodiumOutline } from 'react-icons/io5'
import { LiaUserFriendsSolid } from 'react-icons/lia'

export default function History({
	history,
	userProfile,
}: {
	history: GameResultInterface[]
	userProfile: IUserProfile
}) {
	return (
		<div className="h-full w-full space-y-2 overflow-auto scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
			{!hasValues(history) ? (
				<div className="w-full py-8 text-center text-2xl">Go play outside</div>
			) : (
				history?.map((match, index) => {
					const userWon = match.winner.userId === userProfile.id

					const opponent = userWon ? match.loser : match.winner
					const isLadder = match.gameType === GameType.LADDER

					const score = userWon
						? `${match.winner.score} ${match.loser.score}`
						: `${match.winner.score} ${match.winner.score}`

					return (
						<div
							className={`grid w-full grid-cols-11 place-content-between items-center rounded-sm bg-gradient-to-r 
							${
								!userWon
									? 'from-primary-fushia/10 to-primary-shoque/10 text-gray-400'
									: 'from-primary-fushia/40 to-primary-shoque/40 '
							} px-4 py-3 text-xl`}
							key={index}
						>
							<Link
								className="col-span-6 flex items-center space-x-4 hover:underline"
								href={`/profile?id=${opponent.userId}`}
							>
								<Tippy
									content={
										<div className="rounded border border-white bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% p-2">
											{isLadder ? 'Ladder' : 'Friendly'}
										</div>
									}
									className="text-xs"
								>
									<button>
										{isLadder ? <IoPodiumOutline /> : <LiaUserFriendsSolid />}
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
							<p className="col-span-2">{score}</p>
							<p className="col-span-3 flex place-content-end text-end text-2xl">
								{userWon ? 'Victory' : 'Defeat'}
							</p>
						</div>
					)
				})
			)}
		</div>
	)
}
