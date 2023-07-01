import Image from 'next/image'
import Link from 'next/link'

import { HiOutlinePlay, HiOutlineTrophy, HiOutlineUserCircle } from 'react-icons/hi2'

import FriendsList from './friendsList'

function Card({ children, path }: { children: JSX.Element[]; path: string }) {
	return (
		<Link
			className="group relative mx-auto w-1/3 rounded-xl border-2 border-white/20 bg-black/10 hover:border-white"
			href={path}
		>
			<div className="absolute -inset-1 m-1 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-25 blur transition duration-1000 group-hover:opacity-80 group-hover:duration-200"></div>
			<div className="relative h-full space-y-6 mx-2 flex flex-col items-center place-content-center rounded-lg text-center align-middle text-white opacity-50 group-hover:opacity-100">
				{children}
			</div>
		</Link>
	)
}

export default function dashboard() {
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
				<div className="mx-auto flex h-96 space-x-12 px-24">
					<Card path="/game">
						<div className="text-2xl">Play</div>
						<HiOutlinePlay size={128} />
						<div className="">LOSE AGAINST SOMEONE </div>
					</Card>
					<Card path="/leaderboard">
						<div className="text-2xl">Leaderboard</div>
						<HiOutlineTrophy size={128} />
						<div className="break-before-auto">SEE EVERYONE <br/> BETTER THAN U </div>
					</Card>
					<Card path="/profile">
						<div className="text-2xl">Profile</div>
						<HiOutlineUserCircle size={128} />
						<div> GET A NEW <br/> PICTURE PLEASE </div>
					</Card>
				</div>
			</div>

			<div className="flex h-screen w-1/4">
				<FriendsList />
			</div>
		</div>
	)
}
