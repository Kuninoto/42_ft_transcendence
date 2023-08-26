import { api } from '@/api/api'
import { ChatRoomInterface, Chatter, Friend } from '@/common/types/backend'
import { DirectMessageReceivedDTO } from '@/common/types/direct-message-received.dto'
import { InvitedToGameDTO } from '@/common/types/invited-to-game.dto'
import { NewUserStatusDTO } from '@/common/types/new-user-status.dto'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { RespondToGameInviteDTO } from '@/common/types/respond-to-game-invite.dto'
import { RoomMessageReceivedDTO } from '@/common/types/room-message-received.dto'
import { SendGameInviteDTO } from '@/common/types/send-game-invite.dto'
import { SendMessageDTO } from '@/common/types/send-message.dto'
import {
	createContext,
	ReactNode,
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
	focus: (id: number) => void
	friends: Friend[]
	isOpen: boolean
	newFriendNotification: boolean
	open: (id: number, isRoom: boolean) => void
	openChats: IChat[]
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
	content: string
	sendByMe: boolean
	uniqueID: string
}

type IChat = (
	| {
			challengeId: null | number
			friend: Friend
	  }
	| {
			room: ChatRoomInterface
	  }
) & {
	display: boolean
	messages: MessageDTO[]
	unread: boolean
}

const FriendsContext = createContext<FriendsContextType>(
	{} as FriendsContextType
)

export function FriendsProvider({ children }: { children: ReactNode }) {
	const { isAuth } = useAuth()

	const [friends, setFriends] = useState<[] | Friend[]>([])
	const [rooms, setRooms] = useState<[] | ChatRoomInterface[]>([])

	const [openChats, setOpenChats] = useState<[] | IChat[]>([])
	const [currentOpenChat, setCurrentOpenChat] = useState<IChat>({} as IChat)

	const [isOpen, setIsOpen] = useState(false)
	const [exists, setExists] = useState(false)
	const [newFriendNotification, setNewFriendNotification] = useState(false)

	// ======================== General ========================

	function getFriends() {
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
	}

	function getRooms() {
		try {
			if (isAuth) {
				api
					.get('/me/rooms')
					.then((result) => {
						setRooms(result.data)
						console.log(result.data)
					})
					.catch((e) => {
						throw 'Network error'
					})
			}
		} catch (error: any) {
			toast.error(error)
		}
	}

	useEffect(() => {
		getFriends()
		getRooms()
	}, [isAuth])

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
			focus(id)
			return
		}

		if (isRoom) {
			const room = rooms.find((room) => room.id === id)
			if (room === undefined) return

			const newRoom: IChat = {
				display: true,
				messages: [],
				room,
				unread: false,
			}

			setOpenChats([newRoom, ...openChats])
			setCurrentOpenChat(newRoom)
		} else {
			const friend = friends.find((friend) => friend.uid === id)
			if (friend === undefined) return

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

	function focus(id: number) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]

			return newChat?.map((chat) => {
				if ('room' in chat) {
					return chat.room.id === id
						? { ...chat, display: true, unread: false }
						: { ...chat, display: true }
				}
				return chat.friend.uid === id
					? { ...chat, display: true, unread: false }
					: { ...chat, display: true }
			})
		})

		setCurrentOpenChat(() => {
			const newCurrent = openChats.find((chat) => {
				if ('room' in chat) return chat.room.id === id
				return chat.friend.uid === id
			})

			if (newCurrent === undefined) return {} as IChat
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

			if (newChat.length > 1 && currentId === id) {
				setCurrentOpenChat(prevChats[1])
			}

			const index = newChat?.findIndex((chat) => {
				if (isRoom && 'room' in chat) chat.room.id === id
				if (!isRoom && 'friend' in chat) chat.friend.uid === id
				return false
			})

			newChat[index].display = false
			setExists(newChat.some((chat) => chat.display))
			return newChat
		})
	}

	function onMessageReceived(
		data: DirectMessageReceivedDTO | RoomMessageReceivedDTO
	) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex((chat) => {
				if ('room' in chat && 'id' in data) return chat.room.id === data.id
				if ('friend' in chat && !('id' in data))
					return chat.friend.uid === data.author.id

				return false
			})

			const newMessage: MessageDTO = {
				author: data.author,
				content: data.content,
				sendByMe: false,
				uniqueID: data.uniqueId,
			}

			if (index === -1) {
				if ('id' in data) {
					const room = rooms.find((room) => room.id === data.id)
					if (!room) throw 'error'

					newChat.push({
						display: true,
						messages: [newMessage],
						room,
						unread: true,
					})
				} else {
					const friend = friends.find((friend) => friend.uid === data.author.id)
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

				console.log('asdsa')
			} else {
				newChat[index].unread = true
				newChat[index].display = true
				newChat[index]?.messages.unshift(newMessage)
			}
			return newChat
		})
		setExists(true)
	}

	function sendMessage(message: string) {
		if (!socket) return

		const id =
			'room' in currentOpenChat
				? currentOpenChat.room.id
				: currentOpenChat.friend.uid

		console.log(id)
		const sendMessageDTO: SendMessageDTO = {
			content: message,
			receiverId: parseInt(id),
			uniqueId: crypto.randomUUID(),
		}

		if ('room' in currentOpenChat) {
			console.log('here')
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
		socket?.on('newUserStatus', function (data: NewUserStatusDTO) {
			console.log(data)
		})
		socket?.on('friendRequestReceived', function () {
			setNewFriendNotification(true)
		})
		socket?.on('refreshUser', function () {
			getFriends()
		})

		socket?.on('invitedToGame', onInvitedToGame)
	})

	useEffect(() => {
		socket?.on('directMessageReceived', onMessageReceived)
		socket?.on('newChatRoomMessage', onMessageReceived)
	}, [friends, rooms])

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
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]

			const index = newChat?.findIndex(
				(chat) => chat.friend.uid === data.senderUID
			)

			newChat[index].challengeId = data.inviteId
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
		focus,
		friends,
		isOpen,
		newFriendNotification,
		open,
		openChats,
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
