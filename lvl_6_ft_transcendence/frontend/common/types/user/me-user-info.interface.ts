import { UserStatsInterface } from "types/user-stats";

export interface MeUserInfo {
  id: number;
  name: string;
  avatar_url: string;
  intra_name: string;
  intra_profile_url: string;
  has_2fa: boolean;
  game_theme: string;
  ladder_level: number;
  stats: UserStatsInterface;
  created_at: Date;
}
