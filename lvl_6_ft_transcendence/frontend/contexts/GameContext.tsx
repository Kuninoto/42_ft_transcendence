import io from "socket.io-client";
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { OponentFoundDTO } from "@/common/types/oponent-found";
import { useRouter } from 'next/navigation'

let socket : io

type GameContextType = {
	opponentFound: OponentFoundDTO
	cancel: () => void
	emitPaddleMovement: (newY: number) => void
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	
    const [ opponentFound, setOpponentFound ] = useState<OponentFoundDTO>({} as OponentFoundDTO)
    const [ opponentPosition, setOpponentPosition ] = useState(-1)

	const router = useRouter()

	function cancel() {
		router.push('/dashboard')
	}

	function emitPaddleMovement(newY: number) {
		socket.emit("paddle-move", {
			gameRoomId: opponentFound.roomId,
			newY
		})
	}


	useEffect(() => {

		socket = io("http://localhost:3000/game-gateway", {
			extraHeaders: {
			  Authorization: `Bearer ${localStorage.getItem("pong.token")}`
			}
		});

		socket.on("opponent-found", function (data: OponentFoundDTO) {
			console.log(data)
			setOpponentFound(data)
        	router.push('/matchmaking')
		})

		socket.on("game-room-info", function (data: any) {
			console.log(data)
		})

		return () => {
			console.log("disconnect")
			socket.disconnect()
		}
	})

	const value: GameContextType = {
		opponentFound,
		cancel,
		emitPaddleMovement
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}

