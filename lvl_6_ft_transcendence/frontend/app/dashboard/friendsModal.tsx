'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function FriendsModal({
	closeModal,
}: {
	closeModal: () => void
}) {
	const [search, setSearch] = useState('')

	return (
		<div className="reltaive absolute left-0 top-0 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/30"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32 ">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="animate-tilt absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-50 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">
						<input
							className="w-[36rem] rounded border border-white bg-transparent p-2 pl-4 text-xl outline-none ring-0"
							maxLength={18}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search"
							type="text"
							value={search}
						/>

						<div className="mt-8 h-56 space-y-3 overflow-scroll border-none ">
							{!!search ? (
								<div className="mb-4">
									Searching for &quot;
									<span className="text-[#FB37FF]">{search}</span>
									&quot;
								</div>
							) : (
								<div>Search for your friends</div>
							)}
							<Link
								className="flex items-center space-x-6 rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
								href="/"
							>
								<Image
									alt="profile picture"
									className="aspect-square w-8"
									height={0}
									sizes="100vw"
									src="/coin.png"
									width={0}
								/>
								<span className="text-xl">monkey</span>
							</Link>
							<Link
								className="flex items-center space-x-6 rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
								href="/"
							>
								<Image
									alt="profile picture"
									className="aspect-square w-8"
									height={0}
									sizes="100vw"
									src="/coin.png"
									width={0}
								/>
								<span className="text-xl">monkey</span>
							</Link>
							<Link
								className="flex items-center space-x-6 rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
								href="/"
							>
								<Image
									alt="profile picture"
									className="aspect-square w-8"
									height={0}
									sizes="100vw"
									src="/coin.png"
									width={0}
								/>
								<span className="text-xl">monkey</span>
							</Link>
							<Link
								className="flex items-center space-x-6 rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
								href="/"
							>
								<Image
									alt="profile picture"
									className="aspect-square w-8"
									height={0}
									sizes="100vw"
									src="/coin.png"
									width={0}
								/>
								<span className="text-xl">monkey</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

