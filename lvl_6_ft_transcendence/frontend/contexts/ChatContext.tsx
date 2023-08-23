import { api } from '@/api/api'
import { Friend } from '@/common/types/backend'
import { DirectMessageReceivedDTO } from '@/common/types/direct-message-received.dto'
import { InvitedToGameDTO } from '@/common/types/invited-to-game.dto'
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

type ChatContextType = {
	addFriend: (friend: Friend) => void
	changeOpenState: () => void
	close: (id: number) => void
	closeAll: () => void
	currentOpenChat: IChat
	exists: boolean
	focusChat: (id: number) => void
	friends: Friend[]
	isOpen: boolean
	open: (friend: Friend) => void
	openChats: IChat[]
	rejectChallenge: (id: number) => void
	respondGameInvite: (accepted: boolean) => void
	sendGameInvite: (id: number) => void
	sendMessage: (message: string) => void
}

interface Group {
	name: string
	ownerName: string
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

interface GroupMessageDTO {
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
			group: Group
			messages: GroupMessageDTO[]
	  }
) & {
	display: boolean
	unread: boolean
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: ReactNode }) {
	const { isAuth } = useAuth()

	const [friends, setFriends] = useState<[] | Friend[]>([])
	const [groups, setGroups] = useState<[] | Group[]>([])

	const [openChats, setOpenChats] = useState<[] | IChat[]>([])
	const [currentOpenChat, setCurrentOpenChat] = useState<IChat>({} as IChat)

	const [isOpen, setIsOpen] = useState(false)
	const [exists, setExists] = useState(false)

	// ======================== General messages ========================

	function closeAll() {
		setOpenChats((prevChats) =>
			prevChats.map((chat) => ({ ...chat, display: false }))
		)
	}

	// ======================== Groups messages ========================

	function openGroup(name: string) {
		setIsOpen(true)
		setExists(true)

		const index = openChats?.findIndex((chat) => {
			if (!('group' in chat)) return false

			return chat.group.name === name
		})

		if (index !== -1) {
			focusChat()
			return
		}

		const newChat: IChat = {
			challengeId: null,
			display: true,
			friend,
			isGroup: false,
			messages: [],
			unread: false,
		}
		setOpenChats([newChat, ...openChats])
		setCurrentOpenChat(newChat)
	}

	// ======================== Direct messages ========================

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

	function addFriend(friend: Friend) {
		setFriends([...friends, friend])
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

	useEffect(() => {
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
	}, [isAuth])

	useEffect(() => {
		socket?.on(
			'directMessageReceived',
			function (data: DirectMessageReceivedDTO) {
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

						newChat[index].unread = true
						newChat[index].display = true
						newChat[index]?.messages.unshift(newMessage)
					}
					return newChat
				})
				setExists(true)
			}
		)

		socket?.on('invitedToGame', function (data: InvitedToGameDTO) {
			setOpenChats((prevChat) => {
				const newChat = [...prevChat]

				const index = newChat?.findIndex(
					(chat) => chat.friend.uid === data.senderUID
				)

				newChat[index].challengeId = data.inviteId
				return newChat
			})
		})
	}, [friends])

	function rejectChallenge(id: number) {
		setOpenChats((prevChat) => {
			const newChat = [...prevChat]
			const index = newChat?.findIndex((chat) => chat.friend.uid === id)
			newChat[index].challengeId = null
			return newChat
		})
	}

	function changeOpenState() {
		setIsOpen((prevState) => !prevState)
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

	const value: ChatContextType = {
		addFriend,
		changeOpenState,
		close,
		closeAll,
		currentOpenChat,
		exists,
		focusChat,
		friends,
		isOpen,
		open,
		openChats,
		rejectChallenge,
		respondGameInvite,
		sendGameInvite,
		sendMessage,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}
