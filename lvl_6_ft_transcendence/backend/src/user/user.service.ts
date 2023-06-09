import { Injectable, HttpException } from '@nestjs/common';
import { User } from './user.entity';

// just to have dummy data
import { USERS } from './user.mock';

@Injectable()
export class UserService {
    private users = USERS;

    public getUser() {
        return this.users;
    }

    // !TODO
    public getUserById(id: number) {
        const user = this.users.find((user) => user.id === id);
        if (!user) {
            throw new HttpException('User not found', 404);
        }
        return user;
    }

    // !TODO
    public postUser(user: User) {
        return this.users.push(user);
    }

    // !TODO
    public deleteUserById(id: number) {
        const userIndex = this.users.findIndex((user) => user.id === id);
        if (userIndex === -1) {
            throw new HttpException('User not found', 404);
        }
        this.users.splice(userIndex, 1);
        return this.users;
    }

    // !TODO 
    public patchUserById(id: number, 
                               name: string,
                               hashedPass: string) {
        const userIndex = this.users.findIndex((user) => user.id === id);
        if (userIndex === -1) {
            throw new HttpException('User not found', 404);
        }
        this.users[userIndex][name] = name;
        this.users[userIndex][hashedPass] = hashedPass;
        return;
    }
}
