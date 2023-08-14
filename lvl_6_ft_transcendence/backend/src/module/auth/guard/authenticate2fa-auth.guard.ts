import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Authenticate2faAuthGuard extends AuthGuard('jwt') {}
