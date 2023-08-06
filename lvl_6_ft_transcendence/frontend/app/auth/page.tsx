'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Auth() {
	const { login } = useAuth()

	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		const code = searchParams.get('code')
		if (code && login(code)) {
			router.push('/dashboard')
		} else {
			console.error('Error logging in!')
			router.push('/')
		}
	}, [])

	return (
		<div className="flex h-full w-full place-content-center items-center">
			<h1 className="text-5xl after:inline-block after:w-0 after:animate-ellipsis after:overflow-hidden after:align-bottom after:content-['\2026']">
				Loading
			</h1>
		</div>
	)
}
