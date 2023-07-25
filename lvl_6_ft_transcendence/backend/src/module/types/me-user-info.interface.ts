import { BlockedUserInterface } from "src/common/types/blocked-user-interface.interface";

export interface meUserInfo {
    name: string;
    avatar_url: string;
    intra_profile_url: string;
    has_2fa: boolean;
    created_at: Date;
    blocked_users: BlockedUserInterface[];
}