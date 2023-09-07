import { api } from '@/api/api'
import {
	ChatRoomInterface,
	Chatter,
	DirectMessageReceivedEvent,
	Friend,
	InvitedToGameEvent,
	NewUserStatusEvent,
	OpponentFoundEvent,
	RespondToGameInviteMessage,
	RoomInviteReceivedEvent,
	RoomMessageReceivedEvent,
	RoomWarning,
	RoomWarningEvent,
	SendGameInviteMessage,
	SendMessageSMessage,
} from '@/common/types'
import { UUID } from 'crypto'
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'
import { toast } from 'react-toastify'
import { nanoid } from 'nanoid';
import { useAuth } from './AuthContext'
import { socket } from './SocketContext'

type FriendsContextType = {
	changeOpenState: () => void
	close: (id: number, isRoom: boolean) => void
	closeAll: () => void
	currentOpenChat: IChat
	exists: boolean
	exitRoom: (id: number) => void
	focus: (id: number, isRoom: boolean) => void
	friends: Friend[]
	isOpen: boolean
	newFriendNotification: boolean
	open: (id: number, isRoom: boolean) => void
	openChats: IChat[]
	refreshFriends: () => void
	refreshRooms: () => void
	removeInvite: (id: UUID) => void
	respondGameInvite: (accepted: boolean) => void
	rooms: ChatRoomInterface[]
	seeNewFriendNotification: () => void
	sendGameInvite: (id: string) => void
	sendMessage: (message: string) => void
}

interface Message {
	author?: Chatter
	content: string
	sendByMe: boolean
	uniqueID: string
}

interface Warning {
	warning: string
}

interface Invite {
	game: boolean
	id: UUID // Challenge id or invite id
	roomName?: string
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
	const { isAuth, refreshUser, user } = useAuth()

	const [friends, setFriends] = useState<[] | Friend[]>([])
	const [rooms, setRooms] = useState<[] | ChatRoomInterface[]>([])

	const [openChats, setOpenChats] = useState<[] | IChat[]>([])
	const [currentOpenChat, setCurrentOpenChat] = useState<IChat>({} as IChat)

	const [isOpen, setIsOpen] = useState(false)
	const [exists, setExists] = useState(false)
	const [newFriendNotification, setNewFriendNotification] = useState(false)

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

		if (
			warningType === RoomWarning.BAN ||
			warningType === RoomWarning.KICK ||
			warningType === RoomWarning.OWNER_LEFT
		) {
			setOpenChats((prevChat: any) => {
				const newChat = [...prevChat]

				const update = newChat?.map((chat) => {
					if ('room' in chat && chat.room.id === id) {
						return { ...chat, canWrite: false }
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

				const index = newChat?.findIndex((chat) => {
					if ('room' in chat) {
						if ('id' in data) return chat.room.id === data.id
						if ('roomId' in data && !('inviteId' in data))
							return chat.room.id === data.roomId
						return false
					}
					if ('author' in data && !('id' in data))
						return chat.friend.uid === data.author.id
					if ('inviterUID' in data) return chat.friend.uid === data.inviterUID
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

				if (index === -1) {
					if ('id' in data || 'warning' in data) {
						const room = rooms.find((room) => {
							if ('id' in data) return room.id === data.id
							return room.id === data.roomId
						})
						if (!room) throw 'error'

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
							return friend.uid === data.inviterUID
						})

						if (!friend) throw 'error'

						newChat.push({
							display: true,
							friend,
							messages: [newMessage],
							unread: true,
						})
					}

					if (newChat.length === 1) {
						setCurrentOpenChat(newChat[0])
					}
				} else {
					newChat[index].unread = true
					newChat[index].display = true
					newChat[index]?.messages.unshift(newMessage)
				}
				return newChat
			})
			setExists(true)
		},
		[friends, rooms, actionBasedOnWarning]
	)

	function updateFriendStatus(data: NewUserStatusEvent) {
		setFriends((prevFriends) => {
			const newFriends = [...prevFriends]
			const index = newFriends.findIndex((friend) => friend.uid === data.uid)

			newFriends[index].status = data.newStatus
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

	function removeInvite(id: UUID) {
		setOpenChats((prevChats) => {
			return prevChats.map((chat) => {
				return {
					...chat,
					messages: chat.messages.filter((message) => {
						if ('game' in message) return message.id !== id
						return true
					}),
				}
			})
		})

		if ('friend' in currentOpenChat) {
			focus(currentOpenChat.friend.uid, false)
		}
	}

	function exitRoom(id: number) {
		setOpenChats((prevChats) => {
			if (!prevChats) return []

			const newChat = [...prevChats]

			const updatedChat = newChat.filter((chat) => {
				if (!('room' in chat)) return true
				return chat.room.id !== id
			})

			if ('room' in currentOpenChat && currentOpenChat?.room?.id === id) {
				const oneDisplay: IChat | undefined = updatedChat.find(
					(chat) => chat.display
				)

				if (oneDisplay) {
					setCurrentOpenChat(oneDisplay)
				}

				if (exists) {
					setExists(!!oneDisplay)
				}
			}
			return updatedChat
		})

		getRooms()
	}

	// ======================== Direct messages ========================

	function sendGameInvite(id: string) {
		if (!socket) return

		const newGameInvite: SendGameInviteMessage = {
			recipientUID: id,
		}

		socket.emit('sendGameInvite', newGameInvite)

		const newMessage: Warning = {
			warning: 'Invite sent',
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

	function respondGameInvite(accepted: boolean) {
		if (!socket) return

		// parameter in user
		const response: RespondToGameInviteMessage = {
			accepted,
			inviteId: 2,
		}
		socket.emit(
			'respondToGameInvite',
			response,
			(response: OpponentFoundEvent) => {
				console.log(response)
			}
		)
	}

	const value: FriendsContextType = {
		changeOpenState: () => setIsOpen((prevState) => !prevState),
		close,
		closeAll,
		currentOpenChat,
		exists,
		exitRoom,
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
