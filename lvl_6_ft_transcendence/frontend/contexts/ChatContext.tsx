import { ReactNode, createContext, useContext, useState } from 'react'

type chatContextType = {
    close: () => void,
    open: () => void,
    isOpen: boolean
};

const chatContextDefaultValues: chatContextType = {
    close: function () {},
    open: function () {},
    isOpen: false,
}

const ChatContext = createContext<chatContextType>(chatContextDefaultValues)

export function ChatProvider({ children }: { children: ReactNode }) {
	const [ isOpen, setIsOpen ] = useState(true)

    function open() {
    console.log(isOpen)
        setIsOpen(true)
    }
	
	function close() {
		setIsOpen(false)
	}

	const value: chatContextType = {
		close,
        open,
        isOpen
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}