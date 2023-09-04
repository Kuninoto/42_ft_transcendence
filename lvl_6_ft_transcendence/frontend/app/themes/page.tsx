'use client'

import { api } from '@/api/api'
import { amount, themes } from '@/common/themes'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Themes() {
	const { refreshUser, user } = useAuth()

	const [saving, setSaving] = useState(false)
	const [selected, setSelected] = useState<number>(0)
	const [ball, setBall] = useState({
		left: 50,
		leftDirection: 0.75,
		top: 30,
		topDirection: 0.75,
	})

	useEffect(() => {
		const loop = setTimeout(() => {
			setBall((prevBall) => {
				const nextLeft =
					prevBall.left >= 98 && prevBall.leftDirection > 0
						? -0.75
						: prevBall.left <= 0 && prevBall.leftDirection < 0
						? 0.75
						: null

				const nextTop =
					prevBall.top >= 98 && prevBall.topDirection > 0
						? -0.75
						: prevBall.top <= 0 && prevBall.topDirection < 0
						? 0.75
						: null

				return {
					left: prevBall.left + prevBall.leftDirection,
					leftDirection: nextLeft ? nextLeft : prevBall.leftDirection,
					top: prevBall.top + prevBall.topDirection,
					topDirection: nextTop ? nextTop : prevBall.topDirection,
				}
			})
		}, 10)

		return () => clearTimeout(loop)
	})

	function save() {
		setSaving(true)

		api
			.patch('/me/game-theme', {
				newGameTheme: themeKeys[selected],
			})
			.finally(() => {
				refreshUser()
				setSaving(false)
			})
	}

	const themeKeys = Object.keys(themes)

	function goBackward() {
		setSelected((prevSelect: number) => {
			if (prevSelect == 0) return amount - 1
			return prevSelect - 1
		})
	}

	function goForward() {
		setSelected((prevSelect: number) => {
			if (prevSelect == amount - 1) return 0
			return prevSelect + 1
		})
	}

	return (
		<>
			<Link
				className="fixed  top-0 h-28 w-40 hover:underline"
				href={'/dashboard'}
			>
				<Image
					alt="logo picture"
					fill
					priority
					sizes="100%"
					src={'/logo.png'}
				/>
			</Link>

			<div className="flex h-full w-full place-content-center items-center space-x-6 overflow-hidden">
				<button onClick={goBackward}>
					<FiChevronLeft size={96} />
				</button>
				<div className="relative flex h-2/3 w-2/3 place-content-center items-center border-2 border-white">
					{user.game_theme == themeKeys[selected] ? (
						<div className="z-50 text-3xl">In use</div>
					) : (
						<button className="z-10 text-3xl" onClick={save}>
							{saving ? 'SAVING...' : 'SAVE'}
						</button>
					)}

					<Image
						alt="background"
						className="object-cover"
						fill
						priority
						src={`/game/backgrounds/${themes[themeKeys[selected]].background}`}
					/>

					<div
						style={{
							backgroundColor: themes[themeKeys[selected]].ball,
							left: ball.left + '%',
							top: ball.top + '%',
						}}
						className="absolute aspect-square w-4 rounded-full"
					></div>

					<div className="absolute left-4 flex h-24 w-3 place-content-center">
						<Image
							alt="paddle"
							fill
							priority
							src={`/game/paddles/${themes[themeKeys[selected]].paddle}`}
						/>
					</div>
					<div className="absolute right-4 flex h-24 w-3 place-content-center">
						<Image
							alt="paddle"
							fill
							priority
							src={`/game/paddles/${themes[themeKeys[selected]].paddle}`}
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
