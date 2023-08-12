'use client'

import { api } from '@/api/api'
import { UserStatsForLeaderboard } from '@/common/types/backend/user-stats-for-leaderboard.interface'
import { removeParams } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

function Podium({
	top,
	user,
	width,
}: {
	top: string
	user: undefined | UserStatsForLeaderboard
	width: string
}) {
	return (
		<Link
			className="flex flex-col items-center space-y-2"
			href={`profile?id=${user?.uid}`}
		>
			<div
				className={`relative ${width} aspect-square overflow-hidden rounded`}
			>
				<Image
					alt="second place picture"
					fill
					loader={removeParams}
					objectFit="cover"
					sizes="100vw"
					src={user?.avatar_url || '/placeholder.gif'}
				/>
			</div>
			<div className="text-xl">{user?.name || 'NOT FOUND'}</div>
			{user && (
				<div className="text-sm">
					{' '}
					#{top} • {user?.wins}
				</div>
			)}
		</Link>
	)
}

export default function Leaderboard() {
	const [users, setUsers] = useState<UserStatsForLeaderboard[]>()

	const [loading, isLoading] = useState(true)

	const first: undefined | UserStatsForLeaderboard = users?.at(0)
	const second: undefined | UserStatsForLeaderboard = users?.at(1)
	const third: undefined | UserStatsForLeaderboard = users?.at(2)
	const rest: undefined | UserStatsForLeaderboard = users?.slice(3)

	useEffect(() => {
		try {
			api
				.get('/game/leaderboard')
				.then((result) => {
					setUsers(result.data)
					isLoading(false)
				})
				.catch((e) => {
					throw 'Network connection'
				})
		} catch (error) {
			toast.error(error)
		}
	}, [])

	return (
		<div className="flex flex-col space-y-8">
			<Link className="fixed left-12 top-12" href="/dashboard">
				GO BACK
			</Link>
			<div className="mx-auto flex items-end space-x-10 text-center">
				<Podium top={'2'} user={second} width={'w-28'} />
				<Podium top={'1'} user={first} width={'w-32'} />
				<Podium top={'3'} user={third} width={'w-24'} />
			</div>

			<div className="mx-24 h-0.5 w-auto bg-white"></div>

			<div className="flex w-full flex-col place-items-center space-y-4">
				{loading ? (
					<div>Loading</div>
				) : rest?.length === 0 ? (
					<div className="text-xl">Kinda empty here</div>
				) : (
					rest?.map((player, index) => {
						;<div className="space-y-6" id={index}>
							<div className="group relative flex text-xl">
								<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
									&gt;
								</p>
								<Link className="flex items-center space-x-16" href="/">
									<div className="text-center">{index + 3}</div>
									<Image
										alt="third place picture"
										className="aspect-square w-10 rounded-full"
										height={0}
										sizes="100vw"
										src={'/placeholder.gif'}
										width={0}
									/>
									<div className="w-44 overflow-hidden text-ellipsis text-center">
										Moasdkdjghwrguierhjguierhi
									</div>
									<div className="text-center"> 123 </div>
								</Link>
							</div>
						</div>
					})
				)}
			</div>
		</div>
	)
}
