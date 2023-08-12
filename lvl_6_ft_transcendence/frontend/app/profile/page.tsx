'use client'

import { FriendshipStatus } from '@/common/types/backend/friendship-status.enum'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import Friends from './friends'
import History from './history'
import { api } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { UserProfile as IUserProfile } from '@/common/type/backend/user-profile.interface'
import SettingsModal from './settingsModal'

enum modalPage {
	HISTORY = "history",
	FRIENDS = "friends",
	ACHIEVEMENTS = "achievements"
}

function Buttons({ setOpenModal, userProfile }: { setOpenModal: (state: boolean) => void, userProfile: IUserProfile }) {

	const { user } = useAuth()

	const [requestSent, setRequestSent] = useState(false)

	function removeFriendship(friendshipId: number) {
		api
			.patch(`/friendships/${friendshipId}/update`, {
				newStatus: FriendshipStatus.UNFRIEND,
			})
			.then((a) => console.log(a.data))
	}

	function sendFriendRequest(userId: number) {
		api.post(`/friendships/send-request/${userId}`)
			.then(result => {
				setRequestSent(true)
				console.log(result)
			}
			)
			.catch(error => console.error(error))
	}

	return (
		<div className="w-full space-x-2">
			{user?.id === userProfile?.id
				? <button
					onClick={() => { setOpenModal(true) }}
					className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
					Settings
				</button>
				: user?.friendship_status === FriendshipStatus.ACCEPTED
					?
					<button
						onClick={() => removeFriendship(userProfile?.friendship_id)}
						className="rounded border border-white w-full py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
						Remove friend
					</button>
					: userProfile?.friend_request_sent_by_me || requestSent ?
						<button
							onClick={() => removeFriendship(userProfile?.friendship_id)}
							className="rounded border bg-white text-black w-full py-2 mix-blend-lighten hover:bg-transparent hover:text-white">
							Cancel
						</button>
						:
						<>
							<button
								onClick={() => sendFriendRequest(userProfile?.id)}
								className="rounded border border-white w-7/12 py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
								Add friend
							</button>
							<button className="rounded border border-white w-4/12 py-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
								Block
							</button>
						</>
			}
		</div>
	)
}

export default function Profile() {

	const { user } = useAuth()

	const [userProfile, setUserProfile] = useState<IUserProfile>()
	const searchParams = useSearchParams()
	const id = searchParams.get('id') || user?.id

	const [modal, setModal] = useState<modalPage>(modalPage.HISTORY)
	const [openModal, setOpenModal] = useState(false)


	useEffect(() => {
		if (id) {
			api.get(`/users/${id}`)
				.then((result) => {
					console.log(result.data)
					setUserProfile(result.data)
				})
				.catch((error) => {
					console.error(error)
				})
		}
	}, [id, user])

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
				<div className="mx-auto flex h-full flex-col items-center space-y-6 py-12 text-center">
					<div className="relative aspect-square w-80 overflow-hidden rounded-xl">
						<Image
							alt={'player profile picutre'}
							className="h-max w-max"
							height={0}
							layout="fill"
							loader={removeParams}
							objectFit="cover"
							src={userProfile?.avatar_url || '/placeholder.gif'}
							width={0}
						/>
					</div>

					<div className='w-full flex flex-col'>
						<p className="text-3xl">{userProfile?.name || 'NOT FOUND'}</p>
						<a href={userProfile?.intra_profile_url} className="text-md mb-4 hover:underline text-gray-400">{userProfile?.intra_name || 'Loading...'}</a>

						<Buttons setOpenModal={setOpenModal} userProfile={userProfile} />

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
					<div className="flex -mb-px w-full place-content-center space-x-1 text-2xl ">
						<button
							className={`border rounded-tl border-white w-1/2 py-1 hover:border-white hover:text-white
							${modal === modalPage.HISTORY ? 'mix-blend-exclusion' : 'border-white/50 text-white/50'}`}
							onClick={() => setModal(modalPage.HISTORY)}
						>
							History
						</button>
						<button
							className={`border border-white w-1/2 py-1 hover:border-white hover:text-white
							${modal === modalPage.FRIENDS ? 'mix-blend-exclusion' : 'border-white/50 text-white/50'}`}
							onClick={() => setModal(modalPage.FRIENDS)}
						>
							Friends
						</button>
						<button
							className={`border rounded-tr border-white w-1/2 py-1 text-lg hover:border-white hover:text-white
							${modal === modalPage.ACHIEVEMENTS ? 'mix-blend-exclusion' : 'border-white/50 text-white/50'}`}
							onClick={() => setModal(modalPage.ACHIEVEMENTS)}
						>
							Achievements
						</button>
					</div>
					<div className="h-full rounded-b border border-white p-4">
						{modal === modalPage.HISTORY
							? <History />
							: modalPage === modalPage.FRIENDS
								? <Friends friends={userProfile?.friends} />
								: <div></div>
						}
					</div>
				</div>
			</div>
		</div>
	)
}
