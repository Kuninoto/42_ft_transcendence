import { FriendInterface } from "../../friendships/types/friend-interface.interface";
import { FriendRequestInterface } from "src/module/friendships/types/friend-request.interface";
import { BlockedUserInterface } from "src/common/types/blocked-user-interface.interface";

export interface meUserInfo {
    name: string;
    avatar_url: string;
    intra_profile_url: string;
    has_2fa: boolean;
    created_at: Date;
    friend_requests: FriendRequestInterface[];
    friends: FriendInterface[];
    blocked_users: BlockedUserInterface[];
    // wins: number;
}
