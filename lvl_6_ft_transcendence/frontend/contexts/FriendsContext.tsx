import { api } from '@/api/api'
import {
	ChatRoomInterface,
	DirectMessageReceivedEvent,
	Friend,
	InvitedToGameEvent,
	NewUserStatusEvent,
	RoomInviteReceivedEvent,
	RoomMessageReceivedEvent,
	RoomWarning,
	RoomWarningEvent,
	SendMessageSMessage,
	UserBasicProfile,
} from '@/common/types'
import { SendGameInviteRequest } from '@/common/types/game/request'
import { RespondToGameInviteRequest } from '@/common/types/game/request/respond-to-game-invite-request'
import { GameInviteCanceledEvent } from '@/common/types/game/socket/event/game-invite-canceled-event.interface'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'
import { toast } from 'react-toastify'

import { useAuth } from './AuthContext'
import { socket } from './SocketContext'

type FriendsContextType = {
	challengeInfo: Challenge
	changeOpenState: () => void
	clearChallengedName: () => void
	close: (id: number, isRoom: boolean) => void
	closeAll: () => void
	currentOpenChat: IChat
	exists: boolean
	focus: (id: number, isRoom: boolean) => void
	friends: Friend[]
	isOpen: boolean
	newFriendNotification: boolean
	open: (id: number, isRoom: boolean) => void
	openChats: IChat[]
	refreshFriends: () => void
	refreshRooms: () => void
	removeInvite: (id: string) => void
	respondGameInvite: (name: string, id: string, accepted: boolean) => void
	rooms: ChatRoomInterface[]
	seeNewFriendNotification: () => void
	sendGameInvite: (name: string, id: number) => void
	sendMessage: (message: string) => void
}

interface Message {
	author?: UserBasicProfile
	content: string
	sendByMe: boolean
	uniqueID: string
}

interface Warning {
	warning: string
}

interface Invite {
	game: boolean
	id: string // Challenge id or invite id
	roomName?: string
}

interface Challenge {
	invite: boolean
	opponentName: string
}

type IChat = (
	| {
			canWrite: boolean
			room: ChatRoomInterface
	  }
	| {
			friend: Friend
	  }
) & {
	display: boolean
	messages: (Invite | Message | Warning)[]
	unread: boolean
}

const FriendsContext = createContext<FriendsContextType>(
	{} as FriendsContextType
)

export function FriendsProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const { isAuth, refreshUser, user } = useAuth()

	const [friends, setFriends] = useState<[] | Friend[]>([])
	const [rooms, setRooms] = useState<[] | ChatRoomInterface[]>([])

	const [openChats, setOpenChats] = useState<[] | IChat[]>([])
	const [currentOpenChat, setCurrentOpenChat] = useState<IChat>({} as IChat)

	const [isOpen, setIsOpen] = useState(false)
	const [exists, setExists] = useState(false)
	const [newFriendNotification, setNewFriendNotification] = useState(false)

	const [challengeInfo, setChallengeInfo] = useState<Challenge>({} as Challenge)

	// ======================== General ========================

	const getFriends = useCallback(
		function () {
			try {
				if (isAuth) {
					api
						.get('/me/friendlist')
						.then((result) => {
							setFriends(result.data)
						})
						.catch(() => {
							throw 'Network error'
						})
				}
			} catch (error: any) {
				toast.error(error)
			}
		},
		[isAuth]
	)

	const getRooms = useCallback(
		function () {
			try {
				if (isAuth) {
					api
						.get('/me/rooms')
						.then((result) => {
							setRooms(result.data)
						})
						.catch(() => {
							throw 'Network error'
						})
				}
			} catch (error: any) {
				toast.error(error)
			}
		},
		[isAuth]
	)

	useEffect(() => {
		getFriends()
	}, [getFriends])

	useEffect(() => {
		getRooms()
	}, [getRooms])

	// ======================== General messages ========================

	function closeAll() {
		setOpenChats((prevChats) =>
			prevChats
				.filter((chat) => ('room' in chat && chat.canWrite) || 'friend' in chat)
				.map((chat) => ({ ...chat, display: false }))
		)
		setExists(false)
	}

	function open(id: number, isRoom: boolean) {
		setIsOpen(true)
		setExists(true)

		const index = openChats?.findIndex((chat) => {
			if (!isRoom && 'friend' in chat) return chat.friend.uid === id
			if (isRoom && 'room' in chat) return chat.room.id === id
			return false
		})

		if (index !== -1) {
			focus(id, isRoom)
			return
		}

		if (isRoom) {
			const room = rooms.find((room) => room.id === id)
			if (!room) return

			const newRoom: IChat = {
				canWrite: true,
				display: true,
				messages: [],
				room,
				unread: false,
			}

			setOpenChats([newRoom, ...openChats])
			setCurrentOpenChat(newRoom)
		} else {
			const friend = friends.find((friend: Friend) => friend.uid === id)
			if (!friend) return

			const newChat: IChat = {
				display: true,
				friend,
				messages: [],
				unread: false,
			}

			setOpenChats([newChat, ...openChats])
			setCurrentOpenChat(newChat)
		}
	}

	function focus(id: number, isRoom: boolean) {
		setOpenChats((prevChat) => {
			if (!prevChat) return []
			const newChat = [...prevChat]

			const read = newChat?.map((chat) => {
				if (
					(isRoom && 'room' in chat && chat.room.id === id) ||
					(!isRoom && 'friend' in chat && chat.friend.uid === id)
				) {
					return { ...chat, display: true, unread: false }
				}
				return chat
			})

			setCurrentOpenChat(() => {
				const newCurrent = newChat.find((chat) => {
					if (isRoom && 'room' in chat) return chat.room.id === id
					if (!isRoom && 'friend' in chat) return chat.friend.uid === id
					return false
				})

				if (!newCurrent) return {} as IChat
				return newCurrent
			})

			return read
		})
	}

	function close(id: number, isRoom: boolean) {
		setOpenChats((prevChats) => {
			const newChat = [...prevChats]

			const currentId =
				'room' in currentOpenChat
					? currentOpenChat.room.id
					: currentOpenChat.friend.uid

			const index = newChat?.findIndex((chat) => {
				if (isRoom && 'room' in chat) return chat.room.id === id
				if (!isRoom && 'friend' in chat) return chat.friend.uid === id

				return false
			})

			const closedChat = newChat[index]
			closedChat.display = false

			const oneDisplay: IChat | undefined = newChat.find((chat) => chat.display)
			setExists(!!oneDisplay)

			if (oneDisplay && currentId === id) {
				setCurrentOpenChat(oneDisplay)
			}

			if (
				('room' in closedChat && !closedChat.canWrite) ||
				'friend' in closedChat
			) {
				return newChat.filter(
					(chat) => ('room' in chat && chat.room.id !== id) || 'friend' in chat
				)
			}
			return newChat
		})
	}

	function actionBasedOnWarning(warningType: RoomWarning, id: number) {
		getRooms()

		const write = warningType === RoomWarning.UNMUTE ? true : false

		if (
			warningType === RoomWarning.BAN ||
			warningType === RoomWarning.KICK ||
			warningType === RoomWarning.LEAVE ||
			warningType === RoomWarning.MUTE ||
			warningType === RoomWarning.UNMUTE ||
			warningType === RoomWarning.OWNER_LEFT
		) {
			setOpenChats((prevChat: any) => {
				const newChat = [...prevChat]

				const update = newChat?.map((chat) => {
					if ('room' in chat && chat.room.id === id) {
						return { ...chat, canWrite: write }
					}
					return chat
				})
				return update
			})

			if ('room' in currentOpenChat && currentOpenChat.room.id === id) {
				focus(id, true)
			}
		}
	}

	const onMessageReceived = useCallback(
		function (
			data:
				| DirectMessageReceivedEvent
				| InvitedToGameEvent
				| RoomInviteReceivedEvent
				| RoomMessageReceivedEvent
				| RoomWarningEvent
		) {
			setOpenChats((prevChat) => {
				const newChat = [...prevChat]

				const isRoom = 'id' in data || 'warning' in data
				const id =
					'author' in data && !('id' in data)
						? data.author.id
						: 'inviterUID' in data
						? data.inviterUID
						: 'id' in data
						? data.id
						: data.roomId

				const index = newChat?.findIndex((chat) => {
					if (isRoom && 'room' in chat) return chat.room.id == id
					if (!isRoom && 'friend' in chat) return chat.friend.uid == id
					return false
				})

				if (
					'warning' in data &&
					(data.affectedUID == user.id ||
						data.warningType === RoomWarning.OWNER_LEFT)
				) {
					actionBasedOnWarning(data.warningType, data.roomId)
				}

				const newMessage: Invite | Message | Warning =
					'warning' in data
						? {
								warning: data.warning,
						  }
						: 'inviteId' in data
						? {
								game: !('roomName' in data),
								id: data.inviteId,
								roomName: 'roomName' in data ? data.roomName : undefined,
						  }
						: {
								author: data.author,
								content: data.content,
								uniqueID: data.uniqueId,
						  }

				const instantlyRead =
					(isRoom &&
						'room' in currentOpenChat &&
						id == currentOpenChat.room.id) ||
					(!isRoom &&
						'friend' in currentOpenChat &&
						id == currentOpenChat.friend.uid)

				if (index === -1) {
					if (isRoom) {
						const room = rooms.find((room) => {
							if ('id' in data) return room.id === data.id
							return room.id === data.roomId
						})
						if (!room) return []

						newChat.push({
							canWrite: true,
							display: true,
							messages: [newMessage],
							room,
							unread: true,
						})
					} else {
						const friend = friends.find((friend) => {
							if ('author' in data) return friend.uid === data.author.id
							return friend.uid == data.inviterUID
						})

						if (!friend) return []

						newChat.push({
							display: true,
							friend,
							messages: [newMessage],
							unread: true,
						})
					}
				} else {
					newChat[index].unread = !instantlyRead
					newChat[index].display = true
					newChat[index]?.messages.unshift(newMessage)
				}

				if (
					newChat.length === 1 ||
					newChat.filter((chat) => chat.display).length === 1
				) {
					const oneDisplay: IChat | undefined = newChat.find(
						(chat) => chat.display
					)
					if (oneDisplay) setCurrentOpenChat(oneDisplay)
				}
				return newChat
			})
			setExists(true)
		},
		[friends, rooms, actionBasedOnWarning, exists, currentOpenChat]
	)

	function updateFriendStatus(data: NewUserStatusEvent) {
		setFriends((prevFriends) => {
			const newFriends = [...prevFriends]
			const index = newFriends.findIndex((friend) => friend.uid === data.uid)

			if (index !== -1) {
				newFriends[index].status = data.newStatus
			}
			return newFriends
		})
	}

	function sendMessage(message: string) {
		if (!socket) return

		const isRoom = 'room' in currentOpenChat
		const id = isRoom ? currentOpenChat?.room?.id : currentOpenChat?.friend?.uid

		const SendMessageSMessage: SendMessageSMessage = {
			content: message,
			receiverId: parseInt(id),
			uniqueId: nanoid(),
		}

		if ('room' in currentOpenChat) {
			socket.emit('sendChatRoomMessage', SendMessageSMessage)
		} else {
			socket.emit('sendDirectMessage', SendMessageSMessage)
		}

		const newMessage: Message = {
			content: message,
			sendByMe: true,
			uniqueID: SendMessageSMessage.uniqueId,
		}

		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex((chat) => {
				if (isRoom && 'room' in chat) return chat.room.id === id
				if (!isRoom && 'friend' in chat) return chat.friend.uid === id
				return false
			})

			newChat[index]?.messages.unshift(newMessage)
			return newChat
		})
	}

	function onInviteDeclined() {
		console.log("gameInviteDeclined received");
		router.push('/dashboard')
	}

	useEffect(() => {
		if (socket) {
			socket.on('friendRequestReceived', function () {
				setNewFriendNotification(true)
			})

			socket.on('refreshUser', function () {
				refreshUser()
				getFriends()
				getRooms()
			})

			socket.on('newUserStatus', updateFriendStatus)

			socket.on('gameInviteCanceled', function (data: GameInviteCanceledEvent) {
				console.log("gameInviteCanceled received");
				if (!data) return
				removeInvite(data.inviteId)
			})

			socket.on('gameInviteDeclined', function() {
				router.push('/dashboard')
			})
		}
	}, [socket])

	useEffect(() => {
		if (socket) {
			socket.on('directMessageReceived', onMessageReceived)
			socket.on('newChatRoomMessage', onMessageReceived)
			socket.on('roomWarning', onMessageReceived)
			socket.on('invitedToGame', onMessageReceived)
			socket.on('roomInviteReceived', onMessageReceived)

			return () => {
				socket.off('directMessageReceived', onMessageReceived)
				socket.off('newChatRoomMessage', onMessageReceived)
				socket.off('roomWarning', onMessageReceived)
				socket.off('invitedToGame', onMessageReceived)
				socket.off('roomInviteReceived', onMessageReceived)
			}
		}
	}, [onMessageReceived])

	// ======================== Room messages ========================

	function removeInvite(id: string) {
		setOpenChats((prevChats) => {
			if (!prevChats) return []
			const newChats = [...prevChats]
	
			const updated = newChats.map((chat) => {
				return {
					...chat,
					messages: chat.messages.filter((message) => {
						if ('game' in message) return message.id != id
						return true
					}),
				}
			})

			return updated
		})

	}

	// ======================== Direct messages ========================

	function sendGameInvite(name: string, id: number) {
		if (!socket) return

		const newGameInvite: SendGameInviteRequest = {
			receiverUID: parseInt(id),
		}

		try {
			api
				.post(`/game/invite`, newGameInvite)
				.then(() => {
					setChallengeInfo({
						invite: true,
						name,
					})
					router.push('/matchmaking/challenge')
				})
				.catch(() => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.warning(error)
		}

		const newMessage: Warning = {
			warning: 'Game invite sent',
		}

		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex((chat) => {
				if ('friend' in chat) {
					return chat.friend.uid == parseInt(id)
				}
				return false
			})

			newChat[index]?.messages.unshift(newMessage)
			return newChat
		})
	}

	function respondGameInvite(name: string, id: string, accepted: boolean) {
		if (!socket) return

		// parameter in user
		const response: RespondToGameInviteRequest = {
			accepted,
		}

		try {
			api
				.patch(`/game/${id}/status`, response)
				.then(() => {
					if (!accepted) return
					setChallengeInfo({ invite: false, name })
					router.push('/matchmaking/challenge')
				})
				.catch(() => {
					throw 'Network error'
				})
				.finally(() => {
					removeInvite(id)
				})
		} catch (error: any) {
			toast.warning(error)
		}
	}

	const value: FriendsContextType = {
		challengeInfo,
		changeOpenState: () => setIsOpen((prevState) => !prevState),
		clearChallengedName: () => setChallengeInfo({} as Challenge),
		close,
		closeAll,
		currentOpenChat,
		exists,
		focus,
		friends,
		isOpen,
		newFriendNotification,
		open,
		openChats,
		refreshFriends: getFriends,
		refreshRooms: getRooms,
		removeInvite,
		respondGameInvite,
		rooms,
		seeNewFriendNotification: () => setNewFriendNotification(false),
		sendGameInvite,
		sendMessage,
	}

	return (
		<FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
	)
}

export function useFriends() {
	return useContext(FriendsContext)
}
