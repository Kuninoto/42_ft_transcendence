'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Themes() {
	const [saving, setSaving] = useState(false)

	function save() {
		setSaving(!saving)
	}

	function goBackward() {
		setSelectedImage( prevImage => {
			if (prevImage == 0)
				return images.length - 1
			return prevImage - 1
		} )
	}

	function goForward() {
		setSelectedImage( prevImage => {
			if (prevImage == images.length - 1)
				return 0
			return prevImage + 1
		} )
	}

	const [ selectedImage, setSelectedImage ] = useState(0)

	const images = ["default.png", "42.jpg", "anime.jpg", "monke.png"]

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
						src={`/game/backgrounds/${images[selectedImage]}`}
						alt="background"
						fill
						priority
					/>
				</div>
				<button onClick={goForward}>
					<FiChevronRight size={96} />
				</button>
			</div>
		</>
	)
}
