'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

export default function Auth() {
	const { login } = useAuth()

	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {

		async function awaitForLogin() {
			try {
				const code = searchParams.get('code')
				if (!code) throw "No code provided"
				await login(code)
				router.push("/dashboard")
			} catch (error) {
				toast.error(error)
				router.push("/")
			}
		}

		awaitForLogin()
	}, [])

	return (
		<div className="flex h-full w-full place-content-center items-center">
			<h1 className="text-5xl after:inline-block after:w-0 after:animate-ellipsis after:overflow-hidden after:align-bottom after:content-['\2026']">
				Loading
			</h1>
		</div>
	)
}
