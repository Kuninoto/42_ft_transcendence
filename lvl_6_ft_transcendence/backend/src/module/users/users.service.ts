import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { SuccessResponseDTO } from 'src/common/dto/success-response.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) { }

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
    newUser.created_at = newUser.last_updated_at = new Date();

    return await this.usersRepository.save(newUser);
  }

  public async deleteUserByUID(userID: number)
    : Promise<SuccessResponseDTO> {
    await this.usersRepository.delete(userID);
    return { message: 'Successfully deleted user' };
  }

  public async updateUserByUID(userID: number, updateUserDTO: UpdateUserDTO)
    : Promise<SuccessResponseDTO> {
    updateUserDTO.last_updated_at = new Date();
    await this.usersRepository.update(userID, updateUserDTO);
    return { message: 'Successfully updated user!' };
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
    : Promise<SuccessResponseDTO> {
    await this.usersRepository.update(userID, {
      name: newName,
      last_updated_at: new Date()
    });
    return { message: 'Successfully updated username!' };
  }

  // !TODO
  public async updateUserAvatarByUID(userID: number, newAvatarURL: string)
    : Promise<SuccessResponseDTO> {
    // Delete the previous avatar from the file system
    //const currentAvatarPath = (await this.usersRepository.findOneBy({id: userID})).avatar_url;
    await fs.unlink('../../../public' + "ae3fb9ed7796b10e9210cf49e107df01466.png", () => {});

    await this.usersRepository.update(userID, {
      avatar_url: newAvatarURL,
    });
    return { message: 'Successfully updated user avatar!' };
  }

  public async enable2fa(id: number, secret_2fa: string)
    : Promise<UpdateResult> {
    console.log("Enabling 2fa for user with id = " + id);
    return await this.usersRepository.update(id, {
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
