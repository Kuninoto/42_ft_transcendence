import { Ball } from '@/app/matchmaking/definitions'
import { PlayerSide } from '@/common/types/backend'
import { GameEndDTO } from '@/common/types/game-end.dto'
import { GameRoomDTO } from '@/common/types/game-room-info'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { PaddleMoveDTO } from '@/common/types/paddle-move.dto'
import { PlayerReadyDTO } from '@/common/types/player-ready.dto'
import { PlayerScoredDTO } from '@/common/types/player-scored.dto'
import { hasValues } from '@/common/utils/hasValues'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

import { socket } from './SocketContext'

type GameContextType = {
	ballPosition: Ball
	canCancel: boolean
	cancel: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	gameEndInfo: GameEndDTO
	leftPlayerScore: number
	opponentFound: OponentFoundDTO
	opponentPosition: number
	queue: () => void
	rightPlayerScore: number
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	const [opponentFound, setOpponentFound] = useState<OponentFoundDTO>(
		{} as OponentFoundDTO
	)
	const [opponentPosition, setOpponentPosition] = useState(0)
	const [ballPosition, setBallPosition] = useState<Ball>({} as Ball)

	const [rightPlayerScore, setRightPlayerScore] = useState(0)
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)

	const [gameEndInfo, setGameEndInfo] = useState<GameEndDTO>({} as GameEndDTO)

	const router = useRouter()
	const pathname = usePathname()

	function cancel() {
		router?.push('/dashboard')

		if (!socket) return
		socket?.emit('leaveQueueOrGame')
	}

	function queue() {
		if (!socket) return

		socket.emit('queueToLadder', {})
	}

	useEffect(() => {
		if (pathname === '/matchmaking' && !hasValues(opponentFound))
			router.push('/dashboard')
		else {
			socket?.on('opponentFound', function(data: OponentFoundDTO) {
				setOpponentFound(data)
				setTimeout(() => {
					router.push('/matchmaking')
				}, 10000)
			})

			socket?.on('connect_error', (err) => console.log(err))
			socket?.on('connect_failed', (err) => console.log(err))
			socket?.on('disconnect', (err) => console.log(err))
		}
	}, [])

	useEffect(() => {
		if (
			pathname === '/matchmaking/finding-opponent' &&
			hasValues(opponentFound)
		) {
			history.go(1)
			socket?.emit('leaveQueueOrGame')
		}
	}, [pathname])

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
		})

		socket?.on('playerScored', function(data: PlayerScoredDTO) {
			setLeftPlayerScore(data.leftPlayerScore)
			setRightPlayerScore(data.rightPlayerScore)
		})
	}, [opponentFound])

	function emitPaddleMovement(newY: number) {
		if (!socket) return

		const paddleMoveDTO: PaddleMoveDTO = {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		}

		socket.emit('paddleMove', paddleMoveDTO)
	}

	function emitOnReady() {
		if (!socket) return

		const playerReadyDTO: PlayerReadyDTO = {
			gameRoomId: opponentFound.roomId,
		}

		socket.emit('playerReady', playerReadyDTO)
	}

	const value: GameContextType = {
		ballPosition,
		canCancel: !hasValues(opponentFound),
		cancel,
		emitOnReady,
		emitPaddleMovement,
		gameEndInfo,
		leftPlayerScore,
		opponentFound,
		opponentPosition,
		queue,
		rightPlayerScore,
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}
