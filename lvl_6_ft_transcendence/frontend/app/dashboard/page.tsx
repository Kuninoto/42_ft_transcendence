import Image from 'next/image'
import Link from 'next/link'

import FriendsList from './friendsList'

function Card({ children, path }: { children: JSX.Element[]; path: string }) {
	return (
		<Link
			className="group relative mx-auto w-1/3 rounded-xl border-2 border-white/20 bg-black/10 hover:border-white"
			href={path}
		>
			<div className="absolute -inset-1 m-1 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
			<div className="relative flex flex-col place-content-center rounded-lg text-center align-middle text-white opacity-50 transition-all duration-700 group-hover:opacity-100">
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
						<div className="">play against someone </div>
					</Card>
					<Card path="/leaderboard">
						<div className="text-md">Leaderboard</div>
						<div></div>
					</Card>
					<Card path="/profile">
						<div className="text-2xl">Profile</div>
						<div>lorem ipsum dolor sit </div>
					</Card>
				</div>
			</div>

			<div className="flex h-screen w-1/4">
				<FriendsList />
			</div>
		</div>
	)
}
