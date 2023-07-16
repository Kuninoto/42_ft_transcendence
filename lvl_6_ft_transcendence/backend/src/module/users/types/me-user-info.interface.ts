import { Friendship } from "src/typeorm";
import { FriendInterface } from "../../friendships/types/friend-interface.interface";
import { FriendRequestInterface } from "src/module/friendships/types/friend-request.interface";

export interface meUserInfo {
    name: string;
    avatar_url: string;
    intra_profile_url: string;
    has_2fa: boolean;
    created_at: Date;
    friend_requests: FriendRequestInterface[];
    friends: FriendInterface[];
    // wins: number;
}
