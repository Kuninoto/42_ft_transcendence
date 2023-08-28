'use client'

import { api } from '@/api/api'
import { ChatRoomSearchInfo, ChatRoomType } from '@/common/types/backend'
import { CreateRoomDTO } from '@/common/types/create-room.dto'
import { JoinRoomDTO } from '@/common/types/join-room.dto'
import { useFriends } from '@/contexts/FriendsContext'
import bycrypt from 'bcryptjs'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AiOutlinePlus } from 'react-icons/ai'
import { BiLockAlt } from 'react-icons/bi'
import { toast } from 'react-toastify'

function CreateRoom({ closeModal }: { closeModal: () => void }) {
	const {
		formState: { errors },
		handleSubmit,
		register,
		setError,
		watch,
	} = useForm()
	const roomType = watch('type')

	const { refreshRooms } = useFriends()

	function createRoom({
		name,
		password,
		type,
	}: {
		name: string
		password: string
		type: ChatRoomType
	}) {
		const newRoom: CreateRoomDTO = {
			name,
			password: type === ChatRoomType.PROTECTED ? password : undefined,
			type,
		}

		try {
			api
				.post('/chat/create-room', newRoom)
				.then(() => {
					closeModal()
					refreshRooms()
				})
				.catch((e) =>
					setError('name', {
						message: e.response.data.message,
						type: 'alreadyInUser',
					})
				)
		} catch (error: any) {}

		console.log(name, type)
	}

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
							className="flex flex-col space-y-8"
							onSubmit={handleSubmit(createRoom)}
						>
							<fieldset className="flex w-full flex-col space-y-2">
								<input
									{...register('name', {
										maxLength: {
											message: 'Room names must have up to 10 characters long ',
											value: 10,
										},
										minLength: {
											message: 'Room names must at least 4 characters long',
											value: 4,
										},
										pattern: {
											message: 'Invalid character',
											value: /^[A-Za-z0-9_]+$/,
										},
									})}
									className="w-full rounded border border-white bg-transparent px-4 py-3"
									placeholder="Room name"
									type="text"
								/>
								{errors.name && (
									<span className="text-xs text-red-600">
										{errors.name.message}
									</span>
								)}
							</fieldset>

							<fieldset className="flex flex-col space-y-8">
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

								<label className="flex w-full items-center space-x-2">
									<input
										{...register('type')}
										className="peer accent-primary-fushia"
										id={ChatRoomType.PROTECTED}
										type="radio"
										value={ChatRoomType.PROTECTED}
									/>
									<div className="w-full space-x-2 text-white peer-checked:text-primary-fushia">
										<span>Protected</span>
										<input
											disabled={roomType !== ChatRoomType.PROTECTED}
											{...register('password', {
												required: roomType === ChatRoomType.PROTECTED,
											})}
											className=" w-1/2 rounded border border-primary-fushia bg-transparent px-2 py-1 text-white disabled:border-white"
											type="password"
										/>
									</div>
								</label>
							</fieldset>

							<input
								className=" mx-auto w-1/2 rounded border border-white py-3 text-white mix-blend-lighten hover:bg-white hover:text-black"
								type="submit"
								value={'Create'}
							/>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function RoomsModal({ closeModal }: { closeModal: () => void }) {
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)

	const [rooms, setRooms] = useState<ChatRoomSearchInfo[]>([])
	const [createRoom, setCreateRoom] = useState(false)

	const [showPasswordField, setShowPassowordField] = useState(-1)

	const { handleSubmit, register } = useForm()

	const { refreshRooms } = useFriends()

	function searchRoom(search: string) {
		setLoading(true)
		api.get(`/chat/rooms/search?room-name=${search}`).then((result) => {
			setRooms(result.data)
			setLoading(false)
		})
	}

	useEffect(() => {
		searchRoom(search)
	}, [search])

	function onSubmit(data: any) {
		console.log('asdasd')
		console.log(data)
		joinRoom(data.roomId, data.password)
		setShowPassowordField(-1)
	}

	function joinRoom(id: number, password: string | undefined) {
		console.log(password)

		const roomInfo: JoinRoomDTO = {
			password,
			roomId: parseInt(id),
		}

		try {
			api
				.post('/chat/join-room', roomInfo)
				.then((data) => {
					console.log(data)
					searchRoom('')
					refreshRooms()
				})
				.catch((e) => {
					console.log(e)
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			{createRoom && <CreateRoom closeModal={() => setCreateRoom(false)} />}

			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center gap-8">
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
								className="flex aspect-square w-12 place-content-center items-center rounded-r border border-white text-white mix-blend-lighten hover:bg-white hover:text-black"
								onClick={() => setCreateRoom(true)}
							>
								<AiOutlinePlus size={24} />
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

							{loading ? (
								<div> Loading... </div>
							) : rooms.length === 0 ? (
								<div> No one </div>
							) : (
								<div className="flex h-full flex-col space-y-2 overflow-auto scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
									{rooms.map((room) => {
										return (
											<div
												className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
												key={room.id}
											>
												<div className="flex space-x-6">
													<span className="text-xl">{room.name}</span>
												</div>
												<div className="flex items-center space-x-2">
													{room.protected ? (
														<>
															<div>
																<BiLockAlt size={24} />
															</div>
															<form
																className="space-x-2"
																onSubmit={handleSubmit(onSubmit)}
															>
																<input
																	className={`${
																		showPasswordField === room.id
																			? 'w-40 border border-white px-3 py-1'
																			: 'w-0'
																	} rounded  bg-transparent text-white transition-all duration-300 `}
																	{...register('password', { required: true })}
																	placeholder="Password"
																	type="password"
																/>
																<input
																	className="hidden"
																	type="number"
																	value={room.id}
																	{...register('roomId')}
																/>
																{showPasswordField === room.id && (
																	<input
																		className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
																		type="submit"
																		value={'Join'}
																	></input>
																)}
															</form>
															{showPasswordField !== room.id && (
																<button
																	className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
																	onClick={() => setShowPassowordField(room.id)}
																>
																	Join
																</button>
															)}
														</>
													) : (
														<button
															className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
															onClick={() => joinRoom(room.id, undefined)}
														>
															Join
														</button>
													)}
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
