import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from '../dto/CreateUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';

@Injectable()
export class UserService {
    constructor(
			@InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {}

    public async getUserById(id: number) {
			return await this.userRepository.findOneBy({id: id});
    }

    public async createUser(createUserDto: CreateUserDTO)  {
			const newUser = this.userRepository.create(createUserDto);
      newUser.created_at = newUser.last_updated_at = new Date();
			return await this.userRepository.save(newUser);
    }

		public async deleteUserById(id: number) {
			return await this.userRepository.delete(id);
		}

    // !TODO
    private async updateUserAvatar(user_id: number, newAvatarURL: string) {
      console.log(newAvatarURL);
      return await this.userRepository.update(user_id, { avatar_url: newAvatarURL })
    }

    public async getUserAvatarURL(id: number) {
			const user = await this.userRepository.findOneBy({id: id});
      return user.avatar_url;
    }

    // !TODO
    public async updateUserById(id: number, updateUserDTO: UpdateUserDTO) {
      updateUserDTO.last_updated_at = new Date();
      return this.userRepository.update(id, updateUserDTO);
    }
}
