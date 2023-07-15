import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Friendship, User } from 'src/typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import * as path from 'path';
import * as fs from 'fs';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { FriendshipStatus } from 'src/entity/friendship.entity';
import { meUserInfo } from './types/meUserInfo.interface';
import { FriendInterface } from './types/FriendInterface.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>
  ) { }

  public async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  /****************************
  *         User CRUD         *
  *****************************/

  public async createUser(createUserDTO: CreateUserDTO)
    : Promise<User> {
    const newUser = this.usersRepository.create(createUserDTO);
    return await this.usersRepository.save(newUser);
  }

  public async findUserByName(name: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ name: name });
  }

  public async findUserByUID(userID: number): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id: userID });
  }

  public async updateUserByUID(userID: number, updateUserDTO: UpdateUserDTO)
    : Promise<SuccessResponse> {
    updateUserDTO.last_updated_at = new Date();
    await this.usersRepository.update(userID, updateUserDTO);
    return { message: 'Successfully updated user' };
  }

  public async updateUsernameByUID(userID: number, newName: string)
    : Promise<SuccessResponse | ErrorResponse> {
    if (newName.length > 10) {
      throw new BadRequestException("Usernames must not be longer than 10 characters");
    }

    const user: User | null = await this.usersRepository.findOneBy({ name: newName });

    // A user already exists with that name
    if (user !== null) {
      throw new ConflictException("Username is already taken");
    }

    await this.usersRepository.update(userID, {
      name: newName,
      last_updated_at: new Date()
    });
    return { message: 'Successfully updated username' };
  }

  public async updateUserAvatarByUID(userID: number, newAvatarURL: string)
    : Promise<SuccessResponse> {
    const currentAvatarURL = (await this.usersRepository.findOneBy({ id: userID })).avatar_url;
    const currentAvatarName = currentAvatarURL.slice(currentAvatarURL.lastIndexOf('/'));
    const absoluteAvatarPath = path.join(__dirname, '../../../public', currentAvatarName);

    // Delete the previous avatar from the file system
    fs.unlink(absoluteAvatarPath, () => { });

    await this.usersRepository.update(userID, {
      avatar_url: newAvatarURL,
      last_updated_at: new Date(),
    });
    return { message: 'Successfully updated user avatar' };
  }

  public async deleteUserByUID(userID: number)
    : Promise<SuccessResponse> {
    await this.usersRepository.delete(userID);
    return { message: 'Successfully deleted user' };
  }

  /**********************************
  *               2FA               *
  **********************************/

  public async enable2fa(userID: number, secret_2fa: string)
    : Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      has_2fa: true,
      secret_2fa: secret_2fa,
      last_updated_at: new Date()
    });
    return { message: "Successfully disabled two factor authentication" };
  }

  public async disable2fa(userID: number): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      has_2fa: false,
      secret_2fa: null,
      last_updated_at: new Date()
    });
    return { message: "Successfully disabled two factor authentication" };
  }

  /************************************
  *              Friends              *
  ************************************/

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

    const myFriendsIDs: number[] = [];

    myFriendships.forEach((friend: Friendship) => {
      if (friend.sender.id === meUser.id) {
        myFriendsIDs.push(friend.receiver.id);
      } else if (friend.receiver.id === meUser.id) {
        myFriendsIDs.push(friend.sender.id);
      }
    });
  
    const myFriends: User[] = await this.usersRepository.findByIds(myFriendsIDs); 

    const myFriendsInterfaces: FriendInterface[] = [];

    myFriends.forEach(friend => {
      myFriendsInterfaces.push({
        name: friend.name,
        avatar_url: friend.avatar_url,
        status: friend.status
      })
    })
    return myFriendsInterfaces;
  }

  public async getFriendshipStatus(sender: User, receiverUID: number)
    : Promise<FriendshipStatus> {
    const receiver = await this.findUserByUID(receiverUID);
    const friendRequest = await this.friendshipRepository.findOneBy({
      sender: sender,
      receiver: receiver
    });
    return friendRequest.status;
  }

  private async hasFriendRequestBeenSentAlready(
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

  public async sendFriendRequest(sender: User, receiverUID: number)
    : Promise<SuccessResponse | ErrorResponse> {
    if (receiverUID === sender.id) {
      throw new BadRequestException("You cannot add yourself as a friend");
    }

    const receiver: User = await this.findUserByUID(receiverUID);
    const hasBeenSentAlready: boolean = await this.hasFriendRequestBeenSentAlready(sender, receiver);

    if (hasBeenSentAlready) {
      throw new ConflictException("A friend request has already been sent (to) or received (on) your account");
    }

    Logger.log("\"" + sender.name + "\" sent a friend request to \"" + receiver.name + "\"");

    await this.friendshipRepository.save({
      sender: sender,
      receiver: receiver
    });
    return { message: "Friend request successfully sent" };
  }

  public async updateFriendshipStatus(
    friendshipId: number,
    newFriendshipStatus: FriendshipStatus,
  ): Promise<SuccessResponse> {
    if (newFriendshipStatus == FriendshipStatus.CANCEL) {      
      const friendshipToCancel = await this.friendshipRepository.findOneBy({ id: friendshipId });

      await this.friendshipRepository.delete(friendshipToCancel);
    } else {
      const friendRequest = await this.friendshipRepository.findOneBy({ id: friendshipId });
      friendRequest.status = newFriendshipStatus;
      
      await this.friendshipRepository.save(friendRequest);
    }
    return { message: "Successfully updated friendship status" };
  }
}
