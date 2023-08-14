'use client'

import { api } from '@/api/api'
import { Friend, SearchUserInfo } from '@/common/types'
import { FriendshipStatus } from '@/common/types/backend/friendship-status.enum'
import { removeParams } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MdOutlineBlock, MdOutlineClear, MdOutlineDone } from 'react-icons/md'

export default function FriendsModal({
	addFriend,
	closeModal,
}: {
	addFriend: (user: Friend) => void
	closeModal: () => void
}) {
	const [search, setSearch] = useState('')
	const [requests, setRequests] = useState<Friend[]>([])
	const [requestsLoading, setRequestsLoading] = useState(true)
	const [searchLoading, setSearchLoading] = useState(true)
	const [searchUsers, setSearchUsers] = useState<SearchUserInfo[]>([])

	function cancel(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		friendshipId: number
	) {
		e.preventDefault()
		e.stopPropagation()

		try {
			setRequests((prevReq) =>
				prevReq.filter((prevReq) => prevReq.friendship_id !== friendshipId)
			)

			api
				.patch(`/friendships/${friendshipId}/update`, {
					newStatus: FriendshipStatus.UNFRIEND,
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function accept(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		friendship_id: number
	) {
		e.preventDefault()
		e.stopPropagation()

		try {
			api
				.patch(`/friendships/${friendship_id}/update`, {
					newStatus: FriendshipStatus.ACCEPTED,
				})
				.then(() => {
					addFriend(
						requests.filter((req) => req.friendship_id === friendship_id)[0]
					)
					setRequests((prevReq) =>
						prevReq.filter((prevReq) => prevReq.friendship_id !== friendship_id)
					)
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function decline(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		friendship_id: number
	) {
		e.preventDefault()
		e.stopPropagation()

		try {
			setRequests((prevReq) =>
				prevReq.filter((prevReq) => prevReq.friendship_id != friendship_id)
			)

			api.patch(`/friendships/${friendship_id}/update`, {
				newStatus: FriendshipStatus.DECLINED,
			})
		} catch (error) {
			toast.error(error)
		}
	}

	function block(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		userId: number
	) {
		e.preventDefault()
		e.stopPropagation()

		try {
			setRequests((prevReq) =>
				prevReq.filter((prevReq) => prevReq.uid != userId)
			)

			api.post(`/friendships/block/${userId}`)
		} catch (error) {
			toast.error(error)
		}
	}

	function sendFriendRequest(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		userId: number
	) {
		e.preventDefault()
		e.stopPropagation()

		try {
			setRequests((prevReq) =>
				prevReq.filter((prevReq) => prevReq.uid != userId)
			)

			api
				.post(`/friendships/send-request/${userId}`)
				.then((result) => console.log(result))
				.catch((error) => console.error(error))
		} catch (error) {
			toast.error(error)
		}
	}

	useEffect(() => {
		setRequestsLoading(true)

		try {
			api
				.get(`/me/friend-request`)
				.then((result) => {
					console.log(result.data)
					setRequests(result.data)
				})
				.catch((error) => console.error(error))
				.finally(() => setRequestsLoading(false))
		} catch (error) {
			toast.error(error)
		}
	}, [])

	useEffect(() => {
		setSearchLoading(true)

		try {
			api
			api
				.get(`/users/search?username=${search}`)
				.then((result) => {
					console.log(result.data)
					setSearchUsers(result.data)
				})
				.catch((error) => console.error(error))
				.finally(() => setSearchLoading(false))
		} catch (error) {
			toast.error(error)
		}
	}, [search])

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32 ">
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

						<div className="mt-8 h-56 space-y-3 overflow-auto border-none ">
							{!!search ? (
								<>
									<div className="mb-4">
										Searching for &quot;
										<span className="text-[#FB37FF]">{search}</span>
										&quot;
									</div>

									{searchLoading ? (
										<div> Loading... </div>
									) : searchUsers && searchUsers.length === 0 ? (
										<div> No one </div>
									) : (
										<>
											{searchUsers.map((user) => {
												return (
													<Link
														className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
														href={`/profile?id=${user.id}`}
														key={user.id}
													>
														<div className="flex space-x-6">
															<Image
																alt="profile picture"
																className="aspect-square w-8 rounded"
																height={0}
																loader={removeParams}
																sizes="100%"
																src={user.avatar_url || '/placeholder.gif'}
																width={0}
															/>
															<span className="text-xl">{user.name}</span>{' '}
														</div>
														<button
															className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
															onClick={(e) => sendFriendRequest(e, user.id)}
														>
															Add friend
														</button>
													</Link>
												)
											})}
										</>
									)}
								</>
							) : (
								<>
									<div>Friend requests</div>
									{requestsLoading ? (
										<div>Loading ...</div>
									) : requests.length === 0 ? (
										<div className="relative mx-auto h-48 w-64 overflow-hidden rounded">
											<Image
												alt="no requests"
												className="mx-auto"
												fill
												height={0}
												sizes="100vw"
												src="/norequests.jpg"
												width={0}
											/>
										</div>
									) : (
										requests?.map((request) => (
											<Link
												className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
												href={`/profile?id=${request?.uid}`}
												key={request?.uid}
											>
												<div className="flex space-x-6">
													<Image
														alt="profile picture"
														className="aspect-square w-8 rounded"
														height={0}
														loader={removeParams}
														sizes="100vw"
														src={request?.avatar_url || '/placeholder.gif'}
														width={0}
													/>
													<span className="text-xl">{request?.name}</span>
												</div>
												<div className="flex space-x-2">
													{request?.sent_by_me ? (
														<button
															className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
															onClick={(e) => cancel(e, request?.friendship_id)}
														>
															Cancel
														</button>
													) : (
														<>
															<button
																onClick={(e) =>
																	accept(e, request?.friendship_id)
																}
																className="group/button flex items-center space-x-2 rounded border border-green-600 p-1 text-sm text-green-600 mix-blend-lighten hover:bg-green-600 hover:text-white"
															>
																<MdOutlineDone size={24} />
																<span className="hidden group-hover/button:flex">
																	Accept
																</span>
															</button>
															<button
																onClick={(e) =>
																	decline(e, request?.friendship_id)
																}
																className="group/button flex items-center space-x-2 rounded border border-red-600 p-1 text-sm text-red-600 mix-blend-lighten hover:bg-red-600 hover:text-white"
															>
																<MdOutlineClear size={24} />
																<span className="hidden group-hover/button:flex">
																	Decline
																</span>
															</button>
															<button
																className="group/button flex items-center space-x-2 rounded border border-white p-1 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
																onClick={(e) => block(e, request?.uid)}
															>
																<MdOutlineBlock size={24} />
																<span className="hidden group-hover/button:flex">
																	Block
																</span>
															</button>
														</>
													)}
												</div>
											</Link>
										))
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
