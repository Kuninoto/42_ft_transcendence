import Image from 'next/image'
import Link from 'next/link'

import FriendsList from './friendsList'

function Card({ children, path }: { children: JSX.Element[], path: string }) {
	return (
		<Link href={path} className="mx-auto bg-black/10 w-1/3 relative group border-2 border-white/20 hover:border-white rounded-xl">
			<div className="absolute -inset-1 bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 m-1"></div>
			<div className="flex flex-col relative transition-all duration-700 opacity-50 group-hover:opacity-100 text-white rounded-lg text-center place-content-center align-middle">
				{children}
			</div>
		</Link>
	)
}

export default function dashboard() {
	return (
		<div className='flex'>
			<Image
				src={'/logo.png'}
				alt='logo picture'
				width="0"
				height="0"
				sizes="100vw"
				className="fixed w-40 h-28"
			/>

			<div className='flex flex-col w-3/4 place-content-center gap-y-8'>
				<div className='flex mx-auto space-x-12 h-96 px-24'>
					<Card path='/game'>
						<div className='text-2xl'>Play</div>
						<div className=''>play against someone </div>
					</Card>
					<Card path='/game'>
						<div className='text-md'>Leaderboard</div>
						<div></div>
					</Card>
					<Card path='/game'>
						<div className='text-2xl'>Profile</div>
						<div>lorem ipsum dolor sit </div>
					</Card>
				</div>
			</div>

			<div className='flex h-screen w-1/4'>
				<FriendsList />
			</div>

		</div >
	)
}
