'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Themes() {
	const [saving, setSaving] = useState(false)

	function save() {
		setSaving(!saving)
	}

	return (
		<>
			<Link
				className="fixed left-12 top-12 hover:underline"
				href={'/dashboard'}
			>
				GO BACK
			</Link>

			<div className="flex h-full w-full place-content-center items-center space-x-6">
				<button>
					<FiChevronLeft size={96} />
				</button>
				<div className="flex h-2/3 w-2/3 place-content-center items-center border-2 border-white">
					<button className="" onClick={save}>
						{saving ? 'SAVING...' : 'SAVE'}
					</button>
				</div>
				<button>
					<FiChevronRight size={96} />
				</button>
			</div>
		</>
	)
}
