'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { themes, amount } from '@/common/themes'
import { api } from '@/api/api'

export default function Themes() {
	const [saving, setSaving] = useState(false)

	function save() {

		setSaving(true)

		api.patch("/me/game-theme", {
			newGameTheme: themeKeys[selected]
		}).finally(() => {
			setSaving(false)
		})

	}

	const themeKeys = Object.keys(themes)

	function goBackward() {
		setSelected((prevSelect: number) => {
			if (prevSelect == 0)
				return amount - 1
			return prevSelect - 1
		} )
	}

	function goForward() {
		setSelected((prevSelect : number) => {
			if (prevSelect == amount - 1)
				return 0
			return prevSelect + 1
		} )
	}

	const [ selected , setSelected ] = useState<number>(0)

	return (
		<>
			<Link
				className="fixed left-12 top-12 hover:underline"
				href={'/dashboard'}
			>
				GO BACK
			</Link>

			<div className="flex overflow-hidden h-full w-full place-content-center items-center space-x-6">
				<button onClick={goBackward}>
					<FiChevronLeft size={96} />
				</button>
				<div className="flex relative h-2/3 w-2/3 place-content-center items-center border-2 border-white">
					<button className="z-10" onClick={save}>
						{saving ? 'SAVING...' : 'SAVE'}
					</button>
					<Image 
						className="absolute"
						src={`/game/backgrounds/${themes[themeKeys[selected]].background}`}
						alt="background"
						fill
						priority
					/>
					<div className='absolute place-content-center flex w-3 h-24 left-4'>
						<Image 
							src={`/game/paddles/${themes[themeKeys[selected]].paddle}`}
							alt="paddle"
							fill
							priority
						/>
					</div>
				</div>
				<button onClick={goForward}>
					<FiChevronRight size={96} />
				</button>
			</div>
		</>
	)
}
