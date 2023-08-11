<<<<<<< HEAD
import { Ball } from '@/app/matchmaking/definitions'
import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { GameRoomDTO } from '@/common/types/game-room-info'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { useRouter } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'
import io from 'socket.io-client'
=======
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
>>>>>>> origin/frontend

let socket: io

type GameContextType = {
	ballPosition: Ball
	cancel: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	opponentFound: OponentFoundDTO
	opponentPosition: number
<<<<<<< HEAD
=======
	ballPosition: Ball
	rightPlayerScore: number
	leftPlayerScore: number
>>>>>>> origin/frontend
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
	const [opponentFound, setOpponentFound] = useState<OponentFoundDTO>(
		{} as OponentFoundDTO
	)
	const [opponentPosition, setOpponentPosition] = useState(0)
	const [ballPosition, setBallPosition] = useState<Ball>({} as Ball)
=======
	
	const { user } = useAuth()

    const [ opponentFound, setOpponentFound ] = useState<OponentFoundDTO>({} as OponentFoundDTO)
    const [ opponentPosition, setOpponentPosition ] = useState(0)
    const [ ballPosition, setBallPosition ] = useState<Ball>({})
	
    const [ rightPlayerScore, setRightPlayerScore ] = useState(0)
    const [ leftPlayerScore, setLeftPlayerScore ] = useState(0)
>>>>>>> origin/frontend

	const router = useRouter()

	function cancel() {
		router.push('/dashboard')
	}

	function emitPaddleMovement(newY: number) {
		socket.emit('paddle-move', {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		})
	}

<<<<<<< HEAD
=======
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


>>>>>>> origin/frontend
	useEffect(() => {
		socket = io('http://localhost:3000/game-gateway', {
			extraHeaders: {
				Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
			},
		})

		socket.on('opponent-found', function (data: OponentFoundDTO) {
			setOpponentFound(data)
			router.push('/matchmaking')
		})

		return () => {
<<<<<<< HEAD
			console.log('disconnect')
=======
>>>>>>> origin/frontend
			socket.disconnect()
		}
	}, [])

	useEffect(() => {
		socket.on('game-room-info', function (data: GameRoomDTO) {
			if (opponentFound.side === PlayerSide.LEFT) {
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
<<<<<<< HEAD
		})
=======
		} )

		socket.on('player-scored', function (data: PlayerScoredDTO ) {
			setLeftPlayerScore(data.leftPlayerScore)
			setRightPlayerScore(data.rightPlayerScore)
		} )

>>>>>>> origin/frontend
	}, [opponentFound])

	const value: GameContextType = {
		ballPosition,
		cancel,
		emitOnReady,
		emitPaddleMovement,
		opponentFound,
		opponentPosition,
<<<<<<< HEAD
=======
		ballPosition,
		rightPlayerScore,
		leftPlayerScore,
>>>>>>> origin/frontend
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}
