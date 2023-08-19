import { createContext, ReactNode, useContext, useEffect } from 'react'
import { toast } from 'react-toastify'
import io from 'socket.io-client'

export let socket: any

type SocketContextType = {
	connect: () => void
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType)

export function SocketProvider({ children }: { children: ReactNode }) {
	const connect = () => {
		socket = io('http://localhost:3000/connection', {
			extraHeaders: {
				Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
			},
		})

		socket.on('achievementUnlocked', () => {
			toast('🎉 New achievement unlocked!', {
				icon: false,
			})
		})
	}

	useEffect(() => {
		if (localStorage.getItem('pong.token')) {
			connect()
		}
	}, [])

	const value: SocketContextType = {
		connect,
	}

	return (
		<SocketContext.Provider value={value}>{children}</SocketContext.Provider>
	)
}

export function useSocket() {
	return useContext(SocketContext)
}
