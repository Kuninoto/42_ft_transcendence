'use client'

import Link from 'next/link'
import { useState } from 'react'

import { BiUser } from 'react-icons/bi'
import { LuSwords } from 'react-icons/lu'

export default function FriendsList(): JSX.Element {

	const [openGroupsAccordean, setOpenGroupsAccordean] = useState(true)
	const [openFriendsAccordean, setOpenFriendsAccordean] = useState(true)

	return (
		<div className="h-full flex w-full">
			<div className="flex flex-col w-full py-2 px-4">

				<div className="flex flex-col">
					<div className="w-full flex py-2 px-4 rounded-t-md">
						<div className='w-16 aspect-square rounded-full bg-white'>
						</div>
						<div className='mx-4 my-auto'>
							<div className='text-xl'>name</div>
							<div>rank wins</div>
						</div>
					</div>
				</div>


				<div className='my-8 overflow-scroll'>
					<button onClick={() => setOpenGroupsAccordean(!openGroupsAccordean)} className='border-b border-white my-2 w-full text-start'> Groups </button>
					<div className={`transition-all space-y-2 ${openGroupsAccordean ? 'max-h-full' : 'max-h-0'} overflow-hidden`}>
						<Link className='group' href={'/'}>
							<div className="relative border border-white roundend w-full place-content-between px-4 flex py-2 rounded">
								<div>friend</div>
								<div className='group-hover:invisible'>members count</div>
								<div className='invisible group-hover:visible bg-red-500 right-4 absolute'>
									akjgwe
								</div>
							</div>
						</Link>
						<Link className='group' href={'/'}>
							<div className="relative border border-white roundend w-full place-content-around flex py-2 rounded">
								<div>friend</div>
								<div className='group-hover:invisible'>wins</div>
								<div className='invisible group-hover:visible bg-red-500 right-4 absolute'>
									akjgwe
								</div>
							</div>
						</Link>
						<Link className='group' href={'/'}>
							<div className="relative border border-white roundend w-full place-content-around flex py-2 rounded">
								<div>friend</div>
								<div className='group-hover:invisible'>wins</div>
								<div className='invisible group-hover:visible bg-red-500 right-4 absolute'>
									akjgwe
									<button></button>
								</div>
							</div>
						</Link>
					</div>


					<button onClick={() => setOpenFriendsAccordean(!openFriendsAccordean)} className='border-b border-white my-2 w-full text-start'> Friends </button>
					<div className={`transition-all space-y-2 ${openFriendsAccordean ? 'max-h-full' : 'max-h-0'} overflow-hidden`}>
						<div className="group flex relative border border-white roundend py-2 rounded">
							<Link className='flex w-full place-content-around' href={'/'}>
								<div>friend</div>
								<div className='visible group-hover:invisible'>wins</div>
							</Link>
							<div className='invisible group-hover:visible right-4 absolute flex'>
								<Link href={'/'} className='hover:text-pink-400'><BiUser size={24} /></Link>
								<button className='hover:text-pink-400'><LuSwords size={24} /></button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
