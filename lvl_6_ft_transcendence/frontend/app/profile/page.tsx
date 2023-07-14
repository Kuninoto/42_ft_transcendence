import Image from 'next/image'

export default function Profile() {
	return (
		<div className="flex flex-col">

			<div className="flex w-full my-12">
				<div className="flex flex-col space-y-4 mx-auto text-center">
					<Image src={'https://picsum.photos/200'}
						width="0"
						height="0"
						sizes="100vw"
						alt={'player profile picutre'}
						className="w-48 aspect-square rounded-full" />
						<p className="text-3xl">MACACO</p>
				</div>
			</div>

			<div className="mx-auto flex space-x-12 text-2xl">
				<button className="hover:opacity-100 opacity-25 text-white px-16 py-2 border-b-2 border-white">asdasd</button>
				<button className="hover:opacity-100 opacity-25 text-white px-16 py-2 border-b-2 border-white">asdasd</button>
				<button className="hover:opacity-100 opacity-25 text-white px-16 py-2 border-b-2 border-white">asdasd</button>
			</div>

		</div>
	)
}
