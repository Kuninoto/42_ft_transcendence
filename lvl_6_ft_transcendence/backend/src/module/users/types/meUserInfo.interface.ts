import { FriendRequest, Friendship } from "src/typeorm";

export interface meUserInfo {
    name: string;
    avatar_url: string;
    intra_profile_url: string;
    has_2fa: boolean;
    created_at: Date;
    friend_requests: FriendRequest[];
    friendships: Friendship[];
    // wins: number;
}
