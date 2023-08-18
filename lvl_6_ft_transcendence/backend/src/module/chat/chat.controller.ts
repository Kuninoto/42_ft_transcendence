import { Controller, Get, Logger, NotFoundException, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ChatRoom, User } from 'src/typeorm';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { RoomService } from './room.service';
import { ChatRoomSearchInfo } from 'src/common/types/chat-room-search-info.interface';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { UserProfile } from 'src/common/types/user-profile.interface';
import { UsersService } from '../users/users.service';

@ApiTags('chat')
// @UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
	constructor(private readonly roomService: RoomService, private readonly usersService: UsersService) {}

	private readonly logger: Logger = new Logger(ChatController.name);

	/**
	 * GET /api/chat/rooms/search?room_name=
	 *
	 * This is the route to visit to search for ChatRoomSearchInfo by room_name proximity.
	 * Returns the rooms that match that "piece" of name,
	 * If no room_name is provided returns all rooms
	 */
	@ApiOkResponse({
		description:
			'This is the route to visit to search for ChatRoomSearchInfo, by room_name proximity.\nReturns the rooms that match that "piece" of name, If no <name> is provided returns all rooms',
	})
	@Get('/rooms/search')
	public async getUsersByUsernameProximity(
		@Query('room_name') query: string,
	): Promise<ChatRoomSearchInfo[]> {
		return await this.roomService.findRoomsByRoomNameProximity(query);
	}

	/**
	 * PATCH /api/chat/:roomId/add-admin/:userId
	 *
	 * This is the route to visit to retrieve user's
	 * (identified by id) profile
	*/
//  @ApiOkResponse({
// 	 description: "Finds User's which id=userId profile",
// 	})
// 	@ApiNotFoundResponse({ description: "If user with id=userId doesn't exist " })
// 	@Patch('/:roomId/add-admin/:userId')
// 	public async addAdmin(
// 		@Param('roomId', NonNegativeIntPipe) roomID: number,
// 		@Param('userId', NonNegativeIntPipe) userID: number
// 		){

// 		this.logger.debug('RoomID: ' + roomID);
// 		this.logger.debug('UserID: ' + userID);

// 		// TODO use guards to verify if user is admin or owner
// 		const room: ChatRoom = await this.roomService.findRoomById(roomID);
// 		this.logger.debug('room: ' + JSON.stringify(room, null, 2))
// 		if (!room) {
// 			this.logger.warn(
// 				'"' + roomID + '" there\'s no room with that ID',
// 			);
// 			throw new NotFoundException('Room with id= ' + roomID + "doesn't exist");
// 		}

// 		this.roomService.addUserAsAdmin(room, userID);
// 	}

}