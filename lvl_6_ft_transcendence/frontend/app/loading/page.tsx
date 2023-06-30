'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Leaderboard() {

	const router = useRouter()

	function cancel() {
			router.push('/dashboard')
		}

	return (
		<div className="h-full flex">	
		<div className="m-auto space-y-10 text-2xl items-center flex flex-col">
			<div className="flex space-x-12">
			<p>Name</p>
			<p>vs</p>
			<p>name2</p>
			</div>
			<Image
				alt={'cats playing pong(loading screen)'}
				className="mx-auto w-80 rounded"
				height="0"
				sizes="100vw"
				src={'/catpong.gif'}
				width="0"
			/>
			<div>IN QUEUE</div>
			<button onClick={cancel} className="border border-white hover:bg-white hover:text-[#170317] px-4 py-2 rounded">Cancel</button>
		</div>
		</div>
	)
}
