'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useState } from 'react'
import { BiUser } from 'react-icons/bi'
import { LuSwords } from 'react-icons/lu'
import { CgShapeTriangle } from 'react-icons/cg'
import { useChat } from '@/contexts/ChatContext'

export default function FriendsList(): JSX.Element {
	const { user } = useAuth()

	const [openGroupsAccordean, setOpenGroupsAccordean] = useState(true)
	const [openFriendsAccordean, setOpenFriendsAccordean] = useState(true)

	const {open} = useChat()

	return (
		<div className="flex h-full w-full">
			<div className="flex w-full flex-col px-4 py-2">
				<div className="flex flex-col">
					<div className="flex w-full rounded-t-md px-4 py-2">
						<div className="aspect-square w-16 rounded-full bg-white"></div>
						<div className="mx-4 my-auto">
							<div className="text-xl">{user.name}</div>
							<div>rank wins</div>
						</div>
					</div>
				</div>

				<div className="my-8 overflow-scroll">
					<button
						className="my-2 w-full border-b border-white text-start"
						onClick={() => setOpenGroupsAccordean(!openGroupsAccordean)}
					>
						Groups
					</button>
					<div
						className={`space-y-2 flex flex-col overflow-hidden transition-all ${
							openGroupsAccordean ? 'max-h-full' : 'max-h-0'
						}`}
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

					<button
						className="my-2 w-full border-b border-white text-start"
						onClick={() => setOpenFriendsAccordean(!openFriendsAccordean)}
					>
						{' '}
						Friends{' '}
					</button>
					<div
						className={`space-y-2 flex flex-col transition-all ${
							openFriendsAccordean ? 'max-h-full' : 'max-h-0'
						} overflow-hidden`}
					>
						<div className="roundend group relative flex rounded border border-white py-2">
							<Link className="flex w-full place-content-around" href={'/'}>
								<div>friend</div>
								<div className="visible group-hover:invisible">wins</div>
							</Link>
							<div className="invisible absolute right-4 flex group-hover:visible">
								<Link className="hover:text-pink-400" href={'/'}>
									<BiUser size={24} />
								</Link>
								<button className="hover:text-pink-400">
									<LuSwords size={24} />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
