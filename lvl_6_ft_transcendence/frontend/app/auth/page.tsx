'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Auth() {
	const { login } = useAuth()

	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		if (login(searchParams.get('code'))) {
			router.push('/dashboard')
		} else {
			console.error('Error logging in!')
			router.push('/')
		}
	}, [])

	return <div>loading</div>
}
