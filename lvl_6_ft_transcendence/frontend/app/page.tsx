import Image from 'next/image'

export default function page() {
	return (
		<>
			<Image
				src={'/neon.gif'}
				alt='neon flickering light'
				width={850}
				height={1}
				className='mx-auto h-[75vh] w-[65vw]'
			/>
			<div className='w-full h-max flex place-content-end px-12 text-2xl space-x-4'>
				<div className='my-auto'>
					INSERT COIN
				</div>
				<Image
					src={'/neonArrow.png'}
					alt='neon arrow light'
					width={100}
					height={1}
					className='animate-horizontalBounce'
				/>
				<a href="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-b5dc96e149f80b24df624871658fdaa8d6610f1efc0a284afab94cbdb7d0420c&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard&response_type=code" className='h-auto w-10 flex group'>
					<div className='bg-black h-auto w-8 border-8 border-[#413F3F] rounded-md'></div>
					<Image
						src={'/coin.png'}
						alt='coin'
						width={50}
						height={35}
						className='opacity-0 translate-x-8 translate-y-12 transition-all duration-700 absolute group-hover:opacity-100 group-hover:translate-x-3 group-hover:translate-y-2'
					/>
				</a>
			</div>
		</>
	)
}


