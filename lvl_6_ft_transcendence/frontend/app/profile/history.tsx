import Link from 'next/link'

export default function History() {
	return (
		<div className="w-full space-y-4">
			<div className="flex w-full place-content-around border border-white py-3 text-xl">
				<p>victory</p>
				<p>12 04</p>
				<p>4:20</p>
				<Link className="hover:underline" href={'/profile'}>
					monkeyy
				</Link>
			</div>
			<div className="flex w-full place-content-around border border-white py-3 text-xl">
				<p>victory</p>
				<p>12 04</p>
				<p>4:20</p>
				<Link className="hover:underline" href={'/profile'}>
					monkeyy
				</Link>
			</div>
			<div className="flex w-full place-content-around border border-white py-3 text-xl">
				<p>victory</p>
				<p>12 04</p>
				<p>4:20</p>
				<Link className="hover:underline" href={'/profile'}>
					monkeyy
				</Link>
			</div>
		</div>
	)
}
