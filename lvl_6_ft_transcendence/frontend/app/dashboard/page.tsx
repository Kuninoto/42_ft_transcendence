'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	HiOutlinePlay,
	HiOutlineTrophy,
	HiOutlineUserCircle,
} from 'react-icons/hi2'

import FriendsList from './friendsList'

function Card({ children, path }: { children: JSX.Element[]; path: string }) {
	return (
		<Link
			className="group relative w-96 flex-1 rounded-xl border-2 border-white/20 py-24 hover:border-white"
			href={path}
		>
			<div className="absolute -inset-1 m-1 bg-gradient-to-r from-primary-fushia to-primary-shoque opacity-25 blur transition duration-1000 group-hover:opacity-80 "></div>
			<div className="relative flex h-full flex-col place-content-center items-center space-y-6 rounded-lg text-center text-white opacity-50 group-hover:opacity-100">
				{children}
			</div>
		</Link>
	)
}

export default function Dashboard() {
	const router = useRouter()

	function gotoThemes(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		e.preventDefault()
		e.stopPropagation()
		router.push('/themes')
	}

	return (
		<div className="flex">
			<div className="fixed h-28 w-40">
				<Image
					alt="logo picture"
					fill
					priority
					sizes="100%"
					src={'/logo.png'}
				/>
			</div>

			<div className="flex w-3/4 flex-col place-content-center gap-y-8">
				<div className="mx-auto flex space-x-8">
					<Card path="/matchmaking/finding-opponent">
						<div className="text-2xl">Play</div>
						<HiOutlinePlay size={128} />
						<button
							className="text-md rounded-md border-2 border-white px-10 py-3 opacity-60 mix-blend-lighten group-hover:opacity-100 hover:bg-white hover:text-black"
							onClick={gotoThemes}
						>
							THEMES
						</button>
					</Card>
					<Card path="/leaderboard">
						<div className="text-2xl">Leaderboard</div>
						<HiOutlineTrophy size={128} />
						<div className="break-before-auto">
							SEE EVERYONE <br /> BETTER THAN U
						</div>
					</Card>
					<Card path="/profile">
						<div className="text-2xl">Profile</div>
						<HiOutlineUserCircle size={128} />
						<div>
							WHAT A FINE <br/>PICTURE
						</div>
					</Card>
				</div>
			</div>

			<div className="flex h-screen w-1/4">
				<FriendsList />
			</div>
		</div>
	)
}
