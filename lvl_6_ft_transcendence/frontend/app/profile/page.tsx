'use client'

import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import Friends from './friends'
import History from './history'
import Status from './status'

enum Tabs {
	status,
	history,
	friends,
}

export default function Profile() {
	const [openTab, setOpenTab] = useState(Tabs.status)
	const { user } = useAuth()

	const buttons = [
		{ label: 'Status', value: Tabs.status },
		{ label: 'Match history', value: Tabs.history },
		{ label: 'Friends', value: Tabs.friends },
	]

	return (
		<div className="flex flex-col space-y-8 py-12">
			<div className="flex w-full">
				<Link
					className="fixed left-12 top-12 hover:underline"
					href={'/dashboard'}
				>
					GO BACK
				</Link>

				<div className="mx-auto flex flex-col space-y-4 text-center">
					<Image
						alt={'player profile picutre'}
						className="mx-auto aspect-square w-36 rounded-full"
						height="0"
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width="0"
					/>
					<p className="text-3xl">{user.name}</p>
				</div>
			</div>

			<div className="mx-auto flex space-x-12 text-2xl">
				{buttons.map((tab) => {
					return (
						<button
							className={`border-b-2 border-white px-16 py-2 text-white
					${openTab === tab.value ? 'opacity-100' : 'opacity-25 hover:opacity-100'}`}
							key={tab.value}
							onClick={() => setOpenTab(tab.value)}
						>
							{tab.label}
						</button>
					)
				})}
			</div>

			<div className="mx-80 flex">
				{openTab === Tabs.status ? (
					<Status />
				) : openTab === Tabs.history ? (
					<History />
				) : (
					<Friends />
				)}
			</div>
		</div>
	)
}
