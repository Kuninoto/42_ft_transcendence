import Link from 'next/link'

export default function Leaderboard() {
	return (
		<>
			<header className="sticky flex justify-between px-8 py-6">
				<Link className="fixed" href="/dashboard">
					GO BACK
				</Link>
				<p className="mx-auto text-4xl">HIGH SCORE</p>
			</header>
			<div className="flex w-full flex-col place-items-center">
				<div className="mb-2 flex space-x-12 text-2xl">
					<div>RANK</div>
					<div>NAME</div>
					<div>WINS</div>
				</div>
				<div className="space-y-2">
					<div className="group relative flex text-xl">
						<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
							&gt;
						</p>
						<Link className="flex space-x-16" href="/">
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
