'use client'

import { removeParams, useAuth } from '@/contexts/AuthContext'
import { useFriends } from '@/contexts/FriendsContext'
import Image from 'next/image'
import { ChangeEventHandler, useState } from 'react'
import { IoIosClose } from 'react-icons/io'
import { LuSwords } from 'react-icons/lu'
import { MdOutlineBlock } from 'react-icons/md'

export default function Chat() {
	const [message, setMessage] = useState('')

	const {
		changeOpenState,
		close,
		closeAll,
		currentOpenChat,
		exists,
		focusChat,
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

	if (!exists || !isAuth) return <></>

	return (
		<div
			className={`${isOpen ? 'bottom-0' : '-bottom-[22rem]'} 
			absolute right-28 flex h-96 w-[38rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-gradient-to-tr from-black via-[#170317] via-40% transition-all`}
		>
			<div className="flex h-8 place-content-between items-center bg-white px-2 text-[#170317]">
				<button className="w-full" onClick={changeOpenState}>
					{currentOpenChat.friend?.name}
				</button>
				<button onClick={closeAll}>
					<IoIosClose size={32} />
				</button>
			</div>

			<div className="flex h-full w-full overflow-hidden">
				<div className="h-full w-4/12 overflow-y-auto border-r border-white scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
					{openChats?.map((chat) => {
						if (!chat.display) return

						return (
							<div
								className={`group relative w-full items-center border-b border-white ${
									chat.friend?.uid !== currentOpenChat.friend?.uid &&
									'opacity-60'
								}  hover:opacity-100`}
								key={chat.friend?.uid}
							>
								<button
									className={`flex h-12 items-center space-x-2 px-2 group-hover:w-5/6 ${
										chat.unread ? 'w-5/6' : 'w-full '
									}`}
									onClick={() => focusChat(chat.friend?.uid)}
								>
									<div className="relative h-8 w-8 overflow-hidden rounded-sm">
										<Image
											alt={'player in chat profile picture'}
											className="h-fit w-fit object-cover "
											fill
											loader={removeParams}
											sizes="100vw"
											src={chat.friend?.avatar_url || '/placeholder.gif'}
										/>
									</div>
									<div className="text-md flex h-full w-3/4 items-center overflow-hidden whitespace-nowrap break-normal">
										{chat.friend?.name || 'NOT FOUND'}
									</div>
								</button>

								<div className="absolute right-3 top-0 hidden h-full items-center group-hover:flex">
									<button onClick={() => close(chat.friend?.uid)}>
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
					{!!currentOpenChat.challengeId && (
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
						{currentOpenChat?.messages.map((message) => {
							if (!message.sendByMe) {
								return (
									<div
										className=" my-2 w-fit max-w-[60%] break-words rounded border border-white p-2"
										key={message.uniqueID}
									>
										{message.content}
									</div>
								)
							}
							return (
								<div
									className="my-2 flex w-full place-content-end "
									key={message.uniqueID}
								>
									<div className="max-w-[60%] break-words rounded bg-white p-2 text-[#170317]">
										{message.content}
									</div>
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
	)
}
