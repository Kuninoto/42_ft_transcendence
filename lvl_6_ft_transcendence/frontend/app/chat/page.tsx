'use client'

import { api } from '@/api/api'
import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import Tippy from '@tippyjs/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChangeEventHandler, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiSettings } from 'react-icons/fi'
import { IoIosClose } from 'react-icons/io'
import { LuSwords } from 'react-icons/lu'
import { MdOutlineBlock } from 'react-icons/md'

interface ITooltip {
	id: number | undefined
	roomId: number
}

function RoomSettings({ closeModal }: { closeModal: () => void }) {
	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="group relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative flex h-full items-center space-x-16 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-12 py-8 leading-none"></div>
				</div>
			</div>
		</div>
	)
}

function MuteTooltip({ id, roomId }: ITooltip) {
	const { handleSubmit, register } = useForm()

	function mute({ duration, span }: { duration: number; span: string }) {
		api.post(`/chat/mute`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
			duration: `${duration}${span}`,
		})
	}

	return (
		<div className="rounded border border-t-0 border-white bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% p-2">
			<form className="flex space-x-1" onSubmit={handleSubmit(mute)}>
				<input
					onKeyDown={(evt) =>
						['-', '.', '+', 'e', 'E'].includes(evt.key) && evt.preventDefault()
					}
					{...register('duration')}
					className="w-16 appearance-none rounded-l border border-white bg-transparent py-1 text-white"
					type="number"
				/>
				<select {...register('span')} className="rounded-r text-[#170317]">
					<option value={'s'}>s</option>
					<option value={'m'}>m</option>
					<option value={'h'}>h</option>
					<option value={'d'}>d</option>
				</select>
			</form>
		</div>
	)
}

function Tooltip({ id, roomId }: ITooltip) {
	function promote() {
		api.post(`/chat/add-admin`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	function demote() {
		api.post(`/chat/remove-admin`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	function kick() {
		api.post(`/chat/kick`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	function ban() {
		api.post(`/chat/ban`, {
			roomId: parseInt(roomId),
			userId: parseInt(id),
		})
	}

	return (
		<div className="flex flex-col divide-y divide-white rounded border border-white bg-gradient-to-tr from-black via-[#170317] via-40% to-[#0E050E] to-80% text-xs">
			<Link
				className="w-full py-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
				href={`profile?id=${id}`}
			>
				Profile
			</Link>
			<button
				className="px-2 py-2 text-center mix-blend-lighten hover:bg-white hover:text-black"
				onClick={promote}
			>
				Promote
			</button>
			<Tippy
				content={<MuteTooltip id={id} roomId={roomId} />}
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
		</div>
	)
}

export default function Chat() {
	const [message, setMessage] = useState('')
	const [settings, setSettings] = useState(false)
	const pathname = usePathname()

	const {
		changeOpenState,
		close,
		closeAll,
		currentOpenChat,
		exists,
		focus,
		isOpen,
		openChats,
		rejectChallenge,
		sendMessage,
	} = useFriends()

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
			{settings && <RoomSettings closeModal={() => setSettings(false)} />}
			<div
				className={`${isOpen ? 'bottom-0' : '-bottom-[22rem]'} 
			absolute right-28 flex h-96 w-[38rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-gradient-to-tr from-black via-[#170317] via-40% to-[#0E050E] to-80% transition-all`}
			>
				<div className="flex h-8 place-content-between items-center bg-white px-2 text-[#170317]">
					{'room' in currentOpenChat && (
						<button className="" onClick={() => setSettings(true)}>
							<FiSettings size={24} />
						</button>
					)}
					<button className="w-full" onClick={changeOpenState}>
						{'friend' in currentOpenChat
							? currentOpenChat.friend?.name
							: currentOpenChat.room.name}
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
									? currentOpenChat.room.id
									: currentOpenChat.friend.uid

							return (
								<div
									className={`group relative w-full items-center border-b border-white
								${display.id !== openId && 'opacity-60 hover:opacity-100'}`}
									key={index}
								>
									<button
										className={`flex h-12 items-center space-x-2 px-2 group-hover:w-5/6
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
										<div className="text-md flex h-full w-3/4 items-center overflow-hidden whitespace-nowrap break-normal">
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
						{'friend' in currentOpenChat && !!currentOpenChat.challengeId && (
							<div className="absolute top-0 flex h-[49px] w-full place-content-between items-center border-b border-white bg-[#170317] px-4">
								<div>Challenged you</div>
								<div className="flex space-x-2">
									<button className="rounded border border-white p-2 text-white mix-blend-lighten hover:bg-white hover:text-black">
										<LuSwords />
									</button>
									<button
										className="rounded border border-red-600 p-2 text-red-600 hover:bg-red-600 hover:text-white"
										onClick={() => rejectChallenge(currentOpenChat.friend?.uid)}
									>
										<MdOutlineBlock />
									</button>
								</div>
							</div>
						)}
						<div className="flex h-[17.5rem] flex-col-reverse overflow-y-auto p-2 text-sm scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
							{currentOpenChat?.messages?.map((message, index) => {
								if ('information' in message) return <></>

								const isRoom = 'room' in currentOpenChat

								const isLastOfSameAuthor =
									!currentOpenChat.messages[index - 1] ||
									!('author' in currentOpenChat.messages[index - 1]) ||
									currentOpenChat.messages[index - 1]!.author?.id !==
										message.author?.id

								if (!message.sendByMe) {
									return (
										<div className="mb-2 space-y-2" key={message.uniqueID}>
											<div className="w-fit max-w-[60%] break-words rounded border border-white p-2">
												{message.content}
											</div>
											{isRoom && isLastOfSameAuthor && (
												<Tippy
													content={
														<Tooltip
															id={message.author?.id}
															roomId={currentOpenChat.room.id}
														/>
													}
													interactive
													trigger={'click'}
												>
													<button className="mb-4 text-xs text-gray-500 hover:underline">
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
										className="mb-2 flex w-full flex-col place-content-end items-end space-y-1 "
										key={message.uniqueID}
									>
										<div className="max-w-[60%] break-words rounded bg-white p-2 text-[#170317]">
											{message.content}
										</div>
										{isRoom && isLastOfMe && (
											<div className="mb-4 text-xs text-gray-500">You</div>
										)}
									</div>
								)
							})}
						</div>

						<textarea
							className={`mx-2 mb-2 h-14 resize-none rounded border border-white bg-transparent p-2 text-sm caret-white outline-none scrollbar-none placeholder:text-white/80`}
							cols={2}
							onChange={handleChange}
							placeholder="Write something beutiful"
							value={message}
						/>
					</div>
				</div>
			</div>
		</>
	)
}
