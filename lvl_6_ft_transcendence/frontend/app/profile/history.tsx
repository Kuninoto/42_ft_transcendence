import {
	GameResultInterface,
	UserProfile as IUserProfile,
} from '@/common/types/backend'
import { hasValues } from '@/common/utils/hasValues'
import { removeParams } from '@/contexts/AuthContext'
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
		<div className="w-full space-y-4">
			{!hasValues(history) ? (
				<div className="w-full py-8 text-center text-2xl">Go play outside</div>
			) : (
				history?.map((match, index) => {
					const userWon = match.winner.userId === userProfile.id

					const opponent = userWon ? match.loser : match.winner

					const score = userWon ? (
						<>
							<span className="text-green-700">{match.winner.score}</span>{' '}
							{match.loser.score}
						</>
					) : (
						<>
							{match.winner.score}{' '}
							<span className="text-red-700">{match.loser.score}</span>
						</>
					)

					return (
						<div
							className={`flex w-full place-content-between items-center border border-l-4 border-white ${
								userWon ? ' border-l-green-600' : 'border-l-red-600'
							} px-4 py-3 text-xl`}
							key={index}
						>
							<Link
								className="flex items-center space-x-4 hover:underline"
								href={`/profile?id=${opponent.userId}`}
							>
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
							{userWon ? (
								<p className="text-2xl text-green-700">Victory</p>
							) : (
								<p className="text-2xl text-red-700">Defeat</p>
							)}
						</div>
					)
				})
			)}
		</div>
	)
}
