import { ExecutionContext, CanActivate, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const isAuth = request.isAuthenticated();
        await super.canActivate(context);
        return isAuth;
    }
}
