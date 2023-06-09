import Image from 'next/image'
import { TbBrandAppleArcade } from 'react-icons/tb'

type Props = {
	children: JSX.Element[]
}


function Card({ children }: Props) {
	return (
		<div className='group h-full'>
			<div className='bg-blue-600 h-full w-[17vw] rounded text-sm drop-shadow-xl shadow-blue-600 group-hover:animation-delay-200 transition-all duration-200 group-hover:-translate-y-8 group-hover:animate-cardBounce items-center flex flex-col text-center space-y-6 place-content-center'>
				{children}
			</div>
		</div>
	)
}

export default function dashboard() {
	return (
		<div className='flex flex-col space-y-12'>
			<div>
				<Image
					src={'/logo.png'}
					alt='logo picture'
					width={135}
					height={125}
				/>

			</div>

			<div className='flex mx-auto space-x-12 h-[50vh]'>

				<Card>
					<div className='text-2xl'>Play</div>
					<TbBrandAppleArcade size={124} color='white' />
					<div>lorem ipsum dolor sit</div>
				</Card>

				<Card>
					<div className='text-2xl'>Play</div>
					<TbBrandAppleArcade size={124} color='white' />
				</Card>

				<Card>
					<TbBrandAppleArcade size={148} color='white' />
					<div className='text-2xl'>Play</div>
				</Card>
			</div>
		</div>
	)
}
