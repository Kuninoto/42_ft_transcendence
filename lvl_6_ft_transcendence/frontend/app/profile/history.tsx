import { UserProfile as IUserProfile } from '@/common/type/backend/user-profile.interface'
import { GameResultInterface } from '@/common/types/backend/game-result-interface.interface'
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
			{history?.map((match, index) => {
				const opponent =
					match.winner.userId === userProfile?.id ? match.loser : match.winner

				return (
					<div
						className="flex w-full place-content-around border border-white py-3 text-xl"
						key={index}
					>
						{console.log(match)}
						<p>
							{match.winner.userId === userProfile?.id ? 'Victory' : 'Defeat'}
						</p>
						<p>12 04</p>
						<p>4:20</p>
						<Link
							className="hover:underline"
							href={`/profile?id=${opponent.userId}`}
						>
							{opponent.name}
						</Link>
					</div>
				)
			})}
		</div>
	)
}
