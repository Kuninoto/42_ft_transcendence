import {
	GameResultInterface,
	UserProfile as IUserProfile,
} from '@/common/types/backend'
import { hasValues } from '@/common/utils/hasValues'
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
					const opponent =
						match.winner.userId === userProfile?.id ? match.loser : match.winner

					return (
						<div
							className="flex w-full place-content-around border border-white py-3 text-xl"
							key={index}
						>
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
				})
			)}
		</div>
	)
}
