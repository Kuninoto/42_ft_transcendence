import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/entity';

export const ExtractUser = createParamDecorator<User>(
  (data: unknown, ctx: ExecutionContext): User => {
    const request: any = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
