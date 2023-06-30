import Image from 'next/image'

export default function page() {
	return (
		<div className="flex flex-col items-center">
			<Image
				alt="neon flickering light"
				className="mx-auto w-[65vw]"
				height={1}
				src={'/neon.gif'}
				width={850}
			/>
			<div className="flex h-max w-full place-content-end space-x-4 px-12 text-2xl">
				<div className="my-auto">INSERT COIN</div>
				<Image
					alt="neon arrow light"
					className="animate-horizontalBounce"
					height={1}
					src={'/neonArrow.png'}
					width={100}
				/>
				<a
					href={
						'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-b5dc96e149f80b24df624871658fdaa8d6610f1efc0a284afab94cbdb7d0420c&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth&response_type=code'
					}
					className="group flex h-auto w-10"
				>
					<div className="h-auto w-8 rounded-md border-8 border-[#413F3F] bg-black"></div>
					<Image
						alt="coin"
						className="absolute translate-x-8 translate-y-12 opacity-0 transition-all duration-700 group-hover:translate-x-3 group-hover:translate-y-2 group-hover:opacity-100"
						height={35}
						src={'/coin.png'}
						width={50}
					/>
				</a>
			</div>
		</div>
	)
}
