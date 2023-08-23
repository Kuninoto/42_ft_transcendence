'use client'

import { ChatRoomType } from '@/common/types/backend'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

function CreateGroup({ closeModal }: { closeModal: () => void }) {
	const { handleSubmit, register, watch } = useForm()

	function createRoom({
		name,
		password,
		type,
	}: {
		name: string
		password: string
		type: string
	}) {
		console.log(name, type)
	}

	const roomType = watch('type')

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">
						<form
							className="flex flex-col space-y-6"
							onSubmit={handleSubmit(createRoom)}
						>
							<input
								{...register('name')}
								className="rounded border border-white bg-transparent px-4 py-2"
								placeholder="Room name"
								type="text"
							/>

							<fieldset className="flex flex-col space-y-2">
								<label className="flex items-center space-x-2">
									<input
										{...register('type')}
										className="peer accent-primary-fushia"
										defaultChecked
										id={ChatRoomType.PUBLIC}
										type="radio"
										value={ChatRoomType.PUBLIC}
									/>
									<span className="text-white peer-checked:text-primary-fushia">
										Public - To everyone
									</span>
								</label>

								<label className="flex items-center space-x-2">
									<input
										{...register('type')}
										className="peer accent-primary-fushia"
										id={ChatRoomType.PRIVATE}
										type="radio"
										value={ChatRoomType.PRIVATE}
									/>
									<span className="text-white peer-checked:text-primary-fushia">
										Private - No one can see
									</span>
								</label>

								<label className="flex items-center space-x-2">
									<input
										{...register('type')}
										className="peer accent-primary-fushia"
										id={ChatRoomType.PROTECTED}
										type="radio"
										value={ChatRoomType.PROTECTED}
									/>
									<span className="text-white peer-checked:text-primary-fushia">
										Protected
										<input
											disabled={roomType !== ChatRoomType.PROTECTED}
											{...register('password')}
											className="text-black"
											type="password"
										/>
									</span>
								</label>
							</fieldset>

							<input type="submit" value={'Create'} />
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function GroupsModal({
	closeModal,
}: {
	closeModal: () => void
}) {
	const [search, setSearch] = useState('')
	const [searchLoading, setSearchLoading] = useState(true)

	const [createGroup, setCreateGroup] = useState(false)

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			{createGroup && <CreateGroup closeModal={() => setCreateGroup(false)} />}

			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center divide-x divide-gray-600 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-4 py-8 leading-none">
						<div className="flex w-[34rem] space-x-2">
							<input
								className="w-full rounded-l border border-white bg-transparent p-2 pl-4 text-xl outline-none ring-0"
								maxLength={18}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search"
								type="text"
								value={search}
							/>
							<button
								className="aspect-square w-12 place-content-center items-center rounded-r border border-white mix-blend-lighten hover:bg-white hover:text-black"
								onClick={() => setCreateGroup(true)}
							>
								+
							</button>
						</div>
						<div className="mt-8 h-56 space-y-3 overflow-auto border-none ">
							{search.length !== 0 && (
								<div className="mb-4">
									Searching for &quot;
									<span className="text-[#FB37FF]">{search}</span>
									&quot;
								</div>
							)}

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
