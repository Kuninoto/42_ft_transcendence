import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/entity';
import { Repository } from 'typeorm';
import { TokenPayload } from '../auth/strategy/jwt-auth.strategy';
import { UserIdToSocketIdMap } from './UserIdToSocketIdMap';

@Injectable()
export class ConnectionService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    // TODO
    // UNCOMMENT
    // private readonly authService: AuthService,
    private userIdToSocketId: UserIdToSocketIdMap,
  ) {}

  public async authenticateClientAndRetrieveUser(
    client: Socket,
  ): Promise<User> {
    const authHeader: string | undefined =
      client.handshake.headers.authorization;
    if (!authHeader) {
      throw new Error('Unauthorized client, missing Auth Header');
    }

    // Authentication: Bearer xxxxx
    // Get the token itself (xxxxx) without "Bearer"
    const authToken: string = authHeader.split(' ')[1];

    const user: User | null = await this.authClientFromAuthToken(authToken);

    if (!user) {
      throw new Error('Unauthorized client, unknown');
    }

    // TODO
    // UNCOMMENT
    // if (authToken != this.authService.tokenWhitelist.get(user.id.toString())) {
    //   throw new Error('Invalid token');
    // }

    return user;
  }

  public findSocketIdByUID(userId: string): string | undefined {
    return this.userIdToSocketId.findSocketIdByUID(userId);
  }

  public updateSocketIdByUID(userId: string, socketId: string): void {
    this.userIdToSocketId.updateSocketIdByUID(userId, socketId);
  }

  public deleteSocketIdByUID(userId: string): void {
    this.userIdToSocketId.deleteSocketIdByUID(userId);
  }

  private async authClientFromAuthToken(token: string): Promise<User | null> {
    // verify() throws if JWT's signature is not valid
    try {
      const payload: TokenPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.has_2fa && !payload.is_2fa_authed) {
        throw new Error('Unauthorized Client');
      }

      const userId: number = payload.id;

      return await this.usersRepository.findOneBy({ id: userId });
    } catch (error) {
      return null;
    }
  }
}
