'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import OtpInput from 'react18-input-otp'

export default function Auth() {
	const { login, login2fa } = useAuth()

	const searchParams = useSearchParams()
	const router = useRouter()

	const [otp, setOtp] = useState('')
	const [get2fa, setGet2fa] = useState(false)

	const send2fa = async () => {
		try {
			setGet2fa(false)
			await login2fa(otp)
			router.push('/dashboard')
		} catch (error: any) {
			toast.error(error)
			router.push('/')
		}
	}

	useEffect(() => {
		async function awaitForLogin() {
			try {
				const code = searchParams.get('code')
				if (!code) throw 'No code provided'
				if (await login(code)) {
					router.push('/dashboard')
				} else {
					setGet2fa(true)
				}
			} catch (error: any) {
				toast.error(error)
				router.push('/')
			}
		}

		awaitForLogin()
	}, [])

	return (
		<div className="flex h-full w-full place-content-center items-center">
			{get2fa ? (
				<div className="flex h-full flex-col place-content-center items-center space-y-8 text-center">
					<h1 className="text-3xl">
						Two factor <br />
						authentication
					</h1>

					<OtpInput
						containerStyle="w-full place-content-center flex text-xl space-x-1"
						inputStyle="border bg-transparent !w-12 aspect-square rounded"
						isInputNum
						numInputs={6}
						onChange={(newOtp: string) => setOtp(newOtp)}
						value={otp}
					/>

					<button
						className="m-auto rounded border border-white px-24 py-2 text-white mix-blend-lighten hover:bg-white hover:text-black"
						onClick={send2fa}
					>
						Login
					</button>
				</div>
			) : (
				<h1 className="text-5xl after:inline-block after:w-0 after:animate-ellipsis after:overflow-hidden after:align-bottom after:content-['\2026']">
					Booting up
				</h1>
			)}
		</div>
	)
}
