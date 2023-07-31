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
			className="group relative flex-1 rounded-xl border-2 border-white/20 hover:border-white"
			href={path}
		>
			<div className="absolute -inset-1 m-1 bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-25 blur transition duration-1000 group-hover:opacity-80 "></div>
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
			<Image
				alt="logo picture"
				className="fixed h-28 w-40"
				height="0"
				sizes="100vw"
				src={'/logo.png'}
				width="0"
			/>

			<div className="flex w-3/4 flex-col place-content-center gap-y-8">
				<div className="flex h-96 space-x-12 px-24">
					<Card path="/game">
						<div className="text-2xl">Play</div>
						<HiOutlinePlay size={128} />
						<button
							className="text-md rounded-md border-2 border-white px-10 py-3 opacity-60 mix-blend-lighten hover:bg-white hover:text-black group-hover:opacity-100"
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
							GET A NEW <br /> PICTURE PLEASE
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
