'use client'

import Cookies from 'js-cookie'
import Link from 'next/link'
import { createContext, ReactNode, useContext, useEffect } from 'react'
import { toast } from 'react-toastify'
import io from 'socket.io-client'

export let socket: any

type SocketContextType = {
	connect: () => void
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType)

const AchievementLink = () => (
	<Link href={'/profile'}>🎉 New achievement unlocked!</Link>
)

export function SocketProvider({ children }: { children: ReactNode }) {
	const connect = () => {
		socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/connection`, {
			extraHeaders: {
				Authorization: `Bearer ${Cookies.get('pong.token')}`,
			},
		})

		socket.on('achievementUnlocked', () => {
			toast(<AchievementLink />)
		})
	}

	useEffect(() => {
		if (Cookies.get('pong.token')) {
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
