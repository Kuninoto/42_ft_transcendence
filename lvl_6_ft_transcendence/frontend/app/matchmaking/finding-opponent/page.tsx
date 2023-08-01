'use client'

import { useGame } from '@/contexts/GameContext'
import Image from 'next/image'

export default function FindingOpponent() {

	const { cancel } = useGame()

	return (
		<div className="flex h-full">
			<div className="m-auto flex flex-col items-center space-y-10 text-4xl">
				<Image
					alt={'cats playing pong(loading screen)'}
					className="mx-auto w-96 rounded"
					height="0"
					sizes="100vw"
					src={'/catpong.gif'}
					width="0"
				/>
				<div>IN QUEUE</div>
				<button
					className="rounded border border-white px-4 py-2 hover:bg-white hover:text-[#170317]"
					onClick={cancel}
				>
					Cancel
				</button>
			</div>
		</div>
	)
}
