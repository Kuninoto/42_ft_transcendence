'use client'

import './globals.css'
import { Press_Start_2P } from 'next/font/google'
import { FullScreen, useFullScreenHandle } from "react-full-screen";

const pressStart = Press_Start_2P({ weight: "400", subsets: ['latin'] })

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const handle = useFullScreenHandle();

	return (
		<html lang="en">
			<body className={pressStart.className}>
				<div className='fixed bottom-4 left-4'>
					<button onClick={handle.enter}>
						Enter fullscreen
					</button>
				</div>


				<FullScreen handle={handle}>
					<div className="h-screen bg-gradient-to-tr from-black via-[#221922] to-black ">
						{children}
					</div>
				</FullScreen>
			</body>
		</html>
	)
}
