'use client'

import { api } from '@/api/api'
import { FriendshipStatus, UserProfile as IUserProfile } from '@/common/types'
import { hasValues } from '@/common/utils/hasValues'
import { useRouter } from 'next/navigation'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
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

	function cancelFriendship(friendshipId: null | number) {
		try {
			api
				.patch(`/friendships/${friendshipId}/status`, {
					newStatus: FriendshipStatus.CANCEL,
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	function removeFriendship(friendshipId: null | number) {
		try {
			api
				.patch(`/friendships/${friendshipId}/status`, {
					newStatus: FriendshipStatus.UNFRIEND,
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
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
		} catch (error: any) {
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
		} catch (error: any) {
			toast.error(error)
		}
	}

	function accept(friendship_id: null | number) {
		try {
			api
				.patch(`/friendships/${friendship_id}/status`, {
					newStatus: 'accepted',
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	function decline(friendship_id: null | number) {
		try {
			api
				.patch(`/friendships/${friendship_id}/status`, {
					newStatus: 'declined',
				})
				.then(() => refreshProfile())
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
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
		} catch (error: any) {
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
				onClick={() => cancelFriendship(userProfile.friendship_id)}
			>
				Cancel
			</button>
		)
	}

	if (userProfile.blocked_by_me) {
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

	const router = useRouter()

	const [userProfile, setUserProfile] = useState<IUserProfile>(
		{} as IUserProfile
	)
	const searchParams = useSearchParams()
	const id = searchParams.get('id') || user?.id

	const [modal, setModal] = useState<modalPage>(modalPage.HISTORY)
	const [openModal, setOpenModal] = useState(false)

	const { refreshFriends } = useFriends()

	const refreshProfile = () => {
		api
			.get(`/users/${id}/profile`)
			.then((result) => {
				setUserProfile(result.data)
				refreshFriends()
			})
			.catch(() => {
				router.replace("/not-found")
			})
	}

	useEffect(() => {
		if (id) {
			setModal(modalPage.HISTORY)
			api
				.get(`/users/${id}/profile`)
				.then((result) => {
					setUserProfile(result.data)
				})
				.catch(() => {
					router.replace("/not-found")
				})
		}
	}, [id, user])

	return (
		<div className="h-full py-12">
			{openModal && <SettingsModal closeModal={() => setOpenModal(false)} />}

			<Link
				className="fixed  top-0 h-28 w-40 hover:underline"
				href={'/dashboard'}
			>
				<Image
					alt="logo picture"
					fill
					priority
					sizes="100%"
					src={'/logo.png'}
				/>
			</Link>

			<div className="mx-64 grid h-full grid-cols-2">
				<div className="mx-auto flex h-full flex-col items-center space-y-6 py-12 text-center">
					<div className="relative aspect-square w-80 overflow-hidden rounded-xl">
						<Image
							alt={'player profile picture'}
							className="h-max w-max object-cover"
							fill
							loader={removeParams}
							src={userProfile?.avatar_url || '/placeholder.gif'}
							unoptimized
						/>
					</div>

					<div className="flex w-full flex-col">
						<p className="text-3xl">{userProfile?.name || 'NOT FOUND'}</p>
						<a
							className="text-md mb-4 text-gray-400 hover:underline"
							href={userProfile?.intra_profile_url}
							target="_blank"
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

					<h2 className="text-4xl">
						Rank: #{userProfile?.ladder_level || '?'}
					</h2>

					<div className="text-xl opacity-80">
						<div> Wins: {userProfile?.stats?.wins || '?'} </div>
						<div> Losses: {userProfile?.stats?.losses || '?'} </div>
						<div> Win Rate: {userProfile?.stats?.win_rate || '?'}% </div>
					</div>
					<div className="text-gray-400">
						since{' '}
						{hasValues(userProfile)
							? moment(
									userProfile?.created_at,
									moment.HTML5_FMT.DATETIME_LOCAL_SECONDS
							  ).format('DD/MM/YY')
							: '??/??/??'}
					</div>
				</div>

				<div className="h-full overflow-hidden pb-12">
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

					<div className="h-full overflow-hidden rounded-b border border-white p-4">
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
