import { Ball } from '@/app/matchmaking/definitions'
import { PlayerSide } from '@/common/types/backend/player-side.enum'
import { GameEndDTO } from '@/common/types/game-end.dto'
import { GameRoomDTO } from '@/common/types/game-room-info'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { PlayerScoredDTO } from '@/common/types/player-scored.dto'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

import { useAuth } from './AuthContext'
import { socket } from './SocketContext'
import { hasValues } from '@/common/utils/hasValues'

type GameContextType = {
	ballPosition: Ball
	cancel: () => void
	queue: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	leftPlayerScore: number
	opponentFound: OponentFoundDTO
	opponentPosition: number
	rightPlayerScore: number
	gameEndInfo: GameEndDTO
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth()

	const [opponentFound, setOpponentFound] = useState<OponentFoundDTO>(
		{} as OponentFoundDTO
	)
	const [opponentPosition, setOpponentPosition] = useState(0)
	const [ballPosition, setBallPosition] = useState<Ball>({} as Ball)

	const [rightPlayerScore, setRightPlayerScore] = useState(0)
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)

	const [ gameEndInfo, setGameEndInfo ] = useState<GameEndDTO>({} as GameEndDTO) 

	const router = useRouter()
	const pathname = usePathname()

	function cancel() {
		router?.push('/dashboard')
	}

	function queue() {
		socket?.emit('queueToLadder', {})
	}

	useEffect(() => {

		if (pathname === "/matchmaking" && !hasValues(opponentFound))
			router.push("/dashboard")
		else {
			socket?.on('opponentFound', function(data: OponentFoundDTO) {
				setOpponentFound(data)
				router.push('/matchmaking')
			})

			socket?.on('connect_error', err => console.log(err))
			socket?.on('connect_failed', err => console.log(err))
			socket?.on('disconnect', err => console.log(err))
		}

	}, [])

	useEffect(() => {

		socket?.on('gameRoomInfo', function(data: GameRoomDTO) {
			if (opponentFound.side === PlayerSide.LEFT) {
				setOpponentPosition(data.rightPlayer.paddleY)
			} else {
				setOpponentPosition(data.leftPlayer.paddleY)
			}

			setBallPosition(data.ball)
		})

		socket?.on('gameEnd', function(data: GameEndDTO) {
			setGameEndInfo(data)
			if (data.winner.userId === user.id) console.log('winner')
			else console.log('loser')
			console.log(data)
		})

		socket?.on('playerScored', function(data: PlayerScoredDTO) {
			setLeftPlayerScore(data.leftPlayerScore)
			setRightPlayerScore(data.rightPlayerScore)
		})
	}, [opponentFound])


	function emitPaddleMovement(newY: number) {
		if (!socket) return
		socket.emit('paddleMove', {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		})
	}

	function emitOnReady() {

		if (!socket) return

		socket.emit('playerReady', {
			gameRoomId: opponentFound.roomId,
		})
	}

	const value: GameContextType = {
		ballPosition,
		cancel,
		queue,
		emitOnReady,
		emitPaddleMovement,
		leftPlayerScore,
		opponentFound,
		opponentPosition,
		rightPlayerScore,
		gameEndInfo,
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}
