import { Friend } from '@/common/types'
import { SendDirectMessageDTO } from '@/common/types/send-direct-message.dto'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

import { socket } from './SocketContext'

type ChatContextType = {
	close: () => void
	currentOpenChatInfo: Friend
	isOpen: boolean
	open: (id: number) => void
	sendMessage: (message: string) => void
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)
	const [openChats, setOpenChats] = useState<Friend[]>([])
	const currentOpenChatInfo = openChats[openChats.length - 1]

	function open(friend: Friend) {
		setOpenChats([...openChats, friend])
		setIsOpen(true)
	}

	function close() {
		setIsOpen(false)
	}

	useEffect(() => {
		socket?.on('directMessageReceived', (data: SendDirectMessageDTO) => {
			console.log(data)
		})
	}, [])

	function sendMessage(message: string) {
		const messageDto: SendDirectMessageDTO = {
			content: message,
			receiverUID: currentOpenChatInfo.uid,
		}

		console.log(messageDto)

		socket.emit('sendDirectMessage', messageDto)
	}

	const value: ChatContextType = {
		close,
		currentOpenChatInfo,
		isOpen,
		open,
		sendMessage,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}
