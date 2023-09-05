import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiForbiddenResponse,
	ApiNotAcceptableResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { ChatRoom, User } from 'src/entity';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import {
	ChatRoomInterface,
	ChatRoomSearchInfo,
	CreateRoomRequest,
	ErrorResponse,
	InviteToRoomRequest,
	JoinRoomRequest,
	MuteDuration,
	MuteUserRequest,
	RemoveRoomPasswordRequest,
	RoomOperationRequest,
	SuccessResponse,
	UpdateRoomPasswordRequest,
	UserBasicProfile,
} from 'types';
import { PossibleInvitesRequest } from 'types/chat/request/possible-invites-request';
import { ChatService } from './chat.service';
import { AdminGuard } from './guard/admin.guard';
import { OwnerGuard } from './guard/owner.guard';

@ApiTags('chat')
@ApiBearerAuth('swagger-basic-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) { }

	private readonly logger: Logger = new Logger(ChatController.name);

	@ApiBody({ type: CreateRoomRequest })
	@ApiConflictResponse({ description: 'If room name is already taken' })
	@ApiNotAcceptableResponse({
		description:
			'If room name is not composed only by letters (both case), digits and underscore',
	})
	@ApiBadRequestResponse({
		description:
			"If request's body is malformed or if room is protected and there's no password or if it is not composed only by letters (both case), digits and special chars or if room name is not 4-10 chars long or room is protected and password is not 4-20 chars long",
	})
	@ApiOkResponse({
		description: 'Successfully created a room named body.name',
	})
	@HttpCode(HttpStatus.OK)
	@Post('/create-room')
	public async createRoom(
		@ExtractUser() user: User,
		@Body() body: CreateRoomRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		await this.chatService.createRoom(body, user);

		this.logger.log(
			`${user.name} created a ${body.type} room named "${body.name}"`,
		);
		return { message: `Successfully created room "${body.name}"` };
	}

	/**
	 * GET /api/chat/rooms/search?room-name=
	 *
	 * This is the route to visit to search for ChatRoomSearchInfo by room-name proximity.
	 * Returns the rooms that match that "piece" of name,
	 * If no roomname is provided returns all rooms
	 */
	@ApiOkResponse({
		description:
			'This is the route to visit to search for ChatRoomSearchInfo, by room-name proximity.\nReturns the rooms that match that "piece" of name, If no <name> is provided returns all rooms',
	})
	@ApiQuery({
		description: 'A piece of the room name(s) to match',
		name: 'room-name',
		type: 'string',
	})
	@Get('/rooms/search')
	public async findRoomsByNameProximity(
		@ExtractUser() user: User,
		@Query('room-name') query: string,
	): Promise<ChatRoomSearchInfo[]> {
		return await this.chatService.findRoomsByNameProximity(user.id, query);
	}

	/**
	 * GET /api/chat/rooms/:roomId/bans
	 *
	 * This is the route to visit to get the ids
	 * of the banned users on the room which id=roomId
	 */
	@ApiOperation({
		description: 'Get the ids of the banned users on room which id=roomId',
	})
	@ApiParam({
		description: 'The room id',
		name: 'roomId',
		type: 'number',
	})
	@ApiUnauthorizedResponse({
		description: 'If requesting user is not the owner of the room',
	})
	@ApiNotFoundResponse({ description: "Room with id=roomId doesn't exist" })
	@ApiOkResponse({
		description:
			'Returns an array of the UIDs of the banned users on room with id=room-id',
	})
	@UseGuards(OwnerGuard)
	@Get('/rooms/:roomId/bans')
	public async findRoomBans(
		@Param('roomId') roomId: number,
	): Promise<UserBasicProfile[]> {
		const room: ChatRoom | null = await this.chatService.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		console.log(room)
		return room.bans.map(
			(bannedUser: User): UserBasicProfile => ({
				id: bannedUser.id,
				name: bannedUser.name,
				avatar_url: bannedUser.avatar_url,
			}),
		);
	}

	/**
	 * GET /api/chat/rooms/:roomId/admins
	 *
	 * This is the route to visit to get the ids
	 * of the admins on the room which id=room-id
	 */
	@ApiOperation({
		description: 'Get the ids of the admins on the room which id=roomId',
	})
	@ApiParam({
		description: 'The room id',
		name: 'roomId',
		type: 'number',
	})
	@ApiUnauthorizedResponse({
		description: "If requesting user isn't the owner of the room",
	})
	@ApiNotFoundResponse({ description: "Room with id= roomId doesn't exist" })
	@ApiOkResponse({
		description: 'Returns an array of the user ids of the admins',
	})
	@UseGuards(OwnerGuard)
	@Get('/rooms/:roomId/admins')
	public async findRoomAdmins(
		@Param('roomId') roomId: number,
	): Promise<UserBasicProfile[]> {
		const room: ChatRoom | null = await this.chatService.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		return room.admins.map(
			(admin: User): UserBasicProfile => ({
				id: admin.id,
				name: admin.name,
				avatar_url: admin.avatar_url,
			}),
		);
	}

	@ApiBody({ type: JoinRoomRequest })
	@ApiNotFoundResponse({
		description: "The room doesn't exist",
	})
	@ApiUnauthorizedResponse({
		description: 'If room is protected and user fails the room password',
	})
	@ApiForbiddenResponse({ description: 'If user is banned from room' })
	@ApiConflictResponse({ description: 'If user is already in the room' })
	@ApiOkResponse({
		description: 'Successfully joined room with id=body.roomId',
	})
	@HttpCode(HttpStatus.OK)
	@Post('/join-room')
	public async joinRoom(
		@ExtractUser() user: User,
		@Body() body: JoinRoomRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.joinRoom(user, body.roomId, body.password);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiNotFoundResponse({ description: "If room doesn't exist" })
	@ApiOkResponse({
		description: 'Successfully left room with id=body.roomId',
	})
	@HttpCode(HttpStatus.OK)
	@Post('/leave-room')
	public async leaveRoom(
		@ExtractUser() user: User,
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.chatService.findRoomById(
			body.roomId,
		);
		if (!room) {
			this.logger.warn(`${user.name} tried to leave a non-existing room`);
			throw new NotFoundException(`Room "${room.name}" doesn't exist`);
		}

		await this.chatService.leaveRoom(room, body.userId, true);
		return { message: `Successfully left room "${room.name}"` };
	}

	@ApiBody({ type: InviteToRoomRequest })
	@ApiNotFoundResponse({ description: "If room or receiver don't exist" })
	@ApiForbiddenResponse({
		description: 'If sender is not a friend of receiver',
	})
	@ApiConflictResponse({
		description: 'If the invited user is already part of the room',
	})
	@ApiOkResponse({
		description:
			'Successfully invited user with uid=body.receiverUID to room with id=body.roomId',
	})
	@HttpCode(HttpStatus.OK)
	@Post('/invite')
	public async inviteToRoom(
		@ExtractUser() user: User,
		@Body() body: InviteToRoomRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.inviteToRoom(
			user.id,
			body.receiverUID,
			body.roomId,
		);
	}

	@ApiBody({ type: PossibleInvitesRequest })
	@ApiNotFoundResponse({
		description: "If user with id=body.friendUID doesn't exist",
	})
	@ApiOkResponse({
		description:
			'Successfully gets the list of possible rooms to invite the friend to',
	})
	@Get('/possible-invites')
	public async possibleInvites(
		@ExtractUser() user: User,
		@Body() body: PossibleInvitesRequest,
	): Promise<ChatRoomInterface[] | ErrorResponse> {
		return await this.chatService.findPossibleInvites(user.id, body.friendUID);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or receiver don't exist" })
	@ApiConflictResponse({ description: 'If sender tries to kick himself' })
	@ApiOkResponse({
		description:
			'Successfully kicked user with uid=body.userId from room with id=body.roomId',
	})
	@UseGuards(AdminGuard)
	@HttpCode(HttpStatus.OK)
	@Post('/kick')
	public async kickFromRoom(
		@ExtractUser() user: User,
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.kickFromRoom(
			user.id,
			body.userId,
			body.roomId,
		);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user don't exist" })
	@UseGuards(AdminGuard)
	@HttpCode(HttpStatus.OK)
	@Post('/ban')
	public async banFromRoom(
		@ExtractUser() user: User,
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.banFromRoom(
			user.id,
			body.userId,
			body.roomId,
		);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user doesn't exist" })
	@ApiOkResponse({
		description:
			'Successfully unbanned user with uid=body.userId from room with id=body.roomId',
	})
	@UseGuards(AdminGuard)
	@Delete('/ban')
	public async unbanFromRoom(
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.unbanFromRoom(body.userId, body.roomId);
	}

	@ApiBody({ type: MuteUserRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user doesn't exist" })
	@ApiForbiddenResponse({
		description: 'If sender (admin) tries to ban another admin',
	})
	@ApiOkResponse({
		description:
			'Successfully muted user with id=body.userId on room with id=body.roomId',
	})
	@UseGuards(AdminGuard)
	@HttpCode(HttpStatus.OK)
	@Post('/mute')
	public async muteUser(
		@Body() body: MuteUserRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		// Calculate the mute duration in ms to later use on setTimeout()
		let muteDuration: number;
		switch (body.duration) {
			case MuteDuration.THIRTEEN_SECS:
				muteDuration = 30 * 1000;
				break;
			case MuteDuration.FIVE_MINS:
				muteDuration = 5 * 60 * 1000;
				break;
		}

		return await this.chatService.muteUser(
			body.userId,
			muteDuration,
			body.roomId,
		);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user doesn't exist" })
	@ApiOkResponse({
		description:
			'Successfully unmuted user with id=body.userId from room with id=body.roomId',
	})
	@UseGuards(AdminGuard)
	@Delete('/mute')
	public async unmuteUser(
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.unmuteUser(body.userId, body.roomId);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have admin privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user doesn't exist" })
	@ApiConflictResponse({
		description: 'If recipient already have admin privileges',
	})
	@ApiOkResponse({
		description:
			'Successfully granted admin privileges to user with id=body.userId on room with id=body.roomId',
	})
	@UseGuards(OwnerGuard)
	@HttpCode(HttpStatus.OK)
	@Post('/add-admin')
	public async addAdmin(
		@ExtractUser() user: User,
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.assignAdminRole(
			user.id,
			body.userId,
			body.roomId,
		);
	}

	@ApiBody({ type: RoomOperationRequest })
	@ApiOperation({
		description: 'Remove admin privileges of a participant of a room',
	})
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have owner privileges",
	})
	@ApiNotFoundResponse({ description: "If room or user doesn't exist" })
	@ApiBadRequestResponse({
		description:
			"If request's body is malformed or if recipient doesn't have admin privileges",
	})
	@ApiOkResponse({
		description:
			'Successfully removed admin privileges of user with id=body.userId on room with id=body.roomId',
	})
	@UseGuards(AdminGuard)
	@HttpCode(HttpStatus.OK)
	@Post('/remove-admin')
	public async removeAdmin(
		@Body() body: RoomOperationRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.removeAdminRole(body.userId, body.roomId);
	}

	@ApiBody({ type: UpdateRoomPasswordRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have owner privileges",
	})
	@ApiNotFoundResponse({ description: "If room doesn't exist" })
	@ApiOkResponse({
		description:
			"Successfully updated room with id=body.roomId's password to body.newPassword",
	})
	@UseGuards(OwnerGuard)
	@Patch('/room-password')
	public async updateRoomPassword(
		@Body() body: UpdateRoomPasswordRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.updateRoomPassword(
			body.newPassword,
			body.roomId,
		);
	}

	@ApiBody({ type: RemoveRoomPasswordRequest })
	@ApiUnauthorizedResponse({
		description: "If sender doesn't have owner privileges",
	})
	@ApiNotFoundResponse({ description: "If room doesn't exist" })
	@ApiBadRequestResponse({
		description: "If request's body is malformed or if room is not protected",
	})
	@ApiOkResponse({
		description: "Successfully removed room with id=body.roomId's password",
	})
	@UseGuards(OwnerGuard)
	@Delete('/room-password')
	public async removeRoomPassword(
		@Body() body: RemoveRoomPasswordRequest,
	): Promise<SuccessResponse | ErrorResponse> {
		return await this.chatService.removeRoomPassword(body.roomId);
	}
}
