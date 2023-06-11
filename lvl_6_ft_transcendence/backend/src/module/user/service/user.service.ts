import { Injectable } from '@nestjs/common';
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

    public getUserById(id: number) {
			return this.userRepository.findOneBy({id: id});
    }

    public createUser(createUserDto: CreateUserDTO)  {
			const newUser = this.userRepository.create(createUserDto);
      newUser.created_at = newUser.last_update_at = new Date();
			return this.userRepository.save(newUser);
    }

		public deleteUserById(id: number) {
			return this.userRepository.delete(id);
		}

    // !TODO 
    public async patchUserById(id: number, updateUserDTO: UpdateUserDTO) {
        this.userRepository.update(id, updateUserDTO);
    //  this.userRepository.update(id, {last_update_at: Date.now()});
        return this.userRepository.update(id, updateUserDTO);
    }
}
