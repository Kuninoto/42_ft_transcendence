'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AiOutlineUserAdd } from 'react-icons/ai'
import { BiUser } from 'react-icons/bi'
import { LuSwords } from 'react-icons/lu'
import { RxTriangleUp } from 'react-icons/rx'

import FriendsModal from './friendsModal'

export default function FriendsList(): JSX.Element {
	const { user } = useAuth()

	const [openModal, setOpenModal] = useState(false)
	const [openGroupsAccordean, setOpenGroupsAccordean] = useState(true)
	const [openFriendsAccordean, setOpenFriendsAccordean] = useState(true)

	const { open } = useChat()

	return (
		<div className="flex h-full w-full">
			{openModal && <FriendsModal closeModal={() => setOpenModal(false)} />}

			<div className="flex w-full flex-col px-4 py-2">
				<div className="flex flex-col">
					<div className="flex w-full rounded-t-md px-4 py-2">
						<div className="relative aspect-square w-12">
							<Image
								alt={'avatar'}
								className="aspect-square rounded-full"
								height={0}
								layout="fill"
								objectFit="cover"
								src={user.avatar_url || '/placeholder.jpg'}
								width={0}
							/>
						</div>
						<div className="mx-4 my-auto">
							<div className="text-xl">{user.name}</div>
							<div>rank wins</div>
						</div>
					</div>
				</div>

				<div className="my-2">
					<>
						<div
							className="my-2 flex w-full hover:cursor-pointer place-content-between border-b border-white px-4 py-1 text-start"
							onClick={() => setOpenFriendsAccordean(!openFriendsAccordean)}
						>
							Friends
							<div className="flex">
								<button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										setOpenModal(true)
									}}
								>
									<AiOutlineUserAdd className="" size={24} />
								</button>
								<RxTriangleUp
									className={`transition-all duration-200
									${openFriendsAccordean && '-rotate-180'}`}
									size={24}
								/>
							</div>
						</div>
						<div
							className={`flex flex-col space-y-2 transition-all
							${openFriendsAccordean ? 'max-h-full' : 'max-h-0'} overflow-hidden`}
						>
							{ user?.friends?.map(friend => 
								<div 
								key={friend.friend_uid}
								className="roundend group relative flex rounded border border-white py-2">
									<Link className="flex w-full place-content-around" href={'/'}>
										<div>{friend.friend_name}</div>
										<div className="visible group-hover:invisible">wins</div>
									</Link>
									<div className="invisible absolute right-4 flex group-hover:visible">
										<Link className="hover:text-pink-400" href={`/profile?id=${friend.friend_uid}`}>
											<BiUser size={24} />
										</Link>
										<button className="hover:text-pink-400">
											<LuSwords size={24} />
										</button>
									</div>
								</div>
							)}
						</div>
					</>
					<>
						<button
							className="my-2 flex w-full place-content-between border-b border-white px-4 py-1 text-start"
							onClick={() => setOpenGroupsAccordean(!openGroupsAccordean)}
						>
							Groups
							<RxTriangleUp
								className={`transition-all duration-200 ${
									openGroupsAccordean && '-rotate-180'
								}`}
								size={24}
							/>
						</button>
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
