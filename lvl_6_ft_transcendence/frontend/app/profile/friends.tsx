import { FriendInterface } from '@/common/types/friend-interface.interface'
import Image from 'next/image'
import Link from 'next/link'

export default function Friends({ friends } : { friends: FriendInterface[] | undefined} ) {
	return (
		<div className="w-full h-full space-y-4">
			{ friends?.length === 0 ?
			<div className='flex flex-col place-content-start space-y-8 items-center h-full w-full'>
				<div className='relative w-96 aspect-square'>
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
				<div className=''>You've got no friends <span className='text-xl'>😔</span></div>
			</div>
			:			
			friends?.map(friend => 
				<Link className="" href={`/profile?id=${friend.uid}`}>
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
				)}
		</div>
	)
}
