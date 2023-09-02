import { api } from '@/api/api'
import { ChatRoomInterface, Chatter, Friend } from '@/common/types/backend'
import { ChatRoomRoles } from '@/common/types/backend/chat/chat-room-roles.enum'
import { RoomWarningType } from '@/common/types/backend/chat/room-warning.enum'
import { DirectMessageReceivedDTO } from '@/common/types/direct-message-received.dto'
import { InvitedToGameDTO } from '@/common/types/invited-to-game.dto'
import { NewUserStatusDTO } from '@/common/types/new-user-status.dto'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { RespondToGameInviteDTO } from '@/common/types/respond-to-game-invite.dto'
import { RoomMessageReceivedDTO } from '@/common/types/room-message-received.dto'
import { RoomWarningDTO } from '@/common/types/room-warning.dto'
import { SendGameInviteDTO } from '@/common/types/send-game-invite.dto'
import { SendMessageDTO } from '@/common/types/send-message.dto'
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
	rejectChallenge: (id: number) => void
	respondGameInvite: (accepted: boolean) => void
	rooms: ChatRoomInterface[]
	seeNewFriendNotification: () => void
	sendGameInvite: (id: number) => void
	sendMessage: (message: string) => void
}

interface MessageDTO {
	author?: Chatter
	authorRole?: ChatRoomRoles | null
	content: string
	sendByMe: boolean
	uniqueID: string
}

interface RoomWarning {
	warning: string
}

interface InviteMessage {
	id: number // Challenge id or room id
}

type IChat = (
	| {
			challengeId: null | number
			friend: Friend
	  }
	| {
			forbiddenChatReason: null | string
			room: ChatRoomInterface
	  }
) & {
	display: boolean
	messages: (MessageDTO | RoomWarning)[]
	unread: boolean
}

const FriendsContext = createContext<FriendsContextType>(
	{} as FriendsContextType
)

export function FriendsProvider({ children }: { children: ReactNode }) {
	const { isAuth, user } = useAuth()

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
						.get('/me/friends')
						.then((result) => {
							setFriends(result.data)
						})
						.catch((e) => {
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
							console.log(result)
							setRooms(result.data)
						})
						.catch((e) => {
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
			prevChats.map((chat) => ({ ...chat, display: false }))
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
				display: true,
				forbiddenChatReason: null,
				messages: [],
				room,
				unread: false,
			}

			setOpenChats([newRoom, ...openChats])
			setCurrentOpenChat(newRoom)
		} else {
			const friend = friends.find((friend) => friend.uid === id)
			if (!friend) return

			const newChat: IChat = {
				challengeId: null,
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

			return newChat?.map((chat) => {
				if (isRoom && 'room' in chat) {
					return chat.room.id === id
						? { ...chat, display: true, unread: false }
						: chat
				}
				if (!isRoom && 'friend' in chat) {
					return chat.friend.uid === id
						? { ...chat, display: true, unread: false }
						: chat
				}
				return chat
			})
		})

		setCurrentOpenChat(() => {
			const newCurrent = openChats.find((chat) => {
				if (isRoom && 'room' in chat) return chat.room.id === id
				if (!isRoom && 'friend' in chat) return chat.friend.uid === id
				return false
			})

			if (!newCurrent) return {} as IChat
			return newCurrent
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

			newChat[index].display = false

			const oneDisplay: IChat | undefined = newChat.find((chat) => chat.display)
			setExists(!!oneDisplay)

			if (oneDisplay && currentId === id) {
				setCurrentOpenChat(oneDisplay)
			}
			return newChat
		})
	}

	function actionBasedOnWarning(warningType: RoomWarningType, id: number) {
		getRooms()

		if (
			warningType === RoomWarningType.BAN ||
			warningType === RoomWarningType.KICK
		) {
			setOpenChats((prevChat) => {
				const newChat = prevChat?.map((chat) => {
					if ('room' in chat && chat.room.id === id) {
						return { ...chat, forbiddenChatReason: warningType }
					}
					return chat
				})

				return newChat
			})

			if ('room' in currentOpenChat && currentOpenChat.room.id === id) {
				focus(id, true)
			}
		}
	}

	const onMessageReceived = useCallback(
		function (
			data: DirectMessageReceivedDTO | RoomMessageReceivedDTO | RoomWarningDTO
		) {
			setOpenChats((prevChat) => {
				const newChat = [...prevChat]

				const index = newChat?.findIndex((chat) => {
					if ('room' in chat) {
						if ('id' in data) return chat.room.id === data.id
						if ('roomId' in data) return chat.room.id === data.roomId
					}
					if ('friend' in chat && !('id' in data || 'roomId' in data))
						return chat.friend.uid === data.author.id

					return false
				})

				if (
					'warning' in data &&
					(data.affectedUID == user.id ||
						data.warningType === RoomWarningType.OWNER_LEFT)
				) {
					actionBasedOnWarning(data.warningType, data.roomId)
				}

				const newMessage: MessageDTO | RoomWarning =
					'warning' in data
						? {
								warning: data.warning,
						  }
						: {
								author: data.author,
								authorRole: 'authorRole' in data ? data.authorRole : null,
								content: data.content,
								sendByMe: false,
								uniqueID: data.uniqueId,
						  }

				if (index === -1) {
					if ('id' in data || 'roomId' in data) {
						const room = rooms.find((room) => {
							if ('id' in data) return room.id === data.id
							return room.id === data.roomId
						})
						if (!room) throw 'error'

						newChat.push({
							display: true,
							forbiddenChatReason: null,
							messages: [newMessage],
							room,
							unread: true,
						})
					} else {
						const friend = friends.find(
							(friend) => friend.uid === data.author.id
						)
						if (!friend) throw 'error'

						newChat.push({
							challengeId: null,
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
		[friends, rooms]
	)

	function updateFriendStatus(data: NewUserStatusDTO) {
		setFriends((prevFriends) => {
			const newFriends = [...prevFriends]
			const index = newFriends.findIndex((friend) => friend.uid === data.uid)

			newFriends[index].status = data.newStatus
			return newFriends
		})
	}

	function sendMessage(message: string) {
		if (!socket) return

		const id =
			'room' in currentOpenChat
				? currentOpenChat?.room?.id
				: currentOpenChat?.friend?.uid

		const sendMessageDTO: SendMessageDTO = {
			content: message,
			receiverId: parseInt(id),
			uniqueId: crypto.randomUUID(),
		}

		if ('room' in currentOpenChat) {
			socket.emit('sendChatRoomMessage', sendMessageDTO)
		} else {
			socket.emit('sendDirectMessage', sendMessageDTO)
		}

		const newMessage: MessageDTO = {
			content: message,
			sendByMe: true,
			uniqueID: sendMessageDTO.uniqueId,
		}

		setOpenChats((prevChat) => {
			const index = prevChat?.findIndex((chat) => {
				if ('room' in chat) return chat.room.id === id
				if ('friend' in chat) return chat.friend.uid === id

				return false
			})

			prevChat[index]?.messages.unshift(newMessage)
			return prevChat
		})
	}

	useEffect(() => {
		if (socket) {
			socket.on('friendRequestReceived', function () {
				setNewFriendNotification(true)
			})

			socket.on('refreshUser', function () {
				getFriends()
			})

			socket.on('newUserStatus', updateFriendStatus)

			socket.on('invitedToGame', onInvitedToGame)
		}
	}, [socket])

	useEffect(() => {
		if (socket) {
			socket.on('directMessageReceived', onMessageReceived)
			socket.on('newChatRoomMessage', onMessageReceived)
			socket.on('roomWarning', onMessageReceived)

			return () => {
				socket.off('directMessageReceived', onMessageReceived)
				socket.off('newChatRoomMessage', onMessageReceived)
				socket.off('roomWarning', onMessageReceived)
			}
		}
	}, [onMessageReceived])

	// ======================== Room messages ========================

	function exitRoom(id: number) {
		setOpenChats((prevChats) => {
			if (!prevChats) return []

			const newChat = [...prevChats]

			const updatedChat = newChat.filter((chat) => {
				if (!('room' in chat)) return true
				return chat.room.id !== id
			})

			if (currentOpenChat?.room?.id === id) {
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

	function sendGameInvite(id: number) {
		if (!socket) return

		const gameInviteDTO: SendGameInviteDTO = {
			recipientUID: id,
		}
		socket.emit('sendGameInvite', gameInviteDTO)
	}

	function respondGameInvite(accepted: boolean) {
		if (!socket) return

		// parameter in user
		const response: RespondToGameInviteDTO = {
			accepted,
			inviteId: 2,
		}
		socket.emit(
			'respondToGameInvite',
			response,
			(response: OponentFoundDTO) => {
				console.log(response)
			}
		)
	}

	function onInvitedToGame(data: InvitedToGameDTO) {
		focus(data.senderUID, false)

		setOpenChats((prevChat) => {
			const newChat = [...prevChat]

			const index = newChat?.findIndex((chat) => {
				if ('room' in chat) return false
				return chat.friend.uid === data.senderUID
			})

			if (newChat[index] && 'friend' in newChat[index]) {
				newChat[index].challangeId = data.inviteId
			}
			return newChat
		})
	}

	function rejectChallenge(id: number) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex((chat) => chat.friend.uid === id)
			newChat[index].challengeId = null
			return newChat
		})
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
		rejectChallenge,
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
