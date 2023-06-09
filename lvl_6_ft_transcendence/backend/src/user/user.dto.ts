export class User {
    readonly id: number;
    readonly name: string;
    readonly hashedPass: string;
    readonly isOnline: boolean;
    readonly isAuth: boolean;
    readonly has2fa: boolean;
    readonly inMatch: boolean;
    readonly createdAt: Date;
}

// https://www.youtube.com/watch?v=1ndwiYe1PXQ
// 17:00