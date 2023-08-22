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

					const score = userWon
						? `${match.winner.score} ${match.loser.score}`
						: `${match.loser.score} ${match.winner.score}`

					console.log(score)

					return (
						<div
							className="flex w-full place-content-between items-center border border-green-600 px-4 py-3 text-xl"
							key={index}
						>
							{userWon ? (
								<p className="text-2xl text-green-600">Victory</p>
							) : (
								<p className="text-2xl text-red-500">Defeat</p>
							)}
							<p>{score}</p>
							<Link
								className="flex items-center space-x-4 hover:underline"
								href={`/profile?id=${opponent.userId}`}
							>
								<span>{opponent.name}</span>
								<div className="relative aspect-square w-12 overflow-hidden rounded">
									<Image
										alt={'player profile picutre'}
										className="object-cover"
										fill
										loader={removeParams}
										sizes="100vw"
										src={opponent.avatar_url}
									/>
								</div>
							</Link>
						</div>
					)
				})
			)}
		</div>
	)
}
