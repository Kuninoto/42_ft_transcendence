import { api } from '@/api/api'
import { Friend } from '@/common/types/backend'
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

type ChatContextType = {
	addFriend: (friend: Friend) => void
	close: (id: number) => void
	closeAll: () => void
	currentOpenChat: IChat
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

export interface MessageDTO {
	content: string
	sendByMe: boolean
	uniqueID: string
}

interface IChat {
	challengeId: null | number
	friend: Friend
	messages: MessageDTO[]
	unread: boolean
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: ReactNode }) {
	const { isAuth } = useAuth()
	const [friends, setFriends] = useState<[] | Friend[]>([])

	const [openChats, setOpenChats] = useState<[] | IChat[]>([])
	const [currentOpenChat, setCurrentOpenChat] = useState<IChat>({} as IChat)

	function open(friend: Friend) {
		const index = openChats?.findIndex((chat) => chat.friend.uid === friend.uid)

		if (index !== -1) {
			focusChat(friend.uid)
			return
		}

		const newChat: IChat = {
			challengeId: null,
			friend,
			messages: [],
			unread: false,
		}
		setOpenChats([newChat, ...openChats])
		setCurrentOpenChat(newChat)
	}

	function focusChat(id: number) {
		setOpenChats((prevChat) =>
			prevChat.map((chat) =>
				chat.friend.uid === id ? { ...chat, unread: false } : chat
			)
		)
		setCurrentOpenChat(openChats.find((chat) => chat.friend.uid === id))
	}

	function close(id: number) {
		setOpenChats((prevChats) => {
			if (prevChats.length > 1 && currentOpenChat.friend.uid === id) {
				setCurrentOpenChat(prevChats[1])
			}

			return prevChats.filter((chat) => chat.friend.uid !== id)
		})
	}

	function closeAll() {
		setOpenChats([])
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
						newChat[index]?.messages.unshift(newMessage)
					}
					return newChat
				})
			}
		)

		socket?.on('newUserStatus', function (data: NewUserStatusDTO) {
			console.log(data)
		})

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
		close,
		closeAll,
		currentOpenChat,
		focusChat,
		friends,
		isOpen: openChats.length !== 0,
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
