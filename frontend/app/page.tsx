import Image from 'next/image'

export default function page() {
	return (
		<div className="flex h-full w-full flex-col items-center">
			<div className="relative aspect-video h-5/6">
				<Image
					alt="neon flickering light"
					className="object-cover"
					fill
					priority
					sizes="100%"
					src={'/neon.gif'}
				/>
			</div>
			<div className="flex h-max w-full place-content-end space-x-4 px-12 text-4xl">
				<div className="my-auto">INSERT COIN</div>
				<div className="relative aspect-square h-32">
					<Image
						alt="neon arrow light"
						className="animate-horizontalBounce"
						fill
						priority
						sizes="100%"
						src={'/neonArrow.png'}
					/>
				</div>
				<a
					className="group flex h-auto w-10"
					href={process.env.NEXT_PUBLIC_INTRA_REDIRECT_URI}
				>
					<div className="h-auto w-8 rounded-md border-8 border-[#413F3F] bg-black"></div>
					<div className="absolute h-24 w-16 translate-x-8 translate-y-16 opacity-0 transition-all duration-700 group-hover:translate-x-3 group-hover:translate-y-4 group-hover:opacity-100">
						<Image alt="coin" fill priority sizes="100%" src={'/coin.png'} />
					</div>
				</a>
			</div>
		</div>
	)
}
