'use client'

import { api } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { MdOutlineBlock, MdOutlineClear, MdOutlineDone  } from "react-icons/md"
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Friend, SearchUserInfo } from '@/common/types'

export default function FriendsModal({ addFriend, closeModal }: { addFriend: (user: Friend) => void, closeModal: () => void }) {

	const [search, setSearch] = useState('')
	const [requests, setRequests] = useState<Friend[]>([])
	const [requestsLoading, setRequestsLoading] = useState(true)
	const [searchLoading, setSearchLoading] = useState(true)
	const [searchUsers, setSearchUsers] = useState<SearchUserInfo[]>([])

	function accept(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, friendship_id: number) {
		e.preventDefault()
		e.stopPropagation()

		api.patch(`/friendships/${friendship_id}/update`, {
			newStatus: "accepted"	
		}).then(() => {
			addFriend(requests.filter(req => req.friendship_id === friendship_id)[0])
			setRequests(prevReq => prevReq.filter(prevReq => prevReq.friendship_id !== friendship_id))
		})
	}

	function decline(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, friendship_id: number) {
		e.preventDefault()
		e.stopPropagation()

		setRequests(prevReq => prevReq.filter(prevReq => prevReq.friendship_id != friendship_id))

		api.patch(`/friendships/${friendship_id}/update`, {
			newStatus: "declined"	
		})
	}

	function block(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, userId: number) {
		e.preventDefault()
		e.stopPropagation()

		setRequests(prevReq => prevReq.filter(prevReq => prevReq.uid != userId))

		api.post(`/friendships/block/${userId}`)
	}

	function sendFriendRequest(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, userId: number) {
		e.preventDefault()
		e.stopPropagation()

		setRequests(prevReq => prevReq.filter(prevReq => prevReq.uid != userId))

		api.post(`/friendships/send-request/${userId}`)
			.then(result => console.log(result))
			.catch(error => console.error(error))
	}

	useEffect(() => {
		setRequestsLoading(true)
		api.get(`/me/friend-request`)
		.then(result => {
			console.log(result.data)
			setRequests(result.data)
		})
		.catch(error => console.error(error))
		.finally(() => setRequestsLoading(false))		

	}, [])

	useEffect(() => {
		setSearchLoading(true)
		api.get(`/users/search?username=${search}`)
		.then(result => {
			console.log(result.data)
			setSearchUsers(result.data)
		})
		.catch(error => console.error(error))
		.finally(() => setSearchLoading(false))		

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

						<div className="mt-8 h-56 space-y-3 overflow-scroll border-none ">
							{!!search ? (
								<>
									<div className="mb-4">
										Searching for &quot;
										<span className="text-[#FB37FF]">{search}</span>
										&quot;
									</div>

        							{ searchLoading ?
										<div> Loading... </div>
									: searchUsers && searchUsers.length === 0 ?
										<div> No one </div>
									:
									<>
										{ searchUsers.map(user => {
											return (
											<Link key={user.id}
												className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
												href={`/profile?id=${user.id}`}
											>
												<div className="flex space-x-6">
													<Image
														loader={removeParams}
														alt="profile picture"
														src={user.avatar_url || "/placeholder.jpg"}
														className="aspect-square w-8 rounded"
														height={0}
														width={0}
														sizes="100%"
													/>
													<span className="text-xl">{user.name}</span> </div>
												<button onClick={(e) => sendFriendRequest(e,user.id)} className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black">
													Add friend
												</button>
											</Link>
										)})}
									</>
									}
								</>
							) : (
								<>
									<div>Friend requests</div>
									{
										requestsLoading ? 
											<div>Loading ...</div>
										: requests.length === 0 ?
											<div className='mx-auto rounded overflow-hidden w-64 relative h-48'>
												<Image 
													className="mx-auto"
													src='/norequests.jpg'
													alt='no requests'
													width={0}
													height={0}
													fill
													sizes="100vw"
												/>
											</div>

										: requests?.map(request =>
												<Link 
													key={request?.uid}
													className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
													href={`/profile?id=${request?.uid}`}
												>
													<div className="flex space-x-6">
														<Image
															loader={removeParams}
															alt="profile picture"
															className="aspect-square w-8 rounded"
															height={0}
															sizes="100%"
															src={request?.avatar_url || "/placeholder.jpg"}
															width={0}
														/>
														<span className="text-xl">{request?.name}</span>
													</div>
													<div className='flex space-x-2'>
														<button onClick={(e) => accept(e, request?.friendship_id)} className="flex group/button space-x-2 items-center rounded border border-green-600 p-1 text-sm text-green-600 mix-blend-lighten hover:bg-green-600 hover:text-white">
															<MdOutlineDone size={24}/>
															<span className='group-hover/button:flex hidden'>Accept</span>
														</button>
														<button onClick={(e) => decline(e, request?.friendship_id)} className="flex group/button space-x-2 items-center rounded border border-red-600 p-1 text-sm text-red-600 mix-blend-lighten hover:bg-red-600 hover:text-white">
															<MdOutlineClear size={24}/>
															<span className='group-hover/button:flex hidden'>Decline</span>
														</button>
														<button onClick={(e) => block(e, request?.uid)} className="flex group/button space-x-2 items-center rounded border border-white p-1 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black">
															<MdOutlineBlock size={24}/>
															<span className='group-hover/button:flex hidden'>Block</span>
														</button>

													</div>
												</Link>
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

