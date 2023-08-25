import { api } from '@/api/api'
import { ChatRoomInterface, Friend } from '@/common/types/backend'
import { DirectMessageReceivedDTO } from '@/common/types/direct-message-received.dto'
import { InvitedToGameDTO } from '@/common/types/invited-to-game.dto'
import { NewUserStatusDTO } from '@/common/types/new-user-status.dto'
import { OponentFoundDTO } from '@/common/types/oponent-found'
import { RespondToGameInviteDTO } from '@/common/types/respond-to-game-invite.dto'
import { SendDirectMessageDTO } from '@/common/types/send-direct-message.dto'
import { SendGameInviteDTO } from '@/common/types/send-game-invite.dto'
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
	close: (id: number) => void
	closeAll: () => void
	currentOpenChat: IChat
	exists: boolean
	focusChat: (id: number) => void
	friends: Friend[]
	isOpen: boolean
	newFriendNotification: boolean
	open: (friend: Friend) => void
	openChats: IChat[]
	rejectChallenge: (id: number) => void
	respondGameInvite: (accepted: boolean) => void
	rooms: Room[]
	seeNewFriendNotification: () => void
	sendGameInvite: (id: number) => void
	sendMessage: (message: string) => void
}

export interface MessageDTO {
	content: string
	sendByMe: boolean
	uniqueID: string
}

interface Author {
	avatar_url: string
	id: number
	name: string
}

interface RoomMessageDTO {
	author: Author
	content: string
}

type IChat = (
	| {
			challengeId: null | number
			friend: Friend
			messages: MessageDTO[]
	  }
	| {
			messages: RoomMessageDTO[]
			room: ChatRoomInterface
	  }
) & {
	display: boolean
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

	// ======================== Rooms messages ========================

	function openRoom(name: string) {
		setIsOpen(true)
		setExists(true)

		const index = openChats?.findIndex((chat) => {
			if (!('room' in chat)) return false

			return chat.room.name === name
		})

		if (index !== -1) {
			focusChat()
			return
		}

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
	})

	// ======================== Direct messages ========================

	useEffect(() => {
		socket?.on('directMessageReceived', onDirectMessageReceived)

		socket?.on('invitedToGame', onInvitedToGame)
	}, [friends])

	function open(friend: Friend) {
		setIsOpen(true)
		setExists(true)

		const index = openChats?.findIndex((chat) => {
			if (!('friend' in chat)) return false

			return chat.friend.uid === friend.uid
		})

		if (index !== -1) {
			focusChat(friend.uid)
			return
		}

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

	function focusChat(id: number) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			return newChat?.map((chat) => {
				if (!('friend' in chat)) return chat

				return chat.friend.uid === id
					? { ...chat, display: true, unread: false }
					: { ...chat, display: true }
			})
		})

		setCurrentOpenChat(
			openChats.find((chat) => {
				if (!('friend' in chat)) return false

				return chat.friend.uid === id
			})
		)
	}

	function close(id: number) {
		setOpenChats((prevChats) => {
			const newChat = [...prevChats]

			if (newChat.length > 1 && currentOpenChat.friend.uid === id) {
				setCurrentOpenChat(prevChats[1])
			}

			const index = newChat?.findIndex((chat) => chat.friend.uid === id)

			newChat[index].display = false
			setExists(newChat.some((chat) => chat.display))
			return newChat
		})
	}

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

	function onDirectMessageReceived(data: DirectMessageReceivedDTO) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex(
				(chat) => chat.friend.uid === data.senderUID
			)

			if (index === -1) {
				newChat.push({
					challenged: false,
					display: true,
					friend: friends.find((friend) => friend.uid === data.senderUID),
					messages: [
						{
							content: data.content,
							sendByMe: false,
							uniqueID: data.uniqueId,
						},
					],
					unread: true,
				})

				if (newChat.length === 1) {
					setCurrentOpenChat(newChat[0])
				}
			} else {
				const newMessage: MessageDTO = {
					content: data.content,
					sendByMe: false,
					uniqueID: data.uniqueId,
				}

				console.log(currentOpenChat)

				newChat[index].unread = true
				newChat[index].display = true
				newChat[index]?.messages.unshift(newMessage)
			}
			return newChat
		})
		setExists(true)
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

	function sendMessage(message: string) {
		if (!socket) return

		const sendMessageDTO: SendDirectMessageDTO = {
			content: message,
			receiverUID: parseInt(currentOpenChat.friend?.uid),
			uniqueId: crypto.randomUUID(),
		}
		socket.emit('sendDirectMessage', sendMessageDTO)

		const newMessage: MessageDTO = {
			content: message,
			sendByMe: true,
			uniqueID: sendMessageDTO.uniqueId,
		}

		setOpenChats((prevChat) => {
			const index = prevChat?.findIndex(
				(chat) => chat.friend.uid === currentOpenChat.friend?.uid
			)

			prevChat[index]?.messages.unshift(newMessage)
			return prevChat
		})
	}

	const value: FriendsContextType = {
		changeOpenState: () => setIsOpen((prevState) => !prevState),
		close,
		closeAll,
		currentOpenChat,
		exists,
		focusChat,
		friends,
		isOpen,
		newFriendNotification,
		open,
		openChats,
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
