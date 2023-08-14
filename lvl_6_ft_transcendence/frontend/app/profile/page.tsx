'use client'

import { api } from '@/api/api'
import { UserProfile as IUserProfile } from '@/common/type/backend/user-profile.interface'
import { FriendshipStatus } from '@/common/types/backend/friendship-status.enum'
import { hasValues } from '@/common/utils/hasValues'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import Achievements from './achievements'
import Friends from './friends'
import History from './history'
import SettingsModal from './settingsModal'

enum modalPage {
	ACHIEVEMENTS = 'achievements',
	FRIENDS = 'friends',
	HISTORY = 'history',
}

type buttons = {
	refreshProfile: () => void
	setOpenModal: (state: boolean) => void
	userProfile: IUserProfile
}

function Buttons({ refreshProfile, setOpenModal, userProfile }: buttons) {
	const { user } = useAuth()

	function removeFriendship(friendshipId: number) {
		try {
			api
				.patch(`/friendships/${friendshipId}/update`, {
					newStatus: FriendshipStatus.UNFRIEND,
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function unblock(userId: number) {
		try {
			api
				.delete(`/friendships/block/${userId}`)
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function block(userId: number) {
		try {
			api
				.post(`/friendships/block/${userId}`)
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function accept(friendship_id: number) {
		try {
			api
				.patch(`/friendships/${friendship_id}/update`, {
					newStatus: 'accepted',
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function decline(friendship_id: number) {
		try {
			api
				.patch(`/friendships/${friendship_id}/update`, {
					newStatus: 'declined',
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	function sendFriendRequest(userId: number) {
		try {
			api
				.post(`/friendships/send-request/${userId}`)
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	if (!hasValues(userProfile)) {
		return (
			<div className="w-full rounded border border-white py-2 text-white">
				Button?
			</div>
		)
	}

	if (
		userProfile.friendship_status === FriendshipStatus.PENDING &&
		!userProfile.friend_request_sent_by_me
	) {
		return (
			<div className="flex w-full space-x-2">
				<button
					className="w-1/2 rounded border border-green-600 py-2 text-green-600 hover:bg-green-600 hover:text-white"
					onClick={() => accept(userProfile.friendship_id)}
				>
					Accept
				</button>
				<button
					className="w-1/2 rounded border border-red-600 py-2 text-red-600 hover:bg-red-600 hover:text-white"
					onClick={() => decline(userProfile.friendship_id)}
				>
					Decline
				</button>
			</div>
		)
	}

	if (user?.id === userProfile.id) {
		return (
			<button
				onClick={() => {
					setOpenModal(true)
				}}
				className="w-full rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
			>
				Settings
			</button>
		)
	}

	if (userProfile.friendship_status === FriendshipStatus.ACCEPTED) {
		return (
			<button
				className="w-full rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
				onClick={() => removeFriendship(userProfile.friendship_id)}
			>
				Remove friend
			</button>
		)
	}

	if (userProfile.friend_request_sent_by_me) {
		return (
			<button
				className="w-full rounded border bg-white py-2 text-black mix-blend-lighten hover:bg-transparent hover:text-white"
				onClick={() => removeFriendship(userProfile.friendship_id)}
			>
				Cancel
			</button>
		)
	}

	if (userProfile.is_blocked) {
		return (
			<button
				className="w-full rounded border bg-white py-2 text-black mix-blend-lighten hover:bg-transparent hover:text-white"
				onClick={() => unblock(userProfile.id)}
			>
				Unblock
			</button>
		)
	}

	return (
		<>
			<button
				className="w-7/12 rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
				onClick={() => sendFriendRequest(userProfile.id)}
			>
				Add friend
			</button>
			<button
				className="w-4/12 rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
				onClick={() => block(userProfile.id)}
			>
				Block
			</button>
		</>
	)
}

export default function Profile() {
	const { user } = useAuth()

	const [userProfile, setUserProfile] = useState<IUserProfile>()
	const searchParams = useSearchParams()
	const id = searchParams.get('id') || user?.id

	const [modal, setModal] = useState<modalPage>(modalPage.HISTORY)
	const [openModal, setOpenModal] = useState(false)

	const refreshProfile = () => {
		try {
			api
				.get(`/users/${id}`)
				.then((result) => {
					console.log(result.data)
					setUserProfile(result.data)
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error) {
			toast.error(error)
		}
	}

	useEffect(() => {
		if (id) {
			try {
				api
					.get(`/users/${id}`)
					.then((result) => {
						console.log(result.data)
						setUserProfile(result.data)
					})
					.catch(() => {
						throw 'Network error'
					})
			} catch (error) {
				toast.error(error)
			}
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
							unoptimized
							width={0}
						/>
					</div>

					<div className="flex w-full flex-col">
						<p className="text-3xl">{userProfile?.name || 'NOT FOUND'}</p>
						<a
							className="text-md mb-4 text-gray-400 hover:underline"
							href={userProfile?.intra_profile_url}
						>
							{userProfile?.intra_name || 'Loading...'}
						</a>

						<div className="w-full space-x-2">
							<Buttons
								refreshProfile={refreshProfile}
								setOpenModal={setOpenModal}
								userProfile={userProfile}
							/>
						</div>
					</div>

					<div className="text-xl opacity-80">
						<div> Wins {userProfile?.stats?.wins || '0'} </div>
						<div> Losses {userProfile?.stats?.losses || '0'} </div>
						<div> Win Rate {userProfile?.stats?.win_rate || '0'}% </div>
					</div>
					<div className="text-gray-400">
						{' '}
						since{' '}
						{moment(
							userProfile?.created_at,
							moment.HTML5_FMT.DATETIME_LOCAL_SECONDS
						).format('DD/MM/YY')}{' '}
					</div>
				</div>

				<div className="pb-12">
					<div className="-mb-px flex w-full place-content-center space-x-1 text-2xl ">
						<button
							className={`w-1/2 rounded-tl border border-white py-1 hover:border-white hover:text-white
							${
								modal === modalPage.HISTORY
									? 'mix-blend-exclusion'
									: 'border-white/50 text-white/50'
							}`}
							onClick={() => setModal(modalPage.HISTORY)}
						>
							History
						</button>
						<button
							className={`w-1/2 border border-white py-1 hover:border-white hover:text-white
							${
								modal === modalPage.FRIENDS
									? 'mix-blend-exclusion'
									: 'border-white/50 text-white/50'
							}`}
							onClick={() => setModal(modalPage.FRIENDS)}
						>
							Friends
						</button>
						<button
							className={`w-1/2 rounded-tr border border-white py-1 text-lg hover:border-white hover:text-white
							${
								modal === modalPage.ACHIEVEMENTS
									? 'mix-blend-exclusion'
									: 'border-white/50 text-white/50'
							}`}
							onClick={() => setModal(modalPage.ACHIEVEMENTS)}
						>
							Achievements
						</button>
					</div>
					<div className="h-full rounded-b border border-white p-4">
						{modal === modalPage.HISTORY ? (
							<History
								history={userProfile?.match_history}
								userProfile={userProfile}
							/>
						) : modal === modalPage.FRIENDS ? (
							<Friends friends={userProfile?.friends} />
						) : (
							<Achievements achievements={userProfile?.achievements} />
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
