'use client'

import { hasValues } from '@/common/utils/hasValues'
import { useAuth } from '@/contexts/AuthContext'
import { GameProvider, useGame } from '@/contexts/GameContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

function FinalModal() {
	const { gameEndInfo } = useGame()
	const { user } = useAuth()

	if (!hasValues(gameEndInfo)) return

	return (
		<div className="absolute z-50 flex h-full w-full flex-col place-content-center items-center space-y-12 bg-black/50">
			<h1 className="text-6xl">
				{gameEndInfo?.winner?.userId == user?.id ? (
					<div>
						You <span className="animate-blink">win!</span>
					</div>
				) : (
					<div>
						Game <span className="animate-blink"> over</span>!
					</div>
				)}
			</h1>
			<Link
				className="rounded border border-white px-16 py-3 text-center text-white mix-blend-lighten hover:bg-white hover:text-black"
				href="/dashboard"
			>
				Home
			</Link>
		</div>
	)
}

function ExitModal({
	closeModal,
	modal,
}: {
	closeModal: () => void
	modal: boolean
}) {
	const { forfeit } = useGame()
	const router = useRouter()

	if (!modal) return <></>

	function goBack() {
		forfeit()
		router.push('/dashboard')
	}

	return (
		<div className="absolute left-0 top-0 z-40 flex h-screen w-screen place-content-center items-center">
			<button
				className="absolute left-0 top-0 h-screen w-screen bg-black/70"
				onClick={closeModal}
			></button>
			<div className="px-8 py-32">
				<div className="relative grid items-start justify-center  gap-8">
					<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#FB37FF] to-[#F32E7C] opacity-100 blur"></div>
					<div className="relative block items-center space-y-8 rounded-lg bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% px-8 py-12 leading-none">
						<div>You sure you want to forfeit?</div>
						<div className="flex w-full place-content-center space-x-8">
							<button
								className="rounded border border-white px-4 py-4 text-white mix-blend-lighten hover:bg-white hover:text-black"
								onClick={goBack}
							>
								Go back
							</button>
							<button className="hover:underline" onClick={closeModal}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function Control({ children }: { children: ReactNode }) {
	const { inGame, countDown, countDownIsTiking } = useGame()

	const [modal, setModal] = useState(false)

	useEffect(() => {
		window.onpopstate = () => {
			if (inGame) {
				setModal(true)
				history.go(1)
			}
		}
	}, [inGame])

	return (
		<>
			<ExitModal closeModal={() => setModal(false)} modal={modal} />
			{ countDownIsTiking && 
				<div className="absolute w-screen h-screen place-content-center items-center text-9xl flex">{countDown}</div>}

			{children}
		</>
	)
}

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<GameProvider>
			<Control>
				<FinalModal />
				{children}
			</Control>
		</GameProvider>
	)
}
