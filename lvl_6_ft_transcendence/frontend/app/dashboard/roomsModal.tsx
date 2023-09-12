'use client'

import { api } from '@/api/api'
import {
	ChatRoomSearchInfo,
	ChatRoomType,
	CreateRoomRequest,
	JoinRoomRequest,
} from '@/common/types'
import { useFriends } from '@/contexts/FriendsContext'
import md5 from 'md5'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AiOutlinePlus } from 'react-icons/ai'
import { BiLockAlt } from 'react-icons/bi'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
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
	const [showPassword, setShowPassword] = useState(false)

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
		if (type === ChatRoomType.PROTECTED) {
			if (password.length < 4 || password.length > 20) {
				setError('name', {
					message: 'Passwords must be 4-20 characters long',
					type: 'alreadyInUser',
				})
				return
			}

			if (!password.match('^[a-zA-Z0-9!@#$%^&*()_+{}:;<>,.?~=/\\|-]+$')) {
				setError('name', {
					message: 'Invalid character',
					type: 'invalid',
				})
				return
			}

			if (password === '1234') {
				toast.error('1234? Really?')
				return
			}
		}

		const newRoom: CreateRoomRequest = {
			name,
			password: type === ChatRoomType.PROTECTED ? md5(password) : undefined,
			type,
		}

		try {
			api
				.post('/chat/rooms/create', newRoom)
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
							<fieldset className="flex w-full flex-col">
								<input
									{...register('name', {
										maxLength: {
											message: 'Room names must have up to 10 characters long ',
											value: 10,
										},
										minLength: {
											message: 'Room names must be at least 4 characters long',
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
									<span className="mt-4 text-xs text-red-600">
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
									<span className="text-gray-400 peer-checked:text-primary-fushia">
										Public
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
									<span className="text-gray-400 peer-checked:text-primary-fushia">
										Private (Invite only)
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
									<div className="flex w-full items-center space-x-2 text-gray-400 peer-checked:text-primary-fushia">
										<span>Protected</span>
										<fieldset className="relative flex w-1/2 items-center">
											<input
												disabled={roomType !== ChatRoomType.PROTECTED}
												{...register('password', {
													required: roomType === ChatRoomType.PROTECTED,
												})}
												className="w-full rounded border border-primary-fushia bg-transparent p-2 text-white outline-none ring-0 focus:border-primary-fushia disabled:border-white"
												placeholder="Password"
												type={showPassword ? 'text' : 'password'}
											/>
											<button
												className={`absolute right-2
													${roomType !== ChatRoomType.PROTECTED ? 'text-gray-400' : 'text-white'}`}
												disabled={roomType !== ChatRoomType.PROTECTED}
												onClick={() => setShowPassword(!showPassword)}
												type="button"
											>
												{showPassword ? <FaEyeSlash /> : <FaEye />}
											</button>
										</fieldset>
									</div>
								</label>
							</fieldset>

							<input
								className="mx-auto w-1/2 rounded border border-white py-3 text-white mix-blend-lighten hover:bg-white hover:text-black"
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
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(-1)

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

	function joinRoom(id: number, needPassword: boolean) {
		if (password) {
			setShowPassowordField(-1)
			setPassword('')
		}

		if (needPassword && !password.length) return

		const roomInfo: JoinRoomRequest = {
			password: needPassword ? md5(password) : null,
		}

		api
			.post(`/chat/${id}/join`, roomInfo)
			.then(() => {
				refreshRooms()
				searchRoom('')
			})
			.catch(() => {
				toast('Wrong password')
			})
	}

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			{createRoom && (
				<CreateRoom
					closeModal={() => {
						setCreateRoom(false)
						closeModal()
					}}
				/>
			)}

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
						<div className="mt-8 h-56 space-y-3 border-none ">
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
								<div> No room was found </div>
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
															<fieldset className="relative flex items-center">
																<input
																	className={`${
																		showPasswordField === room.id
																			? 'w-52 border border-white px-3 py-1'
																			: 'w-0'
																	} peer rounded bg-transparent text-white transition-all duration-300 `}
																	type={
																		showPassword === room.id
																			? 'text'
																			: 'password'
																	}
																	onChange={(e) => setPassword(e.target.value)}
																	placeholder="password"
																	required
																	value={password}
																/>

																<button
																	className={`absolute right-2 text-gray-400 peer-hover:text-white peer-focus:text-white hover:text-white ${
																		showPasswordField !== room.id && 'invisible'
																	}`}
																	onClick={() =>
																		setShowPassword((prevPass) =>
																			prevPass === -1 || prevPass !== room.id
																				? room.id
																				: -1
																		)
																	}
																	type="button"
																>
																	{showPassword === room.id ? (
																		<FaEyeSlash />
																	) : (
																		<FaEye />
																	)}
																</button>
															</fieldset>
															<button
																onClick={() => {
																	if (showPasswordField === room.id) {
																		joinRoom(room.id, true)
																	} else {
																		setPassword('')
																		setShowPassowordField(room.id)
																	}
																}}
																className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
															>
																Join
															</button>
														</>
													) : (
														<button
															className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
															onClick={() => joinRoom(room.id, false)}
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
