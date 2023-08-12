'use client'

import { removeParams } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import Image from 'next/image'
import Link from 'next/link'
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
			className={`${isOpen ? 'bottom-0' : '-bottom-[22rem]'} 
			absolute right-28 flex h-96 w-[36rem] flex-col place-content-between rounded-t border border-b-0 border-white bg-gradient-to-tr from-black via-[#170317] via-40% transition-all`}
		>
			<div className="flex h-8 place-content-between items-center bg-white px-2 text-[#170317]">
				<button className="w-full" onClick={() => setIsOpen(!isOpen)}>
					<p className="text-2xl">name</p>
				</button>
				<button onClick={close}>
					<GrFormClose size={32} />
				</button>
			</div>
			<div className="flex h-full w-full">
				<div className="h-full w-4/12 border-r border-white">
					<button className="w-full border-b border-white p-2 text-start text-gray-300 hover:text-white">
						<div className="relative w-20">
							<Image
								alt={'player in chat profile picture'}
								fill
								loader={removeParams}
								sizes="100vw"
								src={'/placeholder.gif'}
							/>
						</div>
						<h4 className="text-3xl">macaco</h4>
						<span className="">ma aca ca</span>
					</button>
					<div className="p-2">
						<h4 className="text-xl">macaco</h4>
						<span>ma aca ca</span>
					</div>
				</div>
				<div className="relative flex h-full w-8/12 flex-col place-content-between">
					<div className="relative h-[17rem] space-y-4 overflow-scroll p-2">
						<div className="flex w-full place-content-end">
							<div className="w-min max-w-[60%] break-words rounded bg-white p-2 text-[#170317]">
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
							</div>
						</div>
						<div>
							<Link className="px-2 text-sm" href={'#'}>
								Name
							</Link>
							<div className="w-min max-w-[60%] break-words rounded border border-white p-2">
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
								abcdefsjkrgnrjkwgnekrgnwejkrgnwkjergnwkj
							</div>
						</div>
					</div>
					<textarea
						className={`mx-2 mb-2 
				resize-none rounded border border-white bg-transparent p-2 text-sm caret-white outline-none transition-all duration-500`}
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
