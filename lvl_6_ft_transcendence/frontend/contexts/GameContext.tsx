import { api } from '@/api/api'
import { Ball } from '@/app/matchmaking/definitions'
import {
	GameEndEvent,
	GameRoomInfoEvent,
	OpponentFoundEvent,
	PaddleMoveMessage,
	PlayerReadyMessage,
	PlayerScoredEvent,
	PlayerSide,
} from '@/common/types'
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

import { useFriends } from './FriendsContext'
import { socket } from './SocketContext'

type GameContextType = {
	ballPosition: Ball
	canCancel: boolean
	cancel: () => void
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	forfeit: () => void
	gameEndInfo: GameEndEvent
	inGame: boolean
	leftPlayerScore: number
	opponentFound: OpponentFoundEvent
	opponentPosition: number
	queue: () => void
	rightPlayerScore: number
}

const GameContext = createContext<GameContextType>({} as GameContextType)

export function GameProvider({ children }: { children: ReactNode }) {
	const [opponentFound, setOpponentFound] = useState<OpponentFoundEvent>(
		{} as OpponentFoundEvent
	)
	const [opponentPosition, setOpponentPosition] = useState(0)
	const [ballPosition, setBallPosition] = useState<Ball>({} as Ball)

	const [rightPlayerScore, setRightPlayerScore] = useState(0)
	const [leftPlayerScore, setLeftPlayerScore] = useState(0)

	const [gameEndInfo, setGameEndInfo] = useState<GameEndEvent>(
		{} as GameEndEvent
	)

	const { clearChallengedName, removeInvite } = useFriends()

	const router = useRouter()
	const pathname = usePathname()

	function forfeit() {
		if (!socket) return
		socket.emit('leaveQueueOrGame')
	}

	function cancel() {
		forfeit()
		router.push('/dashboard')
	}

	function queue() {
		if (!socket) return
		socket.emit('queueToLadder', {})
	}

	useEffect(() => {
		if (pathname === '/matchmaking' && !hasValues(opponentFound))
			router.push('/dashboard')
		else {
			socket?.on('opponentFound', function (data: OpponentFoundEvent) {
				setOpponentFound(data)
				clearChallengedName()
				setTimeout(() => {
					router.push('/matchmaking')
				}, 2 * 1000)
			})

			socket?.on('connect_error', (err: any) => console.log(err))
			socket?.on('connect_failed', (err: any) => console.log(err))
			socket?.on('disconnect', (err: any) => console.log(err))
		}
	}, [])

	useEffect(() => {
		socket?.on('gameRoomInfo', function (data: GameRoomInfoEvent) {
			if (opponentFound.side === PlayerSide.LEFT) {
				setOpponentPosition(data.rightPlayer.paddleY)
			} else {
				setOpponentPosition(data.leftPlayer.paddleY)
			}

			setBallPosition(data.ball)
		})
	}, [opponentFound])

	useEffect(() => {
		if (socket) {
			socket.once('gameEnd', function (data: GameEndEvent) {
				setGameEndInfo(data)
			})

			socket.on('playerScored', function (data: PlayerScoredEvent) {
				setLeftPlayerScore(data.leftPlayerScore)
				setRightPlayerScore(data.rightPlayerScore)
			})

			socket.once('gameInviteCanceled', function (data: any) {
				if (!data) return
				removeInvite(data.inviteId)
			})
		}
	}, [socket])

	function emitPaddleMovement(newY: number) {
		if (!socket) return

		const PaddleMoveMessage: PaddleMoveMessage = {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		}

		socket.emit('paddleMove', PaddleMoveMessage)
	}

	function emitOnReady() {
		if (!socket) return

		const PlayerReadyMessage: PlayerReadyMessage = {
			gameRoomId: opponentFound.roomId,
		}

		socket.emit('playerReady', PlayerReadyMessage)
	}

	const value: GameContextType = {
		ballPosition,
		canCancel: !hasValues(opponentFound),
		cancel,
		emitOnReady,
		emitPaddleMovement,
		forfeit,
		gameEndInfo,
		inGame: hasValues(opponentFound) && !hasValues(gameEndInfo),
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
