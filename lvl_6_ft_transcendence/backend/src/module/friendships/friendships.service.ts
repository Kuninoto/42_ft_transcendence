import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import { FriendshipStatus } from 'src/entity/friendship.entity';
import { User, Friendship, BlockedUser } from 'src/typeorm';
import { FriendshipDTO } from './dto/friendship.dto';
import { FriendInterface } from '../../common/types/FriendInterface.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>
  ) { }

  public async getMyFriendRequests(meUser: User): Promise<Friendship[]> {
    return await this.friendshipRepository.findBy({
      receiver: meUser,
      status: FriendshipStatus.PENDING
    });
  }

  public async getMyFriends(meUser: User): Promise<FriendInterface[]> {
    const myFriendships: Friendship[] = await this.friendshipRepository.find({
      where: [
        { receiver: meUser, status: FriendshipStatus.ACCEPTED },
        { sender: meUser, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['sender', 'receiver'],
    });

    const myFriendshipsInfo: FriendshipDTO[] = [];

    // loop thru every friendship and save the friendship_id
    // alongside the id of the friend in an array
    myFriendships.forEach((friend: Friendship) => {
      let friendshipDTO: FriendshipDTO = {
        friend_uid: undefined,
        friendship_id: undefined
      };

      friendshipDTO.friendship_id = friend.id;
      if (meUser.id === friend.sender.id) {
        friendshipDTO.friend_uid = friend.receiver.id;
      } else if (meUser.id === friend.receiver.id) {
        friendshipDTO.friend_uid = friend.sender.id;
      }

      myFriendshipsInfo.push(friendshipDTO);
    });

    const myFriendsInterfaces: FriendInterface[] = [];

    // generate friendInterfaces with the friendshipDTO info
    // + some fields from the user (friend)
    await Promise.all(myFriendshipsInfo.map(async (friendshipInfo) => {
      const friend: User = await this.usersService.findUserByUID(friendshipInfo.friend_uid);

      myFriendsInterfaces.push({
        friendship_id: friendshipInfo.friendship_id,
        friend_uid: friendshipInfo.friend_uid,
        name: friend.name,
        avatar_url: friend.avatar_url,
        status: friend.status,
      });
    }));

    return myFriendsInterfaces;
  }

  private async hasFriendshipBeenEstabilishedAlready(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    // Check if a friend request between the two users
    // has already been made by one of the parts
    const friendRequest: Friendship = await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.PENDING }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.PENDING }, // receiver -> sender
    ]);

    return friendRequest ? true : false;
  }

  private async areTheyFriendsAlready(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    // Check if a friendship exists between the two users
    const friendship: Friendship = await this.friendshipRepository.findOneBy([
      { sender: sender, receiver: receiver, status: FriendshipStatus.ACCEPTED }, // sender -> receiver
      { sender: receiver, receiver: sender, status: FriendshipStatus.ACCEPTED }, // receiver -> sender
    ]);

    return friendship ? true : false;
  }

  /* Searches for an entry on the blocked_user table
  where blockedUser = sender && userWhoBlocked = receiver */
  private async isSenderBlocked(
    sender: User,
    receiver: User
  ): Promise<boolean> {

    const blockedUserEntry: BlockedUser = await this.blockedUserRepository.findOneBy([
      { blockedUser: sender, userWhoBlocked: receiver } // sender is the blockedUser
    ]);

    return blockedUserEntry ? true : false;
  }

  public async sendFriendRequest(sender: User, receiverUID: number)
    : Promise<SuccessResponse | ErrorResponse> {
    if (receiverUID == sender.id) {
      throw new BadRequestException("You cannot add yourself as a friend");
    }

    const receiver: User = await this.usersService.findUserByUID(receiverUID);

    const isSenderBlocked: boolean = await this.isSenderBlocked(sender, receiver)
    if (isSenderBlocked) {
      throw new ForbiddenException("You are blocked by the recipient");
    }

    const hasBeenSentAlready: boolean = await this.hasFriendshipBeenEstabilishedAlready(sender, receiver);
    if (hasBeenSentAlready) {
      throw new ConflictException("A friend request has already been sent (to) or received (on) your account");
    }

    const areTheyFriends: boolean = await this.areTheyFriendsAlready(sender, receiver);
    if (areTheyFriends) {
      throw new ConflictException("You're already friends")
    }

    Logger.log("\"" + sender.name + "\" sent a friend request to \"" + receiver.name + "\"");

    await this.friendshipRepository.save({
      sender: sender,
      receiver: receiver
    });
    return { message: "Friend request successfully sent" };
  }

  public async updateFriendshipStatus(
    user: User,
    friendshipId: number,
    newFriendshipStatus: FriendshipStatus,
  ): Promise<SuccessResponse | ErrorResponse> {
    const friendship: Friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['sender'],
    });

    if (!friendship) {
      throw new NotFoundException("Friendship not found");
    }

    // Sender trying to answer the friend request he sent
    if (user.id === friendship.sender.id
      && (newFriendshipStatus == FriendshipStatus.ACCEPTED
      ||  newFriendshipStatus == FriendshipStatus.DECLINED)) {
      throw new BadRequestException("You cannot answer a friend request that you have sent");
    }

    if (newFriendshipStatus == FriendshipStatus.CANCEL
    ||  newFriendshipStatus == FriendshipStatus.UNFRIEND) {
      await this.friendshipRepository.delete(friendship);
    } else {
      friendship.status = newFriendshipStatus;
      await this.friendshipRepository.save(friendship);
    }
    return { message: "Successfully updated friendship status" };
  }
}
