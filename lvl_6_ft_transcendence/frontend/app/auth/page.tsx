'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Auth() {
	const { login, user } = useAuth()

	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		if (login(searchParams.get('code'))) {
			router.push('/dashboard')
		} else {
			console.log('Error logging in!')
			router.push('/')
		}
	}, [])

	return <div>loading</div>
}
