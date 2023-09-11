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
	changeY: () => void,
	newY: number
	countDown: () => void
	inGame: boolean
	leftPlayerScore: number
	countDownIsTiking: boolean
	startCountDown: () => void
	opponentFound: OpponentFoundEvent
	opponentPosition: number
	queue: () => void
	rightPlayerScore: number
	emitReady: boolean
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

	const [emitReady, setEmitReady] = useState(false)
	const [countDown, setCountDown] = useState(-1)
	const [countDownIsTiking, setCountDownIsTiking] = useState(false)

	const [newY, setNewY] = useState(false)

	const [gameEndInfo, setGameEndInfo] = useState<GameEndEvent>(
		{} as GameEndEvent
	)

	const { clearChallengedName } = useFriends()

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

	function changeY() {
		setNewY(prevY => {
				emitPaddleMovement(prevY)
				return prevY
		})
	}

	function startCountDown() {
		setCountDownIsTiking(true)
		setCountDown(3)
		const interval = setInterval(() => setCountDown(prevCount => prevCount - 1), 1000)

		setTimeout(() => {
			clearInterval(interval)
			setCountDownIsTiking(false)
		}, 3 * 1000)
	}

	useEffect(() => {
		if (pathname === '/matchmaking' && !hasValues(opponentFound))
			router.push('/dashboard')
		else {
			socket?.on('opponentFound', function (data: OpponentFoundEvent) {
				setOpponentFound(data)
				clearChallengedName()
				router.push('/matchmaking')
			})

			socket?.on('connect_error', (err: any) => console.log(err))
			socket?.on('connect_failed', (err: any) => console.log(err))
			socket?.on('disconnect', (err: any) => console.log(err))
		}
	}, [])

	function onGameRoomInfo(data: GameRoomInfoEvent) {
		if (opponentFound.side === PlayerSide.LEFT) {
			setOpponentPosition(data.rightPlayer.paddleY)
		} else {
			setOpponentPosition(data.leftPlayer.paddleY)
		}

		setBallPosition(data.ball)
	}

	useEffect(() => {
		socket?.on('gameRoomInfo', onGameRoomInfo)
		return () => {
			socket?.off('gameRoomInfo', onGameRoomInfo)
		}
	}, [opponentFound])

	useEffect(() => {
		if (socket) {
			socket.on('gameEnd', function (data: GameEndEvent) {
				setGameEndInfo(data)
			})

			socket.on('playerScored', function (data: PlayerScoredEvent) {
				setLeftPlayerScore(data.leftPlayerScore)
				setRightPlayerScore(data.rightPlayerScore)
			})

		}
	}, [socket])

	function emitPaddleMovement(newY: number) {
		setNewY(newY)
		if (!socket) return

		const PaddleMoveMessage: PaddleMoveMessage = {
			gameRoomId: opponentFound.roomId,
			newY: newY,
		}

		socket.emit('paddleMove', PaddleMoveMessage)
	}

	function emitOnReady() {
		if (!socket || emitReady) return

		const PlayerReadyMessage: PlayerReadyMessage = {
			gameRoomId: opponentFound.roomId,
		}

		setEmitReady(true)
		socket.emit('playerReady', PlayerReadyMessage)
	}

	const value: GameContextType = {
		ballPosition,
		canCancel: !hasValues(opponentFound),
		cancel,
		emitOnReady,
		countDown,
		startCountDown,
		newY,
		emitPaddleMovement,
		forfeit,
		gameEndInfo,
		countDownIsTiking,
		inGame: hasValues(opponentFound) && !hasValues(gameEndInfo),
		leftPlayerScore,
		opponentFound,
		changeY,
		opponentPosition,
		emitReady,
		queue,
		rightPlayerScore,
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}
