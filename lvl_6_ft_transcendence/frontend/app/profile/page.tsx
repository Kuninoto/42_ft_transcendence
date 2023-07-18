'use client'

import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import Friends from './friends'
import History from './history'

enum Tabs {
	status,
	history,
	friends,
}

export default function Profile() {
	const { user } = useAuth()

	const [showMatchHistory, setShowMatchHistory] = useState(true)

	return (
		<div className="h-full py-12">
			<Link
				className="fixed left-12 top-12 hover:underline"
				href={'/dashboard'}
			>
				GO BACK
			</Link>

			<div className="mx-64 grid h-full grid-cols-2">
				<div className="mx-auto flex h-full flex-col place-content-center items-center space-y-6 text-center">
					<div className="relative aspect-square w-52 place-content-center items-center overflow-hidden rounded-full">
						<Image
							alt={'player profile picutre'}
							className="h-max w-max"
							height={0}
							layout="fill"
							objectFit="cover"
							src={user.avatar_url || '/placeholder.jpg'}
							width={0}
						/>
					</div>

					<p className="text-3xl">{user.name || 'Loading...'}</p>

					<div className="space-x-2">
						<button className="rounded border border-white px-2 py-1 text-white mix-blend-lighten hover:bg-white hover:text-black">
							Add friend
						</button>
						<button className="rounded border border-white px-2 py-1 text-white mix-blend-lighten hover:bg-white hover:text-black">
							Block
						</button>
					</div>

					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
				</div>

				<div className="pb-12">
					<div className="-mb-0.5 flex w-full place-content-center space-x-2 text-2xl ">
						<button
							className={`mr-0.5 border border-white px-3 py-1 hover:border-white hover:text-white
							${showMatchHistory ? 'mix-blend-exclusion' : 'border-white/50 text-white/50'}`}
							onClick={() => setShowMatchHistory(true)}
						>
							Match history
						</button>
						<button
							className={`mr-0.5 border border-white px-3 py-1 hover:border-white hover:text-white
							${showMatchHistory ? 'border-white/50 text-white/50' : 'mix-blend-exclusion'}`}
							onClick={() => setShowMatchHistory(false)}
						>
							Friends
						</button>
					</div>
					<div className="h-full border border-white p-4">
						<History />
					</div>
				</div>
			</div>
		</div>
	)
}
