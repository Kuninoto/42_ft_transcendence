'use client'

import { removeParams } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import Image from 'next/image'
import { ChangeEventHandler, useState } from 'react'
import { GrFormClose } from 'react-icons/gr'

export default function Chat() {
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState('')

	const {
		close,
		currentOpenChat,
		focusChat,
		isOpen: exists,
		openChats,
		sendMessage,
	} = useChat()

	const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
		const value = event.target.value

		if (value.includes('\n')) {
			sendMessage(message)
			setMessage('')
		} else {
			setMessage(event.target.value)
		}
	}

	if (!exists) return <></>

	return (
		<div
			className={`${isOpen ? 'bottom-0' : '-bottom-[22rem]'} 
			absolute right-28 flex h-96 w-[36rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-gradient-to-tr from-black via-[#170317] via-40% transition-all`}
		>
			<div className="flex h-8 place-content-between items-center bg-white px-2 text-[#170317]">
				<button className="w-full" onClick={() => setIsOpen(!isOpen)}>
					{currentOpenChat.friend?.name}
				</button>
				<button onClick={close}>
					<GrFormClose size={32} />
				</button>
			</div>

			<div className="flex h-full w-full">
				<div className="h-full w-4/12 border-r border-white">
					{openChats.map((chat) => {
						return (
							<button
								className="flex w-full flex-col space-y-2 border-b border-white px-4 py-2 opacity-60 hover:opacity-100"
								key={chat.friend.uid}
								onClick={() => focusChat(chat.friend.uid)}
							>
								<div className="flex w-full items-center space-x-2">
									<div className="relative aspect-square w-8 overflow-hidden rounded">
										<Image
											alt={'player in chat profile picture'}
											fill
											loader={removeParams}
											sizes="100vw"
											src={chat.friend.avatar_url || '/placeholder.gif'}
										/>
									</div>
									<div className="text-md w-3/4 overflow-hidden">
										<h2>{chat.friend.name || 'NOT FOUND'}</h2>
									</div>
								</div>
								<div className="w-full overflow-hidden truncate text-ellipsis text-start text-xs">
									{chat.messages.at(0)?.content}
								</div>
							</button>
						)
					})}
				</div>
				<div className="flex h-full w-8/12 flex-col place-content-between">
					<div className="flex h-[17.5rem] flex-col-reverse overflow-y-auto p-2 text-sm">
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
						className={`mx-2 mb-2 resize-none rounded border border-white bg-transparent p-2 text-sm caret-white outline-none transition-all duration-500 placeholder:text-white/90`}
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
