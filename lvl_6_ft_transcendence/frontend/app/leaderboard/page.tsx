import Image from 'next/image'
import Link from 'next/link'

export default function Leaderboard() {
	return (
		<div className="flex flex-col space-y-8">
			<Link className="fixed left-12 top-12" href="/dashboard">
				GO BACK
			</Link>
			<div className="mx-auto flex items-end space-x-10 text-center">
				<div className="space-y-2 text-2xl">
					<Image
						alt="second place picture"
						className="w-32 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div>name</div>
					<div>#3</div>
				</div>
				<div className="space-y-2 text-2xl">
					<Image
						alt="first place picture"
						className="w-40 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div>name</div>
					<div>#1</div>
				</div>
				<div className="space-y-2 text-2xl">
					<Image
						alt="third place picture"
						className="w-28 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div>name</div>
					<div>#2</div>
				</div>
			</div>

			<div className="mx-24 h-px w-auto bg-white"></div>

			<div className="flex w-full flex-col place-items-center">
				<div className="mb-2 flex space-x-12 text-3xl">
					<div>RANK</div>
					<div>NAME</div>
					<div>WINS</div>
				</div>
				<div className="space-y-6">
					<div className="group relative flex text-xl">
						<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
							&gt;
						</p>
						<Link className="flex" href="/">
							<div className="bg-red-400 text-center"> 1st </div>
							<div className="text-center"> Moasd </div>
							<div className="text-center"> 123 </div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
