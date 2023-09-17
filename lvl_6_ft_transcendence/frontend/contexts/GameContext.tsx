import {
	Ball,
	CANVAS_WIDTH,
	Paddle,
	PADDLE_WALL_OFFSET,
	PADDLE_WIDTH,
} from '@/app/matchmaking/definitions'
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
	countDown: number
	countDownIsTiking: boolean
	emitOnReady: () => void
	emitPaddleMovement: (newY: number) => void
	emitReady: boolean
	forfeit: () => void
	gameEndInfo: GameEndEvent
	inGame: boolean
	leftPlayerScore: number
	opponentFound: OpponentFoundEvent
	opponentPaddle: Paddle | undefined
	opponentPosition: number
	playerPaddle: Paddle | undefined
	queue: () => void
	rightPlayerScore: number
	startCountDown: () => void
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

	const [playerPaddle, setPlayerPaddle] = useState<Paddle>()
	const [opponentPaddle, setOpponentPaddle] = useState<Paddle>()
	const [emitReady, setEmitReady] = useState(false)
	const [countDown, setCountDown] = useState(-1)
	const [countDownIsTiking, setCountDownIsTiking] = useState(false)

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

	function startCountDown() {
		setCountDownIsTiking(true)
		setCountDown(3)
		const interval = setInterval(
			() => setCountDown((prevCount) => prevCount - 1),
			1000
		)

		setTimeout(() => {
			clearInterval(interval)
			setCountDownIsTiking(false)
			setEmitReady(true)
		}, 3 * 1000)
	}

	function onOpponentFound(data: OpponentFoundEvent) {
		setOpponentFound(data)
		clearChallengedName()

		setPlayerPaddle(
			new Paddle(
				emitPaddleMovement,
				data.side === PlayerSide.LEFT
					? PADDLE_WALL_OFFSET
					: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
			)
		)

		setOpponentPaddle(
			new Paddle(
				emitPaddleMovement,
				data.side === PlayerSide.RIGHT
					? PADDLE_WALL_OFFSET
					: CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET
			)
		)

		router.push('/matchmaking')
	}

	useEffect(() => {
		return () => {
			setGameEndInfo({} as GameEndEvent)
			setOpponentFound({} as OpponentFoundEvent)
			forfeit()
		}
	}, [])

	useEffect(() => {
		if (pathname === '/matchmaking' && !hasValues(opponentFound))
			router.push('/dashboard')
		else {
			socket?.on('opponentFound', onOpponentFound)
		}
	}, [socket])

	function onGameRoomInfo(data: GameRoomInfoEvent) {
		if (!data) return

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
		if (!socket) return

		setOpponentFound((prevFound) => {
			const PaddleMoveMessage: PaddleMoveMessage = {
				gameRoomId: prevFound.roomId,
				newY: newY,
			}
			socket.emit('paddleMove', PaddleMoveMessage)

			return prevFound
		})
	}

	function emitOnReady() {
		if (!socket || emitReady) return

		const PlayerReadyMessage: PlayerReadyMessage = {
			gameRoomId: opponentFound.roomId,
		}

		socket.emit('playerReady', PlayerReadyMessage)
		startCountDown()
	}

	const value: GameContextType = {
		ballPosition,
		canCancel: !hasValues(opponentFound),
		cancel,
		countDown,
		countDownIsTiking,
		emitOnReady,
		emitPaddleMovement,
		emitReady,
		forfeit,
		gameEndInfo,
		inGame: hasValues(opponentFound) && !hasValues(gameEndInfo),
		leftPlayerScore,
		opponentFound,
		opponentPaddle,
		opponentPosition,
		playerPaddle,
		queue,
		rightPlayerScore,
		startCountDown,
	}

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
	return useContext(GameContext)
}
