'use client'

import { useState } from 'react'

export default function GroupsModal({
	closeModal,
}: {
	closeModal: () => void
}) {
	const [search, setSearch] = useState('')
	const [searchLoading, setSearchLoading] = useState(true)

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">
						<input
							className="w-[34rem] rounded border border-white bg-transparent p-2 pl-4 text-xl outline-none ring-0"
							maxLength={18}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search"
							type="text"
							value={search}
						/>

						<div className="mt-8 h-56 space-y-3 overflow-scroll border-none ">
							<div className="mb-4">
								Searching for &quot;
								<span className="text-[#FB37FF]">{search}</span>
								&quot;
							</div>

							{searchLoading ? (
								<div> Loading... </div>
							) : 1 ? (
								<div> No one </div>
							) : (
								<div className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white">
									<div className="flex space-x-6">
										<span className="text-xl">asda</span>
									</div>
									<button className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black">
										oin
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
