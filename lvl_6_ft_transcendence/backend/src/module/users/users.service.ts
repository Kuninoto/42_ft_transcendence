import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import * as path from 'path';
import * as fs from 'fs';
import { ErrorResponse } from 'src/common/types/error-response.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  public async findUserByName(name: string): Promise<User> | null {
    return await this.usersRepository.findOneBy({ name: name });
  }

  // !TODO
  public async findUserByUID(userID: number): Promise<User> | null {
    return await this.usersRepository.findOneBy({ id: userID });
  }

  // !TODO
  public async createUser(createUserDTO: CreateUserDTO)
  : Promise<User> {
    const newUser = this.usersRepository.create(createUserDTO);
    return await this.usersRepository.save(newUser);
  }

  public async deleteUserByUID(userID: number)
  : Promise<SuccessResponse> {
    await this.usersRepository.delete(userID);
    return { message: 'Successfully deleted user' };
  }

  public async updateUserByUID(userID: number, updateUserDTO: UpdateUserDTO)
  : Promise<SuccessResponse> {
    updateUserDTO.last_updated_at = new Date();
    await this.usersRepository.update(userID, updateUserDTO);
    return { message: 'Successfully updated user' };
  }

  /* // !TODO
    public async updateUserByName(name: string, updateUserDTO: UpdateUserDTO)
    : Promise<UpdateResult> | null {
      const user = await this.usersRepository.findOneBy({
        name: name,
      });
  
      // If the user doesn't exist or if the incoming
      // update would update the name and an user with
      // that name already exists (we found it above), return null
      if (!user || updateUserDTO.name && name === user.name) {
        return null;
      }
  
      updateUserDTO.last_updated_at = new Date();
      return this.usersRepository.update(user, updateUserDTO);
    } */

  public async updateUsernameByUID(userID: number, newName: string)
  : Promise<SuccessResponse | ErrorResponse> {
    const user: User | null = await this.usersRepository.findOneBy({ name: newName });

    // A user already exists with that name
    if (user !== null) {
      throw new ConflictException("Name is already taken");
    }

    await this.usersRepository.update(userID, {
      name: newName,
      last_updated_at: new Date()
    });
    return { message: 'Successfully updated username' };
  }

  // !TODO
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
    return { message: 'Successfully updated user avatar!' };
  }

  public async enable2fa(userID: number, secret_2fa: string)
    : Promise<UpdateResult> {
    Logger.log("Enabling 2fa for user with id = " + userID);
    return await this.usersRepository.update(userID, {
      has_2fa: true,
      secret_2fa: secret_2fa,
      last_updated_at: new Date()
    });
  }

  public async disable2fa(userID: number): Promise<SuccessResponse> {
    await this.usersRepository.update(userID, {
      has_2fa: false,
      secret_2fa: '',
      last_updated_at: new Date()
    });
    return { message: "Successfully disabled two factor authentication" };
  }
}
