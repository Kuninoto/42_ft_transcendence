import { AchievementsList } from '@/common/achievements'
import { AchievementInterface } from '@/common/types/backend/achievement-interface.interface'
import Image from 'next/image'

export default function Achievements({
	achievements,
}: {
	achievements: AchievementInterface[] | undefined
}) {
	return (
		<div className="h-full w-full space-y-4">
			{achievements?.map((achievement) => (
				<div
					className="flex w-full place-content-around items-center space-x-4 rounded-sm border border-white px-4 py-3 text-xl"
					key={achievement?.achievement}
				>
					<div className="relative aspect-square w-24 overflow-hidden rounded">
						<Image
							src={
								`/achievements/${AchievementsList[achievement?.achievement]
									?.image}` || '/placeholder.gif'
							}
							alt={`${achievement?.achievement} achievement image`}
							fill
							objectFit="cover"
							sizes="100vw"
						/>
					</div>
					<div className="w-full">
						<div className="text-2xl">{achievement?.achievement}</div>
						<div className="text-xs">{achievement?.description}</div>
					</div>
				</div>
			))}
		</div>
	)
}
