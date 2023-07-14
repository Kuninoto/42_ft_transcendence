import Link from 'next/link'

export default function leaderboard() {
	return (
		<>
			<header className="flex py-6 px-8 justify-between sticky">
				<Link className='fixed' href='/'>GO BACK</Link>
				<p className='text-4xl mx-auto'>HIGH SCORE</p>
			</header>
			<div className='w-full flex flex-col place-items-center'>
				<div className='flex text-2xl space-x-12 mb-2'>
					<div>RANK</div>
					<div>NAME</div>
					<div>WINS</div>
				</div>
				<div className='space-y-2'>
					<div className='group flex text-xl relative'>
						<p className='invisible group-hover:visible group-focus:visible absolute -left-8'>&gt;</p>
						<Link className='flex space-x-16' href='/'>
							<div> 1st </div>
							<div> Moasd </div>
							<div> 123 </div>
						</Link>
					</div>
				</div>
			</div>
		</>
	)
}
