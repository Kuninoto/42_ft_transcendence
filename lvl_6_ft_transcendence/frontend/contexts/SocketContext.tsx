import io from 'socket.io-client'
import { useEffect, ReactNode, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { AchievementUnlockedDTO } from '@/common/types/achievement-unlocked.dto'

import { toast } from 'react-toastify';

export let socket: any

type SocketContextType = {
    connect: () => void
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType)

export function SocketProvider({ children }: { children: ReactNode }) {

	const pathname = usePathname()

    const connect = () => {
        socket = io('http://localhost:3000/connection', {
            extraHeaders: {
                Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
            },
        })
    }

	useEffect(() => {
		if (localStorage.getItem('pong.token')) {
            connect()
		} 

        socket?.on("achievementUnlocked", () => {
            toast.warning("🎉 New achievement unlocked!", {
                position: "bottom-right",
                icon: false
            })
        })
	}, [])

	const value: SocketContextType = {
        connect
	}

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
   
}

export function useSocket() {
	return useContext(SocketContext)
}
