import { Friend } from '@/common/types'
import { removeParams } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

export default function Friends({ friends }: { friends: Friend[] | undefined }) {
	if (!friends || friends.length === 0) {
		return (
			<div className="h-full w-full space-y-4">
				<div className="flex h-full w-full flex-col place-content-start items-center space-y-8">
					<div className="relative aspect-square w-96">
						<Image
							alt={'no friends pepe'}
							className="object-cover"
							fill
							src={'/nofriends.png'}
						/>
					</div>
					<div className="">
						You&apos;ve got no friends <span className="text-xl">😔</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col space-y-4">
			{friends!.map((friend) => (
				<Link
					className="group"
					href={`/profile?id=${friend.uid}`}
					key={friend.uid}
				>
					<div className="flex w-full place-content-around items-center border border-white py-3 text-xl">
						<p>#{friend.ladder_level}</p>
						<div className="relative aspect-square w-12 overflow-hidden rounded-sm">
							<Image
								alt={'player profile picture'}
								className="object-cover"
								fill
								loader={removeParams}
								sizes="100vw"
								src={friend.avatar_url}
							/>
						</div>
						<p className="group-hover:underline">{friend.name}</p>
						<p>{friend.status}</p>
					</div>
				</Link>
			))}
		</div>
	)
}
