import {
  Logger,
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
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
}