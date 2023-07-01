import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class FortyTwoAuthGuard extends AuthGuard('42') implements CanActivate { 
    constructor() {
        super();
    }
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const result = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        return result;
    }
}
