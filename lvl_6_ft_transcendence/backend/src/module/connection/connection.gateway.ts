import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { User } from 'src/entity';
import { UsersService } from 'src/module/users/users.service';
import { Achievements, Friend, UserStatus } from 'types';
import { ChatService } from '../chat/chat.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { GameService } from '../game/game.service';
import { ConnectionService } from './connection.service';
import { AchievementUnlockedDTO } from './dto/achievement-unlocked.dto';
import { NewUserStatusDTO } from './dto/new-user-status.dto';

@WebSocketGateway({
	cors: GatewayCorsOption,
	namespace: 'connection',
})
export class ConnectionGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger: Logger = new Logger(ConnectionGateway.name);

	@WebSocketServer()
	public server: Server;
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly friendshipsService: FriendshipsService,
		private readonly gameService: GameService,
		private readonly chatService: ChatService,
		private readonly connectionService: ConnectionService,
	) { }

	afterInit(server: Server) {
		this.logger.log('Connection-Gateway Initialized');
	}

	async handleConnection(client: Socket): Promise<void> {
		try {
			// Throws if there's any misconfig with the access token
			// (bad signature, user doesn't exist or isn't part of the whitelist)
			const user: User =
				await this.connectionService.authenticateClientAndRetrieveUser(client);

			client.data.userId = user.id;
			client.data.name = user.name;

			await this.updateUserStatus(user.id, UserStatus.ONLINE);

			this.connectionService.updateSocketIdByUID(user.id.toString(), client.id);

			this.chatService.joinUserRooms(client);

			this.chatService.sendMissedDirectMessages(client.id, user.id);

			this.logger.log(`${user.name} is online`);
		} catch (error: any) {
			this.logger.warn(`${error.message}. Disconnecting...`);
			client.disconnect();
		}
	}

	async handleDisconnect(client: Socket): Promise<void> {
		if (!client.data.userId) return;

		await this.gameService.disconnectPlayer(client.data.userId);
		await this.updateUserStatus(client.data.userId, UserStatus.OFFLINE);

		this.connectionService.deleteSocketIdByUID(client.data.userId);

		this.logger.log(`${client.data.name} is now offline`);
	}

	async achievementUnlocked(
		userId: number,
		achievement: Achievements,
	): Promise<void> {
		const socketId: string = this.connectionService.findSocketIdByUID(
			userId.toString(),
		);

		const achievementUnlocked: AchievementUnlockedDTO = {
			achievement: achievement,
		};
		this.server.to(socketId).emit('achievementUnlocked', achievementUnlocked);
	}

	friendRequestReceived(receiverUID: number) {
		const receiverSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(receiverUID.toString());

		if (receiverSocketId) {
			this.server.to(receiverSocketId).emit('friendRequestReceived');
		}
	}

	async joinFriendsRooms(client: Socket, userId: number): Promise<void> {
		const friends: Friend[] = await this.friendshipsService.findFriendsByUID(
			userId,
		);

		const friendRoomNames: string[] = friends.map(
			(friend: Friend) => 'friend-' + friend.uid,
		);

		client.join(friendRoomNames);
	}

	leaveFriendRooms(senderUID: number, receiverUID: number): void {
		const senderSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(senderUID.toString());
		const receiverSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(receiverUID.toString());

		if (senderSocketId)
			this.server.to(senderSocketId).socketsLeave(`friend-${receiverUID}`);

		if (receiverSocketId)
			this.server.to(receiverSocketId).socketsLeave(`friend-${senderUID}`);
	}

	makeFriendsJoinEachOthersRoom(senderUID: number, receiverUID: number): void {
		const senderSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(senderUID.toString());
		const receiverSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(receiverUID.toString());

		// If both users are online
		if (senderSocketId && receiverSocketId) {
			this.sendRefreshUser(senderUID, senderSocketId);

			this.server.to(senderSocketId).socketsJoin(`friend-${receiverUID}`);
			this.server.to(receiverSocketId).socketsJoin(`friend-${senderUID}`);
		}
	}

	async updateUserStatus(userId: number, newStatus: UserStatus): Promise<void> {
		await this.usersService.updateUserStatusByUID(userId, newStatus);

		// Broadcast new user status to all users in the friend room (his friends)
		const newUserStatus: NewUserStatusDTO = {
			newStatus: newStatus,
			uid: userId,
		};

		this.server.to(`friend-${userId}`).emit('newUserStatus', newUserStatus);
	}

	sendRefreshUser(userId: number, socketId?: string): void {
		if (socketId) {
			this.server.to(socketId).emit('refreshUser');
		} else {
			const socketIdOfUser: string | undefined =
				this.connectionService.findSocketIdByUID(userId.toString());

			if (socketIdOfUser) {
				this.server.to(socketIdOfUser).emit('refreshUser');
			}
		}
	}
}
