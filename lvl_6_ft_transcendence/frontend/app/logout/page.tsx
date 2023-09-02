'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function Logout() {
	const { logout } = useAuth()

	useEffect(() => {
		logout()
	}, [])

	return (
		<div className="flex h-full w-full flex-col place-content-center items-center space-y-4">
			<h1 className="text-5xl after:inline-block after:w-0 after:animate-ellipsis after:overflow-hidden after:align-bottom after:content-['\2026']">
				Logging out
			</h1>
			<span>Bye bye</span>
		</div>
	)
}
