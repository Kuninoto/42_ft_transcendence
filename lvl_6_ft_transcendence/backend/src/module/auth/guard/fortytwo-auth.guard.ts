import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class FortyTwoAuthGuard extends AuthGuard('42') implements CanActivate { 
    constructor() {
        super();
    }
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        console.log("canActivate() called");

        const result = (await super.canActivate(context)) as boolean;

        console.log("after super.canActivate()");

        const request = context.switchToHttp().getRequest();

        await super.logIn(request);
        return result;
    }
}
