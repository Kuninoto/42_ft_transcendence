'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Press_Start_2P } from 'next/font/google'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'

import Chat from './chat/page'
import './globals.css'

const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400' })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const handle = useFullScreenHandle()

	return (
		<AuthProvider>
			<html lang="en">
				<body className={`overflow-hidden ${pressStart.className}`}>
					<div className="fixed bottom-4 left-4">
						<button onClick={handle.enter}>Enter fullscreen</button>
					</div>

					<FullScreen handle={handle}>
						<div className="h-screen bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80%">
							{children}
							<Chat />
						</div>
					</FullScreen>
				</body>
			</html>
		</AuthProvider>
	)
}
