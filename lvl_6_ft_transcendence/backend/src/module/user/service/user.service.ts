import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { CreateUserDTO } from '../dto/CreateUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';
import axios from 'axios';

interface imgbbImageUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    }
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    }
    delete_url: string;
  }
  success: boolean;
  status: number;
};

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
      const intraPhoto = createUserDto.intra_photo_url;

      // !TODO
      await this.updateUserAvatar(newUser.id, intraPhoto);
      newUser.created_at = newUser.last_update_at = new Date();
			return await this.userRepository.save(newUser);
    }

		public async deleteUserById(id: number) {
			return await this.userRepository.delete(id);
		}

    // !TODO
    // !CURRENTLY
    private async updateUserAvatar(user_id: number, newAvatar: string) {
      console.log(newAvatar);
      try {
        const response = await axios.post(process.env.IMGBB_UPLOAD_URL, null, {
         params: {
            key: process.env.IMGBB_API_KEY,
            image: newAvatar,
          }
        });
        const uploadResponse: imgbbImageUploadResponse = response.data;

        console.log(uploadResponse.data.thumb.url);
        
        return await this.userRepository.update(user_id, { avatar_url: uploadResponse.data.thumb.url });
      } catch (error) {
        console.error('updateUserAvatar():\n' + error);
        throw new Error('Failed to update user avatar.');
      }
    }

    public async getUserAvatar(id: number) {
			const user = await this.userRepository.findOneBy({id: id});
      const response = await axios.get(process.env.IMGBB_UPLOAD_URL+'/'+ user.avatar_url,
                                        { params: { key: process.env.IMGBB_API_KEY }});
      return response;
    }

    // !TODO
    // figure out how the avatar update should be
    public async patchUserById(id: number, updateUserDTO: UpdateUserDTO) {
    //  this.userRepository.update(id, {last_update_at: Date.now()});
        return this.userRepository.update(id, updateUserDTO);
    }
}
