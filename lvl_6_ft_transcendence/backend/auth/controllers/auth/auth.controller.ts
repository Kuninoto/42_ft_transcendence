import { Controller, Get, Post } from '@nestjs/common';

// Post /auth
// Assuming the 42 API redirects to <redirect_url>
// by sending a POST with the user's info

@Controller('auth')
export class AuthController {
    @Post()
    findAll(): string {
        return "This action adds a new user";
    }

    @Get()
    findAll(): string {
        return "This action returns all auths";
    }
}
