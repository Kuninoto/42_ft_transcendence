'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { Press_Start_2P } from 'next/font/google'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai'

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
			<ChatProvider>
				<html lang="en">
					<body className={`overflow-hidden ${pressStart.className}`}>
						<FullScreen handle={handle}>
							<div className="h-screen bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80%">
								{children}
								<Chat />
							</div>

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
							</div>
						</FullScreen>
					</body>
				</html>
			</ChatProvider>
		</AuthProvider>
	)
}
