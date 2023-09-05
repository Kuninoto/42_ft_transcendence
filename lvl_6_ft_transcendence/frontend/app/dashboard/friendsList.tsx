'use client'

import { api } from '@/api/api'
import { ChatRoomInterface, PossibleInvitesRequest } from '@/common/types'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import Tippy from '@tippyjs/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AiOutlineUserAdd, AiOutlineUsergroupAdd } from 'react-icons/ai'
import { BiUser } from 'react-icons/bi'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import { LuSwords } from 'react-icons/lu'
import { RxTriangleUp } from 'react-icons/rx'
import { toast } from 'react-toastify'

import FriendsModal from './friendsModal'
import RoomsModal from './roomsModal'

enum openModalType {
	FRIENDS = 'friends',
	GROUPS = 'groups',
	NULL = '',
}

function RoomsInvite({
	id,
	rooms,
}: {
	id: number
	rooms: ChatRoomInterface[]
}) {
	useEffect(() => {})

	if (rooms.length === 0) return <></>

	return (
		<div className="flex flex-col divide-y divide-white rounded border border-white bg-gradient-to-tr from-black via-[#170317] via-40% to-[#0E050E] to-80% text-xs">
			{rooms.map((room) => {
				return <div key={room.id}>{room.name}</div>
			})}
		</div>
	)
}

export default function FriendsList(): JSX.Element {
	const { user } = useAuth()
	const {
		exitRoom,
		friends,
		newFriendNotification,
		rooms,
		seeNewFriendNotification,
	} = useFriends()

	const [openModal, setOpenModal] = useState(openModalType.NULL)
	const [openGroupsAccordean, setOpenGroupsAccordean] = useState(true)
	const [openFriendsAccordean, setOpenFriendsAccordean] = useState(true)
	const [inviteRooms, setInviteRooms] = useState<ChatRoomInterface[]>([])

	const { open, sendGameInvite } = useFriends()

	function openInviteRooms(id: number) {
		console.log('incrivel')
		try {
			api
				.get(`/chat/possible-invites?friendId=${id}`)
				.then((result) => {
					console.log(result.data)
					setInviteRooms(result.data)
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	function leaveRoom(roomId: number) {
		api
			.post('/chat/leave-room', {
				roomId: parseInt(roomId),
				userId: parseInt(user.id),
			})
			.then(() => {
				exitRoom(roomId)
			})
	}

	return (
		<div className="flex h-full w-full">
			{openModal === openModalType.FRIENDS ? (
				<FriendsModal closeModal={() => setOpenModal(openModalType.NULL)} />
			) : (
				openModal === openModalType.GROUPS && (
					<RoomsModal closeModal={() => setOpenModal(openModalType.NULL)} />
				)
			)}

			<div className="flex w-full flex-col px-4 py-2">
				<div className="flex items-center">
					<div className="flex w-full rounded-t-md px-4 py-2">
						<div className="relative aspect-square w-16 overflow-hidden rounded">
							<Image
								alt={'avatar'}
								className="object-cover"
								fill
								loader={removeParams}
								sizes="100vw"
								src={user.avatar_url || '/placeholder.gif'}
								unoptimized
							/>
						</div>
						<div className="mx-4 my-auto">
							<div className="text-xl">{user?.name}</div>
							<a
								className="text-sm text-gray-400 hover:underline"
								href={user?.intra_profile_url}
								target="_blank"
							>
								{user?.intra_name}
							</a>
						</div>
					</div>
					<div className="text-2xl">#{user.ladder_level} </div>
				</div>

				<div className="my-2 space-y-2">
					<>
						<div className="flex items-center space-x-2 border-b border-white p-2">
							<button
								onClick={() => {
									seeNewFriendNotification()
									setOpenModal(openModalType.FRIENDS)
								}}
							>
								<div className="relative">
									<AiOutlineUserAdd
										className="text-white hover:text-primary-fushia"
										size={24}
									/>
									{newFriendNotification && (
										<div className="absolute -bottom-1 -left-0.5 flex h-full items-center group-hover:hidden">
											<span className="relative my-auto flex h-3 w-3">
												<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-shoque opacity-75"></span>
												<span className="relative inline-flex h-3 w-3 rounded-full bg-primary-fushia"></span>
											</span>
										</div>
									)}
								</div>
							</button>
							<div
								className="group flex w-full place-content-between text-start transition-all duration-200 hover:cursor-pointer hover:text-[#F32E7C]"
								onClick={() => setOpenFriendsAccordean(!openFriendsAccordean)}
							>
								Friends
								<div className="flex">
									<RxTriangleUp
										className={`transition-all duration-200 group-hover:text-primary-fushia
									${openFriendsAccordean && '-rotate-180'}`}
										size={24}
									/>
								</div>
							</div>
						</div>
						<div
							className={`flex flex-col space-y-2 transition-all
							${openFriendsAccordean ? 'max-h-full' : 'max-h-0'} overflow-hidden`}
						>
							{friends?.map((friend) => (
								<div
									className="roundend group relative flex items-center rounded border border-white py-2"
									key={friend.uid}
								>
									<button
										className="flex w-full place-content-between items-center px-4"
										onClick={() => open(friend.uid, false)}
									>
										<div className="flex items-center space-x-4">
											<div className="relative aspect-square w-8 overflow-hidden rounded-sm">
												<Image
													alt={'avatar'}
													className="object-cover"
													fill
													loader={removeParams}
													sizes="100vw"
													src={friend.avatar_url || '/placeholder.gif'}
												/>
											</div>
											<div> {friend.name} </div>
										</div>
										<div className="visible group-hover:invisible">
											{friend.status}
										</div>
									</button>
									<div className="invisible absolute right-4 my-auto flex group-hover:visible">
										<Link
											className="hover:text-[#F32E7C]"
											href={`/profile?id=${friend.uid}`}
										>
											<BiUser size={24} />
										</Link>
										<Tippy
											content={
												<RoomsInvite id={friend.uid} rooms={inviteRooms} />
											}
											hideOnClick
											interactive
											placement={'left'}
											trigger={'click'}
										>
											<button
												className="hover:text-[#F32E7C]"
												onClick={() => openInviteRooms(friend.uid)}
											>
												<HiOutlineChatAlt2 size={24} />
											</button>
										</Tippy>
										<button
											className="hover:text-[#F32E7C]"
											onClick={() => sendGameInvite(friend.uid.toString())}
										>
											<LuSwords size={24} />
										</button>
									</div>
								</div>
							))}
						</div>
					</>
					<>
						<div className="flex items-center space-x-2 border-b border-white p-2">
							<button
								onClick={() => {
									setOpenModal(openModalType.GROUPS)
								}}
							>
								<AiOutlineUsergroupAdd
									className="aspect-square text-white hover:text-[#F32E7C]"
									size={24}
								/>
							</button>
							<div
								className="group flex h-full w-full place-content-between text-start transition-all duration-200 hover:cursor-pointer hover:text-[#F32E7C]"
								onClick={() => setOpenGroupsAccordean(!openGroupsAccordean)}
							>
								Groups
								<div className="flex">
									<RxTriangleUp
										className={`transition-all duration-200 group-hover:text-[#F32E7C]
									${openGroupsAccordean && '-rotate-180'}`}
										size={24}
									/>
								</div>
							</div>
						</div>
						<div
							className={`flex flex-col space-y-2 overflow-hidden transition-all 
						${openGroupsAccordean ? 'max-h-full' : 'max-h-0'}`}
						>
							{rooms?.map((room) => {
								return (
									<div className="peer relative w-full" key={room.id}>
										<button
											className="w-full "
											onClick={() => open(room.id, true)}
										>
											<div className="roundend relative flex w-full place-content-between rounded border border-white px-4 py-2">
												<div>{room.name}</div>
											</div>
										</button>
										<div className="visible absolute right-4 top-2">
											<button
												className="text-xs text-gray-400 hover:text-red-500"
												onClick={() => leaveRoom(room.id)}
											>
												Exit room
											</button>
										</div>
									</div>
								)
							})}
						</div>
					</>
				</div>
			</div>
		</div>
	)
}
