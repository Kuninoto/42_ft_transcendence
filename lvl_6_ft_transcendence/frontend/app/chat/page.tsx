'use client'

import { useChat } from '@/contexts/ChatContext'
import { ChangeEventHandler, useState } from 'react'
import { GrFormClose } from 'react-icons/gr'

export default function Chat() {
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState('')

	const { close, isOpen: exists } = useChat()

	const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
		const value = event.target.value

		if (value.includes('\n')) {
			alert(message)
			setMessage('')
		} else {
			setMessage(event.target.value)
		}
	}

	if (!exists) return <></>

	return (
		<div
			className={`${isOpen ? 'bottom-0' : '-bottom-[18rem]'} 
			absolute right-28 flex h-80 w-[26rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-black bg-gradient-to-tr from-black via-[#170317] via-40% transition-all `}
		>
			<div className="relative flex h-8 w-full place-content-between items-center bg-white px-2 text-[#170317]">
				<button
					className="w-full text-start"
					onClick={() => setIsOpen(!isOpen)}
				>
					<p className="text-2xl">name</p>
				</button>
				<div className="flex">
					<button onClick={close}>
						<GrFormClose size={32} />
					</button>
				</div>
			</div>
			<div className="relative h-full">
				chat
				<div className="absolute bottom-2 left-2 text-xs">typing...</div>
			</div>
			<textarea
				className={`mx-2 mb-2 ${message.length === 0 ? 'max-h-10' : 'max-h-24'} 
				resize-none rounded border border-white bg-transparent p-2 text-sm caret-white outline-none transition-all duration-500`}
				cols={2}
				onChange={handleChange}
				placeholder="Write something beutiful"
				value={message}
			/>
		</div>
	)
}
