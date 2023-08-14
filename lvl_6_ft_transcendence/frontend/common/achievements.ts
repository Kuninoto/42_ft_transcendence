
interface IAchievements {
  [ name : string ]: {
    image : string
  }
}

export const AchievementsList : IAchievements = {
  default: {
    image: "placeholder.gif"
  },
  "PongFight Maestro": {
    image: "/placeholder.gif"
  }
}