import { AchievementsList } from "@/common/achievements"
import Image from 'next/image'
import { AchievementInterface } from "@/common/types/backend/achievement-interface.interface"

export default function Achievements({
	achievements,
}: {
	achievements: AchievementInterface[] | undefined
}) {
	return (
		<div className="h-full w-full space-y-4">
			{achievements?.map((achievement) => 
				<div 
					key={achievement?.achievement}
				className="flex w-full space-x-4 place-content-around rounded-sm items-center border border-white px-4 py-3 text-xl">
					<div className="relative aspect-square w-24 rounded overflow-hidden">
						<Image
							alt={`${achievement?.achievement} achievement image`}
							fill
							sizes="100vw"
							src={AchievementsList[achievement?.achievement].image || "placeholder.gif"}
						/>
					</div>
					<div className="w-full">
						<div className="text-2xl">{achievement?.achievement}</div>
						<div className="text-xs">{achievement?.description}</div>
					</div>
				</div>
			)}
		</div>
	)
}
