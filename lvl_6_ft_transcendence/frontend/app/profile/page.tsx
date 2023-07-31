'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import Friends from './friends'
import History from './history'
import { api } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { UserProfile } from '@/common/types/user-profile.interface'
import SettingsModal from './settingsModal'

export default function Profile() {

	const { user: loggedUser } = useAuth()

	console.log(loggedUser)
	const [ user, setUser ] = useState<UserProfile>()
	const searchParams = useSearchParams()
	const id = searchParams.get('id') || loggedUser.id

	const [showMatchHistory, setShowMatchHistory] = useState(true)
	const [openModal, setOpenModal] = useState(false)

	function sendFriendRequest(userId: number) {

		api.post(`/friendships/send-request/${userId}`)
			.then(result => console.log(result))
			.catch(error => console.error(error))
	}

	useEffect(() => {
		if (id) {
			api.get(`/users/${id}`)
			.then((result) => {
				console.log(result.data)
				setUser(result.data)
			})
			.catch((error) => {
				console.error(error)
			})
		}
	}, [id, loggedUser])


	return (
		<div className="h-full py-12">
			{openModal && <SettingsModal closeModal={() => setOpenModal(false)} />}

			<Link
				className="fixed left-12 top-12 hover:underline"
				href={'/dashboard'}
			>
				GO BACK
			</Link>

			<div className="mx-64 grid h-full grid-cols-2">
				<div className="mx-auto items-center flex h-full flex-col py-12 space-y-6 text-center">
					<div className="relative aspect-square w-80 overflow-hidden rounded-full">
						<Image
							loader={removeParams}
							alt={'player profile picutre'}
							className="h-max w-max"
							height={0}
							layout="fill"
							objectFit="cover"
							src={user?.avatar_url || '/placeholder.jpg'}
							width={0}
						/>
					</div>

					<div className='w-full flex flex-col space-y-4'>
						<p className="text-3xl">{user?.name || 'Loading...'}</p>

						<div className="w-full space-x-2">
							{ loggedUser.id === user?.id ?
								<button 
								onClick={() => {setOpenModal(true)}}	
								className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
									Settings	
								</button>
							:
							<>
								<button className="rounded border border-white w-7/12 py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
									Add friend
								</button>
								<button className="rounded border border-white w-4/12 py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
									Block
								</button>
							</>
							}
						</div>
					</div>

					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
					<div>
						<span>#1</span>
						<span>120w</span>
					</div>
				</div>

				<div className="pb-12">
					<div className="flex -mb-px w-full place-content-center space-x-2 text-2xl ">
						<button
							className={`border rounded-t border-white w-1/2 py-1 hover:border-white hover:text-white
							${showMatchHistory ? 'mix-blend-exclusion' : 'border-white/50 text-white/50'}`}
							onClick={() => setShowMatchHistory(true)}
						>
							Match history
						</button>
						<button
							className={`rounded-t border border-white w-1/2 py-1 hover:border-white hover:text-white
							${showMatchHistory ? 'border-white/50 text-white/50' : 'mix-blend-exclusion'}`}
							onClick={() => setShowMatchHistory(false)}
						>
							Friends
						</button>
					</div>
					<div className="h-full rounded-b border border-white p-4">
						{ showMatchHistory ? 
							<History />
						:
							<Friends friends={user?.friends}/>
						}
					</div>
				</div>
			</div>
		</div>
	)
}
