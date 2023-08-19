import { api } from '@/api/api'
import { FriendInterface } from '@/common/types/backend/friend-interface.interface'
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

import { socket } from './SocketContext'

type ChatContextType = {
	addFriend: (friend: FriendInterface) => void
	close: () => void
	currentOpenChat: IChat
	friends: FriendInterface[]
	isOpen: boolean
	open: (friend: FriendInterface) => void
	openChats: IChat[]
	respondGameInvite: (accepted: boolean) => void
	sendGameInvite: (id: number) => void
	sendMessage: (message: string) => void
}

export interface MessageDTO {
	content: string
	sendByMe: boolean
}

interface IChat {
	friend: FriendInterface
	messages: MessageDTO[]
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

export function ChatProvider({ children }: { children: ReactNode }) {
	const [friends, setFriends] = useState<FriendInterface[]>([])

	const [openChats, setOpenChats] = useState<IChat[]>([])
	const currentOpenChat = openChats[openChats.length - 1]

	function open(friend: FriendInterface) {
		const newChat: IChat = {
			friend,
			messages: [],
		}
		setOpenChats([...openChats, newChat])
	}

	function close() {
		setOpenChats([])
	}

	function addFriend(friend: FriendInterface) {
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
			api
				.get('/me/friends')
				.then((result) => {
					setFriends(result.data)
				})
				.catch((e) => {
					throw 'Network error'
				})
		} catch (error: any) {
			toast.error(error)
		}
	}, [])

	useEffect(() => {
		socket?.on(
			'directMessageReceived',
			function (data: DirectMessageReceivedDTO) {
				setOpenChats((prevChat) => {
					const newChat = [...prevChat]
					const index = prevChat?.findIndex(
						(chat) => chat.friend.uid === data.senderUID
					)

					if (index === -1) {
						newChat.push({
							friend: friends.filter(
								(friend) => friend.uid === data.senderUID
							)[0],
							messages: [
								{
									content: data.content,
									sendByMe: false,
								},
							],
						})
					} else {
						const newMessage: MessageDTO = {
							content: data.content,
							sendByMe: false,
						}

						newChat[index]?.messages.push(newMessage)
						newChat.push(newChat[index])
						newChat.splice(index, 1)
					}
					return newChat
				})
			}
		)

		socket?.on('invitedToGame', function (data: InvitedToGameDTO) {
			console.log(data)
		})
	}, [socket])

	function sendMessage(message: string) {
		if (!socket) return

		const sendMessageDTO: SendDirectMessageDTO = {
			content: message,
			receiverUID: currentOpenChat.friend?.uid,
		}
		socket.emit('sendDirectMessage', sendMessageDTO)

		const newMessage: MessageDTO = {
			content: message,
			sendByMe: true,
		}

		setOpenChats((prevChat) => {
			const index = prevChat?.findIndex(
				(chat) => chat.friend.uid === currentOpenChat.friend?.uid
			)

			prevChat[index]?.messages.push(newMessage)
			prevChat.push(prevChat[index])
			prevChat.splice(index, 1)
			return prevChat
		})
	}

	const value: ChatContextType = {
		addFriend,
		close,
		currentOpenChat,
		friends,
		isOpen: openChats.length !== 0,
		open,
		openChats,
		respondGameInvite,
		sendGameInvite,
		sendMessage,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
	return useContext(ChatContext)
}
