import { createContext, ReactNode, useContext, useState } from 'react'

type ChatContextType = {
	close: () => void
	isOpen: boolean
	open: () => void
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)

	function open() {
		setIsOpen(true)
	}

	function close() {
		setIsOpen(false)
	}

	const value: ChatContextType = {
		close,
		isOpen,
		open,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}
