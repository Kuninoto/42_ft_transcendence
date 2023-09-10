import { AchievementsList } from '@/common/achievements'
import { AchievementInterface } from '@/common/types'
import Tippy from '@tippyjs/react'
import Image from 'next/image'

function Modal({ achievement }: { achievement: AchievementInterface }) {
	return (
		<div className="border border-white bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% p-4">
			<div className="relative aspect-square w-64 overflow-hidden rounded ">
				<Image
					src={
						`/achievements/${AchievementsList[achievement?.achievement]
							?.image}` || '/placeholder.gif'
					}
					alt={`${achievement?.achievement} achievement image`}
					className="object-cover"
					fill
					sizes="100vw"
				/>
			</div>
		</div>
	)
}

export default function Achievements({
	achievements,
}: {
	achievements: AchievementInterface[] | undefined
}) {
	return (
		<div className="h-full w-full space-y-4 overflow-auto scrollbar-thin scrollbar-thumb-white scrollbar-thumb-rounded">
			{achievements?.map((achievement) => (
				<Tippy
					content={<Modal achievement={achievement} />}
					delay={0}
					followCursor={true}
					key={achievement?.achievement}
					placement="left"
					trigger="click"
				>
					<button className="flex w-full space-x-4 rounded-sm border border-white px-4 py-3 text-start text-xl">
						<div className="relative aspect-square w-24 overflow-hidden rounded">
							<Image
								src={
									`/achievements/${AchievementsList[achievement?.achievement]
										?.image}` || '/placeholder.gif'
								}
								alt={`${achievement?.achievement} achievement image`}
								className="object-cover"
								fill
								sizes="100vw"
							/>
						</div>
						<div className="w-full">
							<div className="text-2xl">{achievement?.achievement}</div>
							<div className="text-xs">{achievement?.description}</div>
						</div>
					</button>
				</Tippy>
			))}
		</div>
	)
}
