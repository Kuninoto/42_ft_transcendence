import { Ball } from '@/app/matchmaking/definitions'
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
import { GameEndResponse, GameRoomInfoResponse, OpponentFoundResponse, PaddleMoveRequest, PlayerReadyRequest, PlayerScoredResponse, PlayerSide } from '@/common/types'

type GameContextType = {
	ballPosition: Ball
	canCancel: boolean
	cancel: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	gameEndInfo: GameEndResponse
	leftPlayerScore: number
	opponentFound: OpponentFoundResponse
	opponentPosition: number
	queue: () => void
	rightPlayerScore: number
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	const [opponentFound, setOpponentFound] = useState<OpponentFoundResponse>(
		{} as OpponentFoundResponse
	)
	const [opponentPosition, setOpponentPosition] = useState(0)
	const [ballPosition, setBallPosition] = useState<Ball>({} as Ball)

	const [rightPlayerScore, setRightPlayerScore] = useState(0)
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)

	const [gameEndInfo, setGameEndInfo] = useState<GameEndResponse>({} as GameEndResponse)

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
			socket?.on('opponentFound', function (data: OpponentFoundResponse) {
				setOpponentFound(data)
				setTimeout(() => {
					router.push('/matchmaking')
				}, 4 * 1000)
			})

			socket?.on('connect_error', (err: any) => console.log(err))
			socket?.on('connect_failed', (err: any) => console.log(err))
			socket?.on('disconnect', (err: any) => console.log(err))
		}
	}, [])

	useEffect(() => {
		if (
			pathname === '/matchmaking/finding-opponent' &&
			hasValues(opponentFound)
		) {
			socket?.emit('leaveQueueOrGame')
			history.go(2)
			setOpponentFound({} as OpponentFoundResponse)
		}

		return () => {
			if (pathname === '/matchmaking') {
				socket?.emit('leaveQueueOrGame')
				setOpponentFound({} as OpponentFoundResponse)
			}
		}
	}, [pathname])

	useEffect(() => {
		socket?.on('gameRoomInfo', function (data: GameRoomInfoResponse) {
			if (opponentFound.side === PlayerSide.LEFT) {
				setOpponentPosition(data.rightPlayer.paddleY)
			} else {
				setOpponentPosition(data.leftPlayer.paddleY)
			}

			setBallPosition(data.ball)
		})

		socket?.on('gameEnd', function (data: GameEndResponse) {
			setGameEndInfo(data)
		})

		socket?.on('playerScored', function (data: PlayerScoredResponse) {
			setLeftPlayerScore(data.leftPlayerScore)
			setRightPlayerScore(data.rightPlayerScore)
		})
	}, [opponentFound])

	function emitPaddleMovement(newY: number) {
		if (!socket) return

		const PaddleMoveRequest: PaddleMoveRequest = {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		}

		socket.emit('paddleMove', PaddleMoveRequest)
	}

	function emitOnReady() {
		if (!socket) return

		const PlayerReadyRequest: PlayerReadyRequest = {
			gameRoomId: opponentFound.roomId,
		}

		socket.emit('playerReady', PlayerReadyRequest)
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
