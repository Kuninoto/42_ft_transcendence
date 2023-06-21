import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UsersService } from '../../users/service/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly UsersService: UsersService) {}

  private async requestAccessToken(codeParam: string) {
    // !TODO
    // check nestjs guards
    // and change this protection
    if (!codeParam) return 'No codeParam buddy :(';
    // !TODO
    // wrap this on a try catch
    return await axios
      .post('https://api.intra.42.fr/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.INTRA_CLIENT_UID,
          client_secret: process.env.INTRA_CLIENT_SECRET,
          code: codeParam,
          redirect_uri: process.env.FRONTEND_URL + '/auth/login',
        },
      })
      .then((response) => {
        return response.data.access_token;
      })
      .catch((error) => {
        console.error('requestAccessToken():\n' + error);
        return error;
      });
  }

  private async requestUsersInfo(accessToken: string) {
    // !TODO
    // check nestjs guards
    // and change this protection
    if (!accessToken) return null;

    try {
      const response = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('requestUsersInfo():\n' + error);
    }
  }

  // !TODO
  public async userLogin(codeParam: string) {
    try {
      const accessToken = await this.requestAccessToken(codeParam);
      const UsersInfo = await this.requestUsersInfo(accessToken);

      // if (firstLogin)
      return this.UsersService.createUser({
        name: UsersInfo.login,
        access_token: accessToken,
        avatar_url: UsersInfo.image.versions.medium,
      });
      // else
      //  this.UsersService.login()
    } catch (error) {
      console.error('userLogin():\n' + error);
    }
  }
}
