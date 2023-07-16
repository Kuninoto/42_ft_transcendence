import { Friendship } from "src/typeorm";
import { FriendInterface } from "./FriendInterface.interface";

export interface meUserInfo {
    name: string;
    avatar_url: string;
    intra_profile_url: string;
    has_2fa: boolean;
    created_at: Date;
    friend_requests: Friendship[];
    friends: FriendInterface[];
    // wins: number;
}
