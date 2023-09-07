'use client'

import { api } from '@/api/api'
import {
	ChatRoomRoles,
	GetChatterRoleEvent,
	GetChatterRoleMessage,
	MuteDuration,
	RespondToRoomInviteRequest,
	RoomOperationRequest,
	UserBasicProfile,
} from '@/common/types'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import { socket } from '@/contexts/SocketContext'
import Tippy from '@tippyjs/react'
import { UUID } from 'crypto'
import md5 from 'md5'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChangeEventHandler, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AiOutlineClose } from 'react-icons/ai'
import { FiSettings } from 'react-icons/fi'
import { IoIosClose } from 'react-icons/io'
import { toast } from 'react-toastify'

interface IMuteTooltip {
	close: () => void
	id: number | undefined
	roomId: number
}

interface ITooltip extends IMuteTooltip {
	authorRole: ChatRoomRoles | undefined
	role: ChatRoomRoles | undefined
}

function RoomSettings({
	closeModal,
	id,
}: {
	closeModal: () => void
	id: number
}) {
	const [bans, setBans] = useState<UserBasicProfile[]>([])

	const { handleSubmit, register } = useForm()

	function changePassword({ password }: { password: string }) {
		api.patch('/chat/room-password', {
			newPassword: md5(password),
			roomId: parseInt(id),
		})
	}

	function removePassword() {
		api.delete(`/chat/room-password?roomId=${id}`)
	}

	function getBans() { 
		try {
			api
				.get(`/chat/rooms/${id}/bans`)
				.then((result: any) => {
					setBans(result.data)
				})
				.catch(() => {
					throw 'Network Error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	useEffect(() => {
		getBans()
	}, [])

	function unban(userId: number) {

		const newRoomOperation: RoomOperationRequest = {
			roomId: parseInt(id),
			userId: parseInt(userId)
		}

		try {
			api.delete(`/chat/ban?roomId=${id}&userId=${userId}`)
				.then(() => getBans())
				.catch(() => {
					throw 'Network Error'
		})
		} catch (error: any) {
			toast.error(error)
		}
	}

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative flex flex-col h-full items-center place-content-center space-y-4 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-12 py-8 leading-none">

					<div className="flex">
						<div className="flex flex-col space-y-2">
							<span>ROOM PASSWORD</span>
							<div className="flex space-x-2 h-8">
								<form className="space-x-2" onSubmit={handleSubmit(changePassword)}>
									<input className="border h-full w-64 border-white rounded bg-transparent px-2 py-1 text-white"
										placeholder="New password" 
										type="password"
										{...register('password')}
									/>
									<input 
									className="rounded border border-white px-2 h-full text-white mix-blend-lighten hover:bg-white hover:text-black"
									 type="submit" 
									 value="Change" />
								</form>
								<button 
									className="rounded border border-red-600 px-2 h-full text-red-600 hover:bg-red-600 hover:text-white"
									onClick={removePassword}>Remove</button>
							</div>
						</div>
					</div>

					<div className="flex flex-col w-full">
						<h3 className="text-xl">Bans</h3>
						<div className="flex flex-col overflow-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-white space-y-2 h-48 py-2 w-full">
							{ bans.length === 0 ?
								<div className="w-full text-center my-4 h-48 align-center">Go ahead, ban someone</div>
							: bans.map((ban) => {
								return (
									<div 
									className="border border-white place-content-between px-4 py-2 rounded flex"
									key={ban.id}>
										<div className="flex items-center space-x-4">
											<div className="relative overflow-hidden aspect-square w-8 rounded-sm">
												<Image
													alt="profile picture"
													className="object-cover"
													fill
													loader={removeParams}
													sizes="100%"
													src={ban.avatar_url || '/placeholder.gif'}
													unoptimized
												/>
											</div>
											<span> {ban.name} </span>
										</div>
										<button
											className="rounded border border-white py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
										 	onClick={() => unban(ban.id)}>unban</button>
									</div>
								)
							})}
						</div>
					</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function MuteTooltip({ close, id, roomId }: IMuteTooltip) {
	const { handleSubmit, register } = useForm()

	function mute({ duration }: { duration: MuteDuration }) {
		close()
		api.post(`/chat/mute`, {
			duration,
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	return (
		<div className="rounded border border-t-0 border-white bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% p-2">
			<form className="flex flex-col space-y-1" onSubmit={handleSubmit(mute)}>
				<fieldset className="flex items-center  space-x-1 accent-primary-fushia">
					<input
						{...register('duration')}
						checked
						id="30s"
						name="duration"
						type="radio"
						value={MuteDuration.THIRTEEN_SECS}
					/>
					<label htmlFor="30s">30s</label>
				</fieldset>

				<fieldset className="flex items-center space-x-1 accent-primary-fushia">
					<input
						{...register('duration')}
						id="5m"
						name="duration"
						type="radio"
						value={MuteDuration.FIVE_MINS}
					/>
					<label htmlFor="5m">5m</label>
				</fieldset>

				<input
					className="rounded border border-white p-1 text-xs mix-blend-lighten hover:bg-white hover:text-black"
					type="submit"
					value="Mute"
				/>
			</form>
		</div>
	)
}

function Tooltip({ close, authorRole, id, role, roomId }: ITooltip) {
	function promote() {
		close()
		api.post(`/chat/add-admin`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	function demote() {
		close()
		api.post(`/chat/remove-admin`, {
				roomId: parseInt(roomId),
				userId: parseInt(id),
		})
	}

	function kick() {
		close()
		api.post(`/chat/kick`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	function ban() {
		close()
		api.post(`/chat/ban`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	return (
		<div className="flex flex-col divide-y divide-white rounded border border-white bg-gradient-to-tr from-black via-[#170317] via-40% to-[#0E050E] to-80% text-xs">
			<Link
				className="w-full p-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
				href={`profile?id=${id}`}
			>
				Profile
			</Link>
			{role === ChatRoomRoles.OWNER && authorRole === ChatRoomRoles.CHATTER && (
				<button
					className="px-2 py-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
					onClick={promote}
				>
					Promote
				</button>
			)}
			{role === ChatRoomRoles.OWNER && authorRole === ChatRoomRoles.ADMIN && (
				<button
					className="px-2 py-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
					onClick={demote}
				>
					Demote
				</button>
			)}
			{(role === ChatRoomRoles.OWNER ||
				(role === ChatRoomRoles.ADMIN && authorRole !== ChatRoomRoles.ADMIN)) &&
				role !== null &&
				authorRole !== null && (
					<>
						<Tippy
							content={<MuteTooltip close={close} id={id} roomId={roomId} />}
							interactive
							placement={'right'}
							trigger={'click'}
						>
							<button className="py-2 text-center mix-blend-lighten hover:bg-white hover:text-black">
								Mute
							</button>
						</Tippy>
						<button
							className="py-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
							onClick={kick}
						>
							Kick
						</button>
						<button
							className="py-2 text-center text-red-600 hover:bg-white "
							onClick={ban}
						>
							Ban
						</button>
					</>
				)}
		</div>
	)
}

export default function Chat() {
	const [message, setMessage] = useState('')
	const [settings, setSettings] = useState(false)
	const [visible, setVisible] = useState(false)
	const pathname = usePathname()

	const { user } = useAuth()

	const [role, setRole] = useState<ChatRoomRoles>()
	const [authorRole, setAuthorRole] = useState<ChatRoomRoles>()

	const {
		changeOpenState,
		close,
		closeAll,
		currentOpenChat,
		exists,
		focus,
		isOpen,
		openChats,
		removeInvite,
		sendMessage,
	} = useFriends()

	function openTippy(roomId: number, id: number | undefined) {
		const newGetChatterRole: GetChatterRoleMessage = {
			roomId: parseInt(roomId),
			uid: parseInt(id),
		}

		socket?.emit(
			'getChatterRole',
			newGetChatterRole,
			function (data: GetChatterRoleEvent) {
				setRole(data.myRole)
				setAuthorRole(data.authorRole)
			}
		)
	}

	function respondeToRoomInvite(inviteId: UUID, accepted: boolean) {
		const newJoinRequest: RespondToRoomInviteRequest = {
			accepted,
			inviteId: inviteId,
		}

		try {
			api
				.patch(`/chat/${inviteId}/status`, newJoinRequest)
				.then(() => {
					removeInvite(inviteId)
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}

	const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
		const value = event.target.value

		if (message.trim().length !== 0 && value.includes('\n')) {
			sendMessage(message)
			setMessage('')
		} else {
			setMessage(event.target.value)
		}
	}

	const { isAuth } = useAuth()

	if (!exists || !isAuth || pathname.includes('/matchmaking')) return <></>

	return (
		<>
			{settings && 'room' in currentOpenChat && (
				<RoomSettings
					closeModal={() => setSettings(false)}
					id={currentOpenChat.room.id}
				/>
			)}
			<div
				className={`${isOpen ? 'bottom-0' : '-bottom-[22rem]'} 
			absolute right-28 flex h-96 w-[38rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-gradient-to-tr from-black via-[#170317] via-40% to-[#0E050E] to-80% transition-all`}
			>
				<div className="flex h-8 place-content-between items-center bg-white px-2 text-[#170317]">
					{'room' in currentOpenChat &&
						currentOpenChat.room.ownerId === user.id && (
							<button
								className="hover:text-primary-fushia"
								onClick={() => setSettings(true)}
							>
								<FiSettings size={24} />
							</button>
						)}
					<button className="w-full" onClick={changeOpenState}>
						{'friend' in currentOpenChat
							? currentOpenChat.friend?.name
							: currentOpenChat.room?.name}
					</button>
					<button onClick={closeAll}>
						<IoIosClose size={32} />
					</button>
				</div>

				<div className="flex h-full w-full overflow-hidden">
					<div className="h-full w-4/12 overflow-y-auto border-r border-white scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
						{openChats?.map((chat, index) => {
							if (!chat.display) return

							const display = {
								avatar: 'room' in chat ? null : chat.friend.avatar_url,
								id: 'room' in chat ? chat.room.id : chat.friend.uid,
								isRoom: 'room' in chat,
								name: 'room' in chat ? chat.room.name : chat.friend.name,
							}

							const openId =
								'room' in currentOpenChat
									? currentOpenChat.room?.id
									: currentOpenChat.friend?.uid

							return (
								<div
									className={`group relative w-full items-center border-b border-white
								${
									(display.id !== openId ||
										('room' in chat && 'friend' in currentOpenChat) ||
										('friend' in chat && 'room' in currentOpenChat)) &&
									'opacity-60 hover:opacity-100'
								}`}
									key={index}
								>
									<button
										className={`group flex h-12 items-center space-x-2 px-2 hover:w-5/6
						${chat.unread ? 'w-5/6' : 'w-full '}`}
										onClick={() => focus(display.id, display.isRoom)}
									>
										{'friend' in chat && (
											<div className="relative h-8 w-8 overflow-hidden rounded-sm">
												<Image
													alt={'player in chat profile picture'}
													className="h-fit w-fit object-cover"
													fill
													loader={removeParams}
													sizes="100%"
													src={display.avatar || '/placeholder.gif'}
												/>
											</div>
										)}
										<div
											className={`text-md flex h-full ${
												'friend' in chat ? 'w-3/4' : 'w-full'
											} items-center overflow-hidden whitespace-nowrap break-normal`}
										>
											{display.name || 'NOT FOUND'}
										</div>
									</button>

									<div className="absolute right-3 top-0 hidden h-full items-center group-hover:flex">
										<button onClick={() => close(display.id, display.isRoom)}>
											<IoIosClose className="h-6 w-6 rounded-full text-white hover:bg-[#FB37FF]" />
										</button>
									</div>

									{chat.unread && (
										<div className="absolute right-4 top-0 flex h-full items-center group-hover:hidden">
											<span className="relative my-auto flex h-3 w-3">
												<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-shoque opacity-75"></span>
												<span className="relative inline-flex h-3 w-3 rounded-full bg-primary-fushia"></span>
											</span>
										</div>
									)}
								</div>
							)
						})}
					</div>

					<div className="relative flex h-full w-8/12 flex-col place-content-between">
						<div className="flex h-full flex-col-reverse overflow-y-auto p-2 text-sm scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
							{currentOpenChat?.messages?.map((message, index) => {
								if ('warning' in message) {
									return (
										<div
											className="mb-4 flex w-full place-content-center items-center text-center text-[0.6rem] text-gray-400"
											key={index}
										>
											{message.warning}
										</div>
									)
								}

								if ('game' in message) {
									if (message.game) {
										return (
											<div
												className="mx-auto mb-4 flex w-11/12 place-content-between items-center rounded border border-white p-2 px-4"
												key={index}
											>
												<span>Challenged you</span>
												<button className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
													Accept
												</button>
											</div>
										)
									}

									return (
										<div
											className="mx-auto mb-4 flex w-11/12 place-content-between items-center rounded border border-white p-2 px-4"
											key={index}
										>
											<div className="flex flex-col">
												Invited you
												<span className="text-[0.5rem] leading-3 text-gray-500">
													to {message.roomName}
												</span>
											</div>
											<div className="flex space-x-2">
												<button
													className="rounded border border-white py-1 px-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
													onClick={() => respondeToRoomInvite(message.id, true)}
												>
													Join
												</button>
												<button
													className="rounded border border-white px-1 text-white mix-blend-lighten hover:bg-white hover:text-black"
													onClick={() => respondeToRoomInvite(message.id, false)}
												>
													<AiOutlineClose size={20}/>
												</button>
											</div>
										</div>
									)
								}

								const isRoom = 'room' in currentOpenChat

								const isLastOfSameAuthor =
									!currentOpenChat.messages[index - 1] ||
									!('author' in currentOpenChat.messages[index - 1]) ||
									currentOpenChat.messages[index - 1]!.author?.id !==
										message.author?.id

								if (!message.sendByMe) {
									return (
										<div
											className={isLastOfSameAuthor ? 'mb-4' : 'mb-2'}
											key={message.uniqueID}
										>
											<div className="w-fit max-w-[60%] break-words rounded border border-white p-2">
												{message.content}
											</div>
											{isRoom && isLastOfSameAuthor && (
												<Tippy
													content={
														<Tooltip
														close={() => setVisible(false)}
															authorRole={authorRole}
															id={message.author?.id}
															role={role}
															roomId={currentOpenChat.room.id}
														/>
													}
													placement={
														role === ChatRoomRoles.CHATTER ||
														!role ||
														!authorRole
															? 'right'
															: 'top'
													}
													interactive
													trigger={'click'}
													visible={visible}
													onShow={() => openTippy(
																currentOpenChat.room.id,
																message.author?.id
													)}
												>
													<button onClick={() => setVisible(true)} className="text-[0.5rem] text-gray-500 hover:underline" >
														{message.author?.name}
													</button>
												</Tippy>
											)}
										</div>
									)
								}

								const isLastOfMe =
									!currentOpenChat.messages[index - 1] ||
									!('sendByMe' in currentOpenChat.messages[index - 1]) ||
									!currentOpenChat.messages[index - 1].sendByMe

								return (
									<div
										className={`flex w-full flex-col place-content-end items-end ${
											isLastOfMe ? 'mb-4' : 'mb-2'
										}`}
										key={message.uniqueID}
									>
										<div className="max-w-[60%] break-words rounded bg-white p-2 text-[#170317]">
											{message.content}
										</div>
										{isRoom && isLastOfMe && (
											<div className="text-[0.5rem] text-gray-500">You</div>
										)}
									</div>
								)
							})}
						</div>

						{(('room' in currentOpenChat && currentOpenChat.canWrite) ||
							'friend' in currentOpenChat) && (
							<textarea
								className={`mx-2 mb-2 h-16 resize-none rounded border border-white bg-transparent p-2 text-sm caret-white outline-none scrollbar-none placeholder:text-white/80`}
								cols={2}
								onChange={handleChange}
								placeholder="Write something beutiful"
								value={message}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
