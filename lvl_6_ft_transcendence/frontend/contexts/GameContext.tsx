import io from "socket.io-client";
import { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'
import { OponentFoundDTO } from "@/common/types/oponent-found";
import { useRouter } from 'next/navigation'
import { GameRoomDTO } from "@/common/types/game-room-info";
import { PlayerSide } from "@/common/types/backend/player-side.enum";
import { Ball } from "@/app/matchmaking/definitions";
import { PlayerScoredDTO } from "@/common/types/player-scored.dto";
import { GameEndDTO } from "@/common/types/game-end.dto";
import { useAuth } from "./AuthContext";

let socket : io

type GameContextType = {
	opponentFound: OponentFoundDTO
	cancel: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	opponentPosition: number
	ballPosition: Ball
	rightPlayerScore: number
	leftPlayerScore: number
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	
	const { user } = useAuth()

    const [ opponentFound, setOpponentFound ] = useState<OponentFoundDTO>({} as OponentFoundDTO)
    const [ opponentPosition, setOpponentPosition ] = useState(0)
    const [ ballPosition, setBallPosition ] = useState<Ball>({})
	
    const [ rightPlayerScore, setRightPlayerScore ] = useState(0)
    const [ leftPlayerScore, setLeftPlayerScore ] = useState(0)

	const router = useRouter()

	function cancel() {
		router.push('/dashboard')
	}

	function emitPaddleMovement(newY: number) {
		socket.emit("paddle-move", {
			gameRoomId: opponentFound.roomId,
			newY: newY
		})
	}

	function emitOnReady() {
		socket.emit("player-ready", {
			gameRoomId: opponentFound.roomId
		})
	}
	
	useEffect(() => {
		const handleBeforeUnload = (event) => {
			event.preventDefault();
			event.returnValue = "monkey";
		};
	
		window.addEventListener('beforeunload', handleBeforeUnload);
	
		return () => {
		  window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	  }, []);


	useEffect(() => {

		socket = io("http://localhost:3000/game-gateway", {
			extraHeaders: {
			  Authorization: `Bearer ${localStorage.getItem("pong.token")}`
			}
		});

		socket.on("opponent-found", function (data: OponentFoundDTO) {
			setOpponentFound(data)
        	router.push('/matchmaking')
		})

		return () => {
			socket.disconnect()
		}

	}, [])

	useEffect(() => {

		socket.on("game-room-info", function (data: GameRoomDTO) {
			if (opponentFound.side === PlayerSide.LEFT ) {
				setOpponentPosition(data.rightPlayer.paddleY)
			} else {
				setOpponentPosition(data.leftPlayer.paddleY)
			}

			setBallPosition(data.ball)
		})


		socket.on('game-end', function (data: GameEndDTO) {
			if (data.winner.userId === user.id)
				console.log("winner")
			else
				console.log("loser")
			console.log(data)
		} )

		socket.on('player-scored', function (data: PlayerScoredDTO ) {
			setLeftPlayerScore(data.leftPlayerScore)
			setRightPlayerScore(data.rightPlayerScore)
		} )

	}, [opponentFound])

	const value: GameContextType = {
		opponentFound,
		cancel,
		emitOnReady,
		emitPaddleMovement,
		opponentPosition,
		ballPosition,
		rightPlayerScore,
		leftPlayerScore,
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}

