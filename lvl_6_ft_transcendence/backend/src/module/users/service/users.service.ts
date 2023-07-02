import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from '../dto/create-user.dto';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { SupportInfo } from 'prettier';

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
    // If nickname is already taken don't create user and return null
    if (this.usersRepository.findOneBy({name: createUserDTO.name})) {
      return null;
    }

    const newUser = this.usersRepository.create(createUserDTO);
    newUser.created_at = newUser.last_updated_at = new Date();

    return await this.usersRepository.save(newUser);
  }

  public async deleteUserByName(name: string): Promise<DeleteResult> {
    const user = await this.usersRepository.findOneBy({ name: name });

    return await this.usersRepository.delete(user);
  }

  public async deleteUserById(id: number): Promise<DeleteResult> {
    return await this.usersRepository.delete(id);
  }

  // !TODO
  private async updateUserAvatar(name: string, newAvatarURL: string) {
    console.log(newAvatarURL);
    return await this.usersRepository.update(name, {
      avatar_url: newAvatarURL,
    });
  }

  public async findUserAvatarURLByName(name: string): Promise<string> | null {
    const user = await this.usersRepository.findOneBy({ name: name });
    return user.avatar_url;
  }

  public async findUserAvatarURLById(id: number): Promise<string> | null {
    return (await this.usersRepository.findOneBy({ id: id })).avatar_url;
  }

  // !TODO
  public async updateUserByName(name: string, updateUserDTO: UpdateUserDTO) {
    //if (updateUserDTO.name && this.usersRepository.findOneBy({name: updateUserDTO.name})) {
    //  return ?;
    //}
    const user = await this.usersRepository.findOneBy({
      name: updateUserDTO.name,
    });
    updateUserDTO.last_updated_at = new Date();
    return this.usersRepository.update(user, updateUserDTO);
  }

  // !TODO
  public async updateUserById(id: number, updateUserDTO: UpdateUserDTO) {
    updateUserDTO.last_updated_at = new Date();
    return this.usersRepository.update(id, updateUserDTO);
  }
}
