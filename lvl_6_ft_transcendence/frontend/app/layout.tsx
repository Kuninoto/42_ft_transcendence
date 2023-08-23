'use client'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { FriendsProvider } from '@/contexts/ChatContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Press_Start_2P } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
	const { logout } = useAuth()

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
				<button onClick={logout}>
					<MdOutlineExitToApp size={48} />
				</button>
			)}
		</div>
	)
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const handle = useFullScreenHandle()

	return (
		<SocketProvider>
			<AuthProvider>
				<FriendsProvider>
					<html lang="en">
						<body className={`overflow-hidden ${pressStart.className}`}>
							<FullScreen handle={handle}>
								<div className="h-screen bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80%">
									{children}
									<Chat />
								</div>
								<FixedPanel handle={handle} />
								<Link href={'/profile'}>
									<ToastContainer
										progressClassName={
											'bg-gradient-to-r from-[#FB37FF] to-[#F32E7C]'
										}
										autoClose={5000}
										closeOnClick
										draggable
										icon={false}
										limit={2}
										newestOnTop
										pauseOnFocusLoss
										pauseOnHover={false}
										position="top-center"
										theme="dark"
										toastClassName={`font-xs whitespace-nowrap w-max bg-gradient-to-tr from-black via-[#170317] via-30% to-[#0E050E] to-80% ${pressStart.className}`}
									/>
								</Link>
							</FullScreen>
						</body>
					</html>
				</FriendsProvider>
			</AuthProvider>
		</SocketProvider>
	)
}
