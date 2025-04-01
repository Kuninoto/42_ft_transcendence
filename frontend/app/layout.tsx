'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { FriendsProvider } from '@/contexts/FriendsContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { detect } from 'detect-browser'
import { Press_Start_2P } from 'next/font/google'
import Head from 'next/head'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai'
import { MdOutlineExitToApp } from 'react-icons/md'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Chat from './chat/page'
import './globals.css'

const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400' })

function FixedPanel({ handle }: { handle: any }) {
	const path = usePathname()

	return (
		<div className="fixed bottom-4 left-4 flex items-center rounded border-2 border-white p-2">
			{!handle.active ? (
				<button onClick={handle.enter}>
					<AiOutlineFullscreen size={48} />
				</button>
			) : (
				<button onClick={handle.exit}>
					<AiOutlineFullscreenExit size={48} />
				</button>
			)}

			{path !== '/' && path !== '/game' && (
				<Link href={'/logout'}>
					<MdOutlineExitToApp size={48} />
				</Link>
			)}
		</div>
	)
}

function Body({
	children,
	handle,
}: {
	children: React.ReactNode
	handle: any
}) {
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)') // Adjust the breakpoint as needed

		const handleResize = (e: any) => {
			setIsMobile(e.matches)
		}

		mediaQuery.addEventListener('change', handleResize)
		handleResize(mediaQuery)

		return () => {
			mediaQuery.removeEventListener('change', handleResize)
		}
	}, [])

	if (isMobile) {
		return (
			<div className="flex h-full w-full place-content-center items-center text-center text-2xl">
				CAN&apos;T FIT THIS <br />
				MUCH BEAUTY HERE
			</div>
		)
	}

	return (
		<>
			{children}
			<Chat />
			<FixedPanel handle={handle} />
			<ToastContainer
				autoClose={2500}
				closeButton={false}
				closeOnClick
				draggable
				icon={false}
				limit={2}
				newestOnTop
				pauseOnFocusLoss
				pauseOnHover
				position="bottom-right"
				progressClassName={'bg-gradient-to-r from-[#FB37FF] to-[#F32E7C]'}
				theme="dark"
				toastClassName={`bg-gradient-to-r from-primary-fushia/30 to-primary-shoque/30  ${pressStart.className}`}
			/>
		</>
	)
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const handle = useFullScreenHandle()
	const browser = detect()

	useEffect(() => {
		if (browser?.name != 'chrome') {
			console.warn(
				`Pongfight is not supported for ${browser?.name}! May contain minor issues or inconsistencies`
			)
		}
	})

	return (
		<SocketProvider>
			<AuthProvider>
				<FriendsProvider>
					<html lang="en">
						<Head>
							<link href="/favicon.ico" rel="icon" sizes="any" />
						</Head>
						<body className={`overflow-hidden ${pressStart.className}`}>
							<FullScreen handle={handle}>
								<div className="h-screen bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80%">
									<Body handle={handle}>{children}</Body>
								</div>
							</FullScreen>
						</body>
					</html>
				</FriendsProvider>
			</AuthProvider>
		</SocketProvider>
	)
}
