import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
    constructor() {}

    public async getAccessToken(codeParam: string) {
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
            return response.data.access_token;
        }).catch((error) => {
            console.error(error);
            return error;
        });
    }
}
