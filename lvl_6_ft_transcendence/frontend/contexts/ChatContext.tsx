import { createContext, ReactNode, useContext, useState } from 'react'

type chatContextType = {
	close: () => void
	isOpen: boolean
	open: () => void
}

const chatContextDefaultValues: chatContextType = {
	close: function () {},
	isOpen: false,
	open: function () {},
}

const ChatContext = createContext<chatContextType>(chatContextDefaultValues)

export function ChatProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)

	function open() {
		setIsOpen(true)
	}

	function close() {
		setIsOpen(false)
	}

	const value: chatContextType = {
		close,
		isOpen,
		open,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}

