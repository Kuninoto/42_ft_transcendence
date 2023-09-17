'use client'

import { api } from '@/api/api'
import { FriendRequest, FriendshipStatus, UserSearchInfo } from '@/common/types'
import { removeParams } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import { BiRefresh } from 'react-icons/bi'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, forwardRef, useRef, useImperativeHandle  } from 'react'
import { MdOutlineBlock, MdOutlineClear, MdOutlineDone } from 'react-icons/md'
import { toast } from 'react-toastify'

interface InfoOrRequest {
	blocked_by_me: bool
	friendship_id: null | number
	sent_by_me: boolean | null
	status: null | string
	uid: number
}

function Buttons({
	refresh,
	request,
	resetSearch,
}: {
	refresh: () => void
	request: FriendRequest | UserSearchInfo
	resetSearch?: () => void
}) {
	const isRequest = 'uid' in request

	const { refreshFriends } = useFriends()

	const friend: InfoOrRequest = {
		blocked_by_me: isRequest ? false : request.blocked_by_me,
		friendship_id: request?.friendship_id,
		sent_by_me: isRequest
			? request.sent_by_me
			: request.friend_request_sent_by_me,
		status: isRequest ? request.status : request.friendship_status,
		uid: isRequest ? request.uid : request.id,
	}

	async function basis(
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		callable: any
	) {
		e.preventDefault()
		e.stopPropagation()
		try {
			() => callable()
		} catch (error) {}
	}

	async function removeFriendship(friendshipId: null | number) {
			await api
				.patch(`/friendships/${friendshipId}/status`, {
					newStatus: FriendshipStatus.UNFRIEND,
				})
				.catch(() => {
					throw 'Network error'
				})
				.finally(() => refresh())

	}

	async function cancel(friendshipId: null | number) {
		await api
			.patch(`/friendships/${friendshipId}/status`, {
				newStatus: FriendshipStatus.CANCEL,
			})
			.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	function accept(friendshipId: null | number) {
		api
			.patch(`/friendships/${friendshipId}/status`, {
				newStatus: FriendshipStatus.ACCEPTED,
			})
			.then(() => {
				refreshFriends()
			})
			.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	function decline(friendshipId: null | number) {
		api
			.patch(`/friendships/${friendshipId}/status`, {
				newStatus: FriendshipStatus.DECLINED,
			})
			.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	function block(userId: number) {
		api.post(`/friendships/block/${userId}`)
			.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	function unblock(userId: number) {
		api.delete(`/friendships/block/${userId}`)
			.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	function sendFriendRequest(userId: number) {
		api.post(`/friendships/send-request/${userId}`)
		.then(() => {
			resetSearch!()
		})
		.catch((error:any) => toast.error(error.response.data.message))
			.finally(() => refresh())
	}

	if (friend.blocked_by_me) {
		return (
			<button
				className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
				onClick={(e) => basis(e, unblock(friend?.uid))}
			>
				Unblock
			</button>
		)
	}

	if (friend.status === FriendshipStatus.ACCEPTED) {
		return (
			<div className="flex space-x-2">
				<button
					className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
					onClick={() => removeFriendship(friend?.friendship_id)}
				>
					Remove
				</button>
				<button
						className="rounded border border-white p-1 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
						onClick={(e) => basis(e, block(friend?.uid))}
					>
						<MdOutlineBlock size={24} />
					</button>
			</div>
			
		)
	}
	

	if (friend.status === FriendshipStatus.PENDING) {
		if (friend.sent_by_me) {
			return (
				<button
					className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
					onClick={(e) => basis(e, cancel(friend?.friendship_id))}
				>
					Cancel
				</button>
			)
		}

		return (
			<div className="flex space-x-2">
				<button
					className="group/button flex items-center space-x-2 rounded border border-green-600 p-1 text-sm text-green-600 mix-blend-lighten hover:bg-green-600 hover:text-white"
					onClick={(e) => basis(e, accept(friend?.friendship_id))}
				>
					<MdOutlineDone size={24} />
					<span className="hidden group-hover/button:flex">Accept</span>
				</button>
				<button
					className="group/button flex items-center space-x-2 rounded border border-red-600 p-1 text-sm text-red-600 mix-blend-lighten hover:bg-red-600 hover:text-white"
					onClick={(e) => basis(e, decline(friend?.friendship_id))}
				>
					<MdOutlineClear size={24} />
					<span className="hidden group-hover/button:flex">Decline</span>
				</button>
				<button
						className="group/button flex items-center space-x-2 rounded border border-white p-1 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
						onClick={(e) => basis(e, block(friend?.uid))}
					>
					<MdOutlineBlock size={24} />
					<span className="hidden group-hover/button:flex">Block</span>
				</button>
			</div>
		)
	}

	return (
		<button
			className="rounded border border-white p-1 px-4 text-sm text-white mix-blend-lighten hover:bg-white hover:text-black"
			onClick={(e) => basis(e, sendFriendRequest(friend?.uid))}
		>
			Add friend
		</button>
	)
}

const FriendRequests = forwardRef(function (props, ref) {
	const [requests, setRequests] = useState<FriendRequest[]>([])
	const [loading, setLoading] = useState(true)

	useImperativeHandle(ref, () => ({


	async refreshFriendRequest() {
		try {
			await api
				.get(`/me/friend-requests`)
				.then((result) => {
					setRequests(result.data)
				})
				.catch((error) => console.error(error))
				.finally(() => setLoading(false))
		} catch (error: any) {
			toast.error(error)
		}
	}
	}))

	async function getFriendRequests() {
		try {
			await api
				.get(`/me/friend-requests`)
				.then((result) => {
					setRequests(result.data)
				})
				.catch((error) => console.error(error))
				.finally(() => setLoading(false))
		} catch (error: any) {
			toast.error(error)
		}
	}

	useEffect(() => {
		setLoading(true)
		getFriendRequests()
	}, [])

	return (
		<>
			<div>Friend requests</div>
			{loading ? (
				<div>Loading ...</div>
			) : requests.length === 0 ? (
				<div className="relative mx-auto h-48 w-64 overflow-hidden rounded">
					<Image
						alt="no requests"
						className="mx-auto"
						fill
						sizes="100%"
						src="/norequests.jpg"
					/>
				</div>
			) : (
				requests.map((request) => (
					<Link
						className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
						href={`/profile?id=${request.uid}`}
						key={request.uid}
					>
						<div className="flex space-x-6">
							<div className="relative aspect-square w-8 rounded">
								<Image
									alt="profile picture"
									className="object-cover"
									fill
									loader={removeParams}
									sizes="100%"
									src={request?.avatar_url || '/placeholder.gif'}
									unoptimized
								/>
							</div>
							<span className="text-xl">{request.name}</span>
						</div>
						<div className="flex space-x-2">
							<Buttons refresh={getFriendRequests} request={request} />
						</div>
					</Link>
				))
			)}
		</>
	)
})

function FriendSearch({
	loading,
	resetSearch,
	search,
	searchFriend,
	users,
}: {
	loading: boolean
	resetSearch: () => void
	search: string
	searchFriend: () => void
	users: UserSearchInfo[]
}) {
	return (
		<>
			<div className="mb-4">
				Searching for &quot;
				<span className="text-[#FB37FF]">{search}</span>
				&quot;
			</div>

			{loading ? (
				<div> Loading... </div>
			) : users && users.length === 0 ? (
				<div> No one </div>
			) : (
				<>
					{users.map((user) => {
						return (
							<Link
								className="flex place-content-between items-center rounded border border-white/50 px-4 py-2 text-white/50 hover:border-white hover:text-white"
								href={`/profile?id=${user.id}`}
								key={user.id}
							>
								<div className="flex space-x-6">
									<div className="relative aspect-square w-8 rounded">
										<Image
											alt="profile picture"
											className="object-cover"
											fill
											loader={removeParams}
											sizes="100%"
											src={user.avatar_url || '/placeholder.gif'}
											unoptimized
										/>
									</div>
									<span className="text-xl">{user.name}</span>{' '}
								</div>

								<Buttons
									refresh={searchFriend}
									request={user}
									resetSearch={resetSearch}
								/>
							</Link>
						)
					})}
				</>
			)}
		</>
	)
}

export default function FriendsModal({
	closeModal,
}: {
	closeModal: () => void
}) {
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [users, setUsers] = useState<[] | UserSearchInfo[]>([])

	const childRef = useRef(null)

	function searchFriend() {
		try {
			api
				.get(`/users/search?username=${search}`)
				.then((result) => {
					setUsers(result.data)
				})
				.catch((error) => console.error(error))
				.finally(() => setLoading(false))
		} catch (error: any) {
			toast.error(error)
		}
	}

	useEffect(() => {
		setLoading(true)
		searchFriend()
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
						<div className="flex items-center space-x-1">
							<input
								className="w-[30rem] rounded-l border border-white bg-transparent p-2 pl-4 text-xl outline-none ring-0"
								maxLength={18}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search"
								type="text"
								value={search}
							/>
							<button className="rounded-r border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
								onClick={() => childRef.current.refreshFriendRequest()}>
								<BiRefresh size={28}/>
							</button>
						</div>

						<div className="mt-8 h-56 space-y-3 overflow-auto border-none ">
							{!!search ? (
								<FriendSearch
									loading={loading}
									resetSearch={() => setSearch('')}
									search={search}
									searchFriend={searchFriend}
									users={users}
								/>
							) : (
								<FriendRequests ref={childRef}/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
