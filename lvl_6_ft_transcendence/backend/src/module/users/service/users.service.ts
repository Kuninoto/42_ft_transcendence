import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from '../dto/CreateUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  public async getUserByName(name: string) {
    return await this.usersRepository.findOneBy({ name: name });
  }

  public async getUserById(id: number) {
    return await this.usersRepository.findOneBy({ id: id });
  }

  // !TODO
  // if nickname is already taken
  // don't create user
  public async createUser(createUserDTO: CreateUserDTO) {
    //if (this.usersRepository.findOneBy({name: createUserDTO.name})) {
    //  return ?;
    //}
    const newUsers = this.usersRepository.create(createUserDTO);

    newUsers.created_at = newUsers.last_updated_at = new Date();
    return await this.usersRepository.save(newUsers);
  }

  public async deleteUserByName(name: string) {
    const user = await this.usersRepository.findOneBy({ name: name });

    return await this.usersRepository.delete(user);
  }

  public async deleteUserById(id: number) {
    return await this.usersRepository.delete(id);
  }

  // !TODO
  private async updateUserAvatar(name: string, newAvatarURL: string) {
    console.log(newAvatarURL);
    return await this.usersRepository.update(name, {
      avatar_url: newAvatarURL,
    });
  }

  public async getUserAvatarURLByName(name: string) {
    const user = await this.usersRepository.findOneBy({ name: name });
    return user.avatar_url;
  }

  public async getUserAvatarURLById(id: number) {
    const user = await this.usersRepository.findOneBy({ id: id });
    return user.avatar_url;
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
