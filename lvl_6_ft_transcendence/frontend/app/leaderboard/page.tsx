'use client'

import { api } from '@/api/api'
import { UserStatsForLeaderboard } from '@/common/types/backend'
import { hasValues } from '@/common/utils/hasValues'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CgTrophy } from 'react-icons/cg'
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
	if (!hasValues(user)) {
		return (
			<div className="flex h-full flex-col place-content-center items-center space-y-4">
				<div
					className={`relative ${width} aspect-square overflow-hidden rounded`}
				>
					<Image
						alt="second place picture"
						className="object-cover"
						fill
						loader={removeParams}
						priority
						sizes="100%"
						src={'/placeholder.gif'}
						unoptimized
					/>
				</div>
				<div className="text-xl">{'NOT FOUND'}</div>
			</div>
		)
	}
	return (
		<Link
			className="flex flex-col items-center space-y-2"
			href={`/profile?id=${user.uid}`}
		>
			<div
				className={`relative ${width} aspect-square overflow-hidden rounded`}
			>
				<Image
					alt="second place picture"
					className="object-cover"
					fill
					loader={removeParams}
					priority
					sizes="100%"
					src={user.avatar_url}
					unoptimized
				/>
			</div>
			<div className="text-xl">{user.name}</div>
			<div className="flex items-center text-sm">
				#{top} • {user.wins} <CgTrophy className="-mt-0.5" size={20} />
			</div>
		</Link>
	)
}

export default function Leaderboard() {
	const [users, setUsers] = useState<UserStatsForLeaderboard[]>([])

	const [loading, isLoading] = useState(true)

	const { user } = useAuth()

	const first: undefined | UserStatsForLeaderboard = users?.at(0)
	const second: undefined | UserStatsForLeaderboard = users?.at(1)
	const third: undefined | UserStatsForLeaderboard = users?.at(2)
	const rest: undefined | UserStatsForLeaderboard[] = users?.slice(3)

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
		<div className="flex h-full flex-col py-8">
			<Link
				className="fixed  top-0 h-28 w-40 hover:underline"
				href={'/dashboard'}
			>
				<Image
					alt="logo picture"
					fill
					priority
					sizes="100%"
					src={'/logo.png'}
				/>
			</Link>
			<div className="mx-auto flex items-end space-x-10 text-center">
				<Podium top={'2'} user={second} width={'w-28'} />
				<Podium top={'1'} user={first} width={'w-32'} />
				<Podium top={'3'} user={third} width={'w-24'} />
			</div>

			<div className="mx-24 mb-3 mt-8 h-0.5 w-auto bg-white"></div>

			<div className="flex h-4/6 w-full scroll-py-48 flex-col place-items-center overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
				{loading ? (
					<div>Loading</div>
				) : rest?.length === 0 ? (
					<div className="my-auto text-4xl">Kinda empty here</div>
				) : (
					rest?.map((player, index) => {
						return (
							<div
								className="space-y-6 border-b border-white px-12 py-3"
								key={player.uid}
							>
								<div className="group relative flex text-xl">
									<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
										&gt;
									</p>
									<Link className="flex items-center space-x-16" href={`/profile?id=${player.uid}`}>
										<div className="text-center">#{index + 4}</div>
										<div className="relative aspect-square w-10 rounded">
											<Image
												alt="third place picture"
												className="object-cover"
												fill
												loader={removeParams}
												priority
												sizes="100%"
												src={player.avatar_url || '/placeholder.gif'}
												unoptimized
											/>
										</div>
										<div className="w-44 overflow-hidden text-ellipsis text-center">
											{player.name}
										</div>
										<div className="flex items-center">
											{player.wins} <CgTrophy size={32} />
										</div>
										<div>{player.win_rate}WR</div>
									</Link>
								</div>
							</div>
						)
					})
				)}

				<Link
					className="group group fixed bottom-8 grid items-start justify-center gap-8"
					href={'/profile'}
				>
					<div className="animate-tilt absolute -inset-0.5 rounded bg-gradient-to-r from-primary-fushia to-primary-shoque opacity-100 blur"></div>
					<div className="relative flex items-center space-x-16 rounded bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-8 py-4 text-2xl">
						<div className="flex items-center space-x-16">
							<div className="text-center">#{user?.ladder_level}</div>
							<div className="relative aspect-square w-10 overflow-hidden rounded-sm">
								<Image
									alt="user picture"
									className="object-cover"
									fill
									loader={removeParams}
									priority
									sizes="100%"
									src={user?.avatar_url || '/placeholder.gif'}
									unoptimized
								/>
							</div>
							<div className="w-44 overflow-hidden text-ellipsis text-center group-hover:underline">
								{user?.name || 'NOT FOUND'}
							</div>
							<div className="flex items-center">
								{user?.stats?.wins || '0'} <CgTrophy size={32} />
							</div>
							<div>{user?.stats?.win_rate || '0'}WR</div>
						</div>
					</div>
				</Link>
			</div>
		</div>
	)
}
