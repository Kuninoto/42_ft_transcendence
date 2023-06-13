import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UserService } from '../../user/service/user.service';
import { CreateUserDTO } from 'src/module/user/dto/CreateUser.dto';
import { UpdateUserDTO } from 'src/module/user/dto/UpdateUser.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    private async requestAccessToken(codeParam: string) {
        // !TODO
        // check nestjs guards
        // and change this protection
        if (!codeParam) return 'No codeParam buddy :(';
        // !TODO
        // Make these hardcoded values dynamic
        // wrap this on a try catch
        return await axios.post('https://api.intra.42.fr/oauth/token', null, { params: {
            grant_type: 'authorization_code',
            client_id: 'u-s4t2ud-b5dc96e149f80b24df624871658fdaa8d6610f1efc0a284afab94cbdb7d0420c',
            client_secret: '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',
            code: codeParam,
            redirect_uri: 'http://localhost:3000/auth/login',
        }}).then((response) => {
            console.log('response.data.access_token = ' + response.data.access_token);
            return response.data.access_token;
        }).catch((error) => {
            console.error(error);
            return error;
        });
    }

    private async requestUserInfo(accessToken: string) {
        // !TODO
        // check nestjs guards
        // and change this protection
        if (!accessToken) return null;
    
        try {
            const response = await axios.get('https://api.intra.42.fr/v2/me', { headers: {
                                Authorization: 'Bearer ' + accessToken,
                            }});
            console.log('response.data = ' + response.data);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    public async userLogin(codeParam: string) {        
      try {
        const accessToken = await this.requestAccessToken(codeParam);
        const userInfo = await this.requestUserInfo(accessToken);

        // if (firstLogin)
          this.userService.createUser({name: userInfo.name, avatar_endpoint: userInfo.avatar_endpoint});  
        // else
        //  this.userService.login()
      } catch (error) {
        // Handle any errors that occurred during the process
        console.error(error);
      }
    }
}
