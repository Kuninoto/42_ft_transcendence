import Link from 'next/link'
import Image from 'next/image'

export default function Friends() {
	return (
		<div className="w-full space-y-4">
		<Link className="" href={'/profile'}>
			<div className="flex w-full place-content-around items-center border border-white py-3 text-xl">
			<Image
				alt={'player profile picutre'}
				className="aspect-square w-12 rounded-full"
				height="0"
				sizes="100vw"
				src={'https://picsum.photos/200'}
				width="0"
			/>
				<p>name</p>
				<p>rank</p>
				<p>idk</p>
			</div>
			</Link>
		</div>
	)
}
