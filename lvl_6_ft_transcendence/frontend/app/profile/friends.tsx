import { FriendInterface } from '@/common/types/friend-interface.interface'
import { hasValues } from '@/common/utils/hasValues'
import Image from 'next/image'
import Link from 'next/link'

export default function Friends({
	friends,
}: {
	friends: FriendInterface[] | undefined
}) {
	console.log("load")
	return (
		<div className="h-full w-full space-y-4">
			{!hasValues(friends) ? (
				<div className="flex h-full w-full flex-col place-content-start items-center space-y-8">
					<div className="relative aspect-square w-96">
						<Image
							alt={'no friends pepe'}
							className="aspect-square"
							height={0}
							layout="fill"
							objectFit="cover"
							src={'/nofriends.png'}
							width={0}
						/>
					</div>
					<div className="">
						You've got no friends <span className="text-xl">😔</span>
					</div>
				</div>
			) : (
				friends?.map((friend) => (
					<Link
						className=""
						href={`/profile?id=${friend.uid}`}
						key={friend.uid}
					>
						<div className="flex w-full place-content-around items-center border border-white py-3 text-xl">
							<Image
								alt={'player profile picutre'}
								className="aspect-square w-12 rounded-full"
								height="0"
								sizes="100vw"
								src={friend.avatar_url}
								width="0"
							/>
							<p>{friend.name}</p>
							<p>rank</p>
							<p>{friend.status}</p>
						</div>
					</Link>
				))
			)}
		</div>
	)
}
