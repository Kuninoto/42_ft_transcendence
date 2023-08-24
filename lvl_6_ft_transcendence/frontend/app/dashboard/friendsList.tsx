'use client'

import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AiOutlineUserAdd, AiOutlineUsergroupAdd } from 'react-icons/ai'
import { BiUser } from 'react-icons/bi'
import { LuSwords } from 'react-icons/lu'
import { RxTriangleUp } from 'react-icons/rx'

import FriendsModal from './friendsModal'
import RoomsModal from './roomsModal'

enum openModalType {
	FRIENDS = 'friends',
	GROUPS = 'groups',
	NULL = '',
}

export default function FriendsList(): JSX.Element {
	const { user } = useAuth()
	const { friends, newFriendNotification, seeNewFriendNotification } =
		useFriends()

	const [openModal, setOpenModal] = useState(openModalType.NULL)
	const [openGroupsAccordean, setOpenGroupsAccordean] = useState(true)
	const [openFriendsAccordean, setOpenFriendsAccordean] = useState(true)

	const { open, sendGameInvite } = useFriends()

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
				<div className="flex flex-col">
					<div className="flex w-full rounded-t-md px-4 py-2">
						<div className="relative aspect-square w-16 overflow-hidden rounded">
							<Image
								alt={'avatar'}
								className="object-cover"
								fill
								loader={removeParams}
								sizes="100vw"
								src={user.avatar_url || '/placeholder.gif'}
							/>
						</div>
						<div className="mx-4 my-auto">
							<div className="text-xl">{user.name}</div>
							<div>rank wins</div>
						</div>
					</div>
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
										onClick={() => open(friend)}
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
										<button
											className="hover:text-[#F32E7C]"
											onClick={() => sendGameInvite(friend.uid)}
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
							<button className="group" onClick={open}>
								<div className="roundend relative flex w-full place-content-between rounded border border-white px-4 py-2">
									<div>friend</div>
									<div className="group-hover:invisible">members count</div>
									<div className="invisible absolute right-4 bg-red-500 group-hover:visible">
										akjgwe
									</div>
								</div>
							</button>

							<Link className="group" href={'/'}>
								<div className="roundend relative flex w-full place-content-around rounded border border-white py-2">
									<div>friend</div>
									<div className="group-hover:invisible">wins</div>
									<div className="invisible absolute right-4 bg-red-500 group-hover:visible">
										akjgwe
									</div>
								</div>
							</Link>

							<Link className="group" href={'/'}>
								<div className="roundend relative flex w-full place-content-around rounded border border-white py-2">
									<div>friend</div>
									<div className="group-hover:invisible">wins</div>
									<div className="invisible absolute right-4 bg-red-500 group-hover:visible">
										akjgwe
										<button></button>
									</div>
								</div>
							</Link>
						</div>
					</>
				</div>
			</div>
		</div>
	)
}
