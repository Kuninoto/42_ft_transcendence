import { Achievements } from "./achievements.enum";

export interface AchievementInterface {
  readonly achievement: Achievements;
  readonly description: string;
}
