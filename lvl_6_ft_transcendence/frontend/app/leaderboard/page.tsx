import Image from 'next/image'
import Link from 'next/link'

export default function Leaderboard() {
	return (
		<div className="flex flex-col space-y-8">
			<Link className="fixed left-12 top-12" href="/dashboard">
				GO BACK
			</Link>
			<div className="mx-auto flex items-end space-x-10 text-center">
				<div className="space-y-2">
					<Image
						alt="second place picture"
						className="mx-auto w-24 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div className="w-32 overflow-hidden text-ellipsis text-2xl">
						nameakjdgenrwkjgernkj
					</div>
					<div className="text-sm">#1 - 123w</div>
				</div>
				<div className="space-y-2">
					<Image
						alt="second place picture"
						className="mx-auto w-36 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div className="w-32 overflow-hidden text-ellipsis text-2xl">
						nameakjdgenrwkjgernkj
					</div>
					<div className="text-sm">#1 - 123w</div>
				</div>
				<div className="space-y-2">
					<Image
						alt="second place picture"
						className="mx-auto w-28 rounded-full"
						height={0}
						sizes="100vw"
						src={'https://picsum.photos/200'}
						width={0}
					/>
					<div className="w-32 overflow-hidden text-ellipsis text-2xl">
						nameakjdgenrwkjgernkj
					</div>
					<div className="text-sm">#1 - 123w</div>
				</div>
			</div>

			<div className="mx-24 h-0.5 w-auto bg-white"></div>

			<div className="flex w-full flex-col place-items-center space-y-4">
				<div className="space-y-6">
					<div className="group relative flex text-xl">
						<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
							&gt;
						</p>
						<Link className="flex items-center space-x-16" href="/">
							<div className="text-center"> #4 </div>
							<Image
								alt="third place picture"
								className="aspect-square w-10 rounded-full"
								height={0}
								sizes="100vw"
								src={'https://picsum.photos/200'}
								width={0}
							/>
							<div className="w-44 overflow-hidden text-ellipsis text-center">
								Moasdkdjghwrguierhjguierhi
							</div>
							<div className="text-center"> 123 </div>
						</Link>
					</div>
				</div>
				<div className="space-y-6">
					<div className="group relative flex text-xl">
						<p className="invisible absolute -left-8 group-hover:visible group-focus:visible">
							&gt;
						</p>
						<Link className="flex items-center space-x-16" href="/">
							<div className=""> #5 </div>
							<Image
								alt="third place picture"
								className="aspect-square w-10 rounded-full"
								height={0}
								sizes="100vw"
								src={'https://picsum.photos/200'}
								width={0}
							/>
							<div className=" w-44 overflow-hidden text-ellipsis"> asd </div>
							<div className=""> 123 </div>
						</Link>
					</div>
				</div>

				<div className="fixed bottom-8">
					<div className="group relative grid items-start justify-center  gap-8">
						<div className="animate-tilt absolute -inset-0.5 rounded bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
						<div className="relative flex items-center space-x-16 rounded bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-8 py-4 text-2xl">
							<div className=""> #5 </div>
							<Image
								alt="third place picture"
								className="aspect-square w-10 rounded-full"
								height={0}
								sizes="100vw"
								src={'https://picsum.photos/200'}
								width={0}
							/>

							<div className="w-44 overflow-hidden text-ellipsis"> asd </div>
							<div className=""> 123 </div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
