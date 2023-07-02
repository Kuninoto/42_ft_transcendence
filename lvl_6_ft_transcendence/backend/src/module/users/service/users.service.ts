import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from '../dto/create-user.dto';
import { UpdateUserDTO } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  public async findUserByName(name: string): Promise<User> | null {
    return await this.usersRepository.findOneBy({ name: name });
  }

  // !TODO
  public async findUserById(id: number): Promise<User> | null  {
    return await this.usersRepository.findOneBy({ id: id });
  }

  // !TODO
  public async createUser(createUserDTO: CreateUserDTO): Promise<User> | null {
    const newUser = this.usersRepository.create(createUserDTO);
    newUser.created_at = newUser.last_updated_at = new Date();

    return await this.usersRepository.save(newUser);
  }

/*   public async deleteUserByName(name: string): Promise<DeleteResult> {
    const user = await this.usersRepository.findOneBy({ name: name });
    return await this.usersRepository.delete(user);
  }
 */

  public async deleteUserById(id: number): Promise<DeleteResult> {
    return await this.usersRepository.delete(id);
  }

  // !TODO
  private async updateUserAvatar(name: string, newAvatarURL: string)
  : Promise<UpdateResult> | null {
    const user = await this.usersRepository.findOneBy({ name: name });
    if (!user) {
      return null;
    }

    return await this.usersRepository.update(name, {
      avatar_url: newAvatarURL,
    });
  }

/*   public async findUserAvatarURLByName(name: string): Promise<string> | null {
    const user = await this.usersRepository.findOneBy({ name: name });
    if (!user) {
      return null;
    }
    return user.avatar_url;
  } */

  public async findUserAvatarURLById(id: number): Promise<string> | null {
    const user = await this.usersRepository.findOneBy({ id: id })
    if (!user) {
      return null;
    }
    return user.avatar_url;
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

  // !TODO
  public async updateUserById(id: number, updateUserDTO: UpdateUserDTO)
  : Promise<UpdateResult> | null {
    // somewhy updating without id doesnt update the user
    // const user: User = await this.usersRepository.findOneBy({ id: id });
    // if (!user) {
    //   return null;
    // }
  
    updateUserDTO.last_updated_at = new Date();
    return await this.usersRepository.update(id, updateUserDTO);
  }

  public async enable2fa(id: number, secret_2fa: string) {
    const user: User = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      return null;
    }
  
    return await this.usersRepository.update(user, {
      has_2fa: true,
      secret_2fa: secret_2fa,
      last_updated_at: new Date()
    });
  }
}
