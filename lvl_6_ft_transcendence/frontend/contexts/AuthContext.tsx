'use client'

import { api } from '@/api/api'
import { MeUserInfo } from '@/common/types/backend'
import { hasValues } from '@/common/utils/hasValues'
import axios from 'axios'
import Cookies from 'js-cookie'
import { ImageLoader } from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'
import { toast } from 'react-toastify'

import { socket, useSocket } from './SocketContext'

export const removeParams: ImageLoader = ({ src }: { src: string }) => {
	return src.replace(/&?w=\d+&?/, '').replace(/&?p=\d+&?/, '')
}

export interface AuthContextExports {
	isAuth: boolean
	login: (code: string) => Promise<boolean>
	login2fa: (otp: string) => Promise<void>
	logout: () => void
	refreshUser: () => void
	user: MeUserInfo
}

const AuthContext = createContext<AuthContextExports>({} as AuthContextExports)

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<MeUserInfo>({} as MeUserInfo)

	const [tempToken, setTempToken] = useState('')
	const isAuth = hasValues(user)

	const { connect } = useSocket()

	useEffect(() => {
		const token = Cookies.get('pong.token')

		if (token) {
			if (pathname === '/') router.push('/dashboard')

			api
				.get<MeUserInfo>('/me')
				.then((result) => {
					console.log(result.data)
					if (hasValues(result.data)) setUser(result.data)
					else logout()
				})
				.catch(() => logout())
		} else if (pathname !== '/' && pathname !== '/auth') {
			router.push('/')
		}
	}, [])

	function refreshUser() {
		try {
			api.get('/me').then((result) => setUser(result.data))
		} catch (error: any) {
			toast.error('Network error')
		}
	}

	function logout() {
		if (socket) socket.disconnect()

		setUser({} as MeUserInfo)
		Cookies.remove('pong.token')
		router.push('/')
	}

	async function login2fa(otp: string) {
		const data = await api
			.post(
				'/auth/2fa/authenticate',
				{
					otp,
				},
				{
					headers: {
						Authorization: `Bearer ${tempToken}`,
					},
				}
			)
			.then((result) => result.data)
			.catch((e) => {
				throw e.response.data.message
			})

		Cookies.set('pong.token', data.access_token, {
			expires: 1,
		})

		const login = await api
			.get(`/me`, {
				headers: {
					Authorization: `Bearer ${Cookies.get('pong.token')}`,
				},
			})
			.then((result) => result.data)
			.catch((e) => {
				throw e.response.data.message
			})

		connect()
		setUser(login)
	}

	async function login(code: string): Promise<boolean> {
		const data = await axios
			.get(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login/callback?code=${code}`
			)
			.then((result) => result.data)
			.catch(() => {
				throw 'Network error'
			})

		if (data.has2fa) {
			setTempToken(data.accessToken)
			return false
		}

		Cookies.set('pong.token', data.accessToken, {
			expires: 1,
		})

		const login = await api
			.get(`/me`, {
				headers: {
					Authorization: `Bearer ${Cookies.get('pong.token')}`,
				},
			})
			.then((result) => result.data)
			.catch((e) => {
				throw e.response.data.message
			})

		connect()
		setUser(login)
		return true
	}

	const value: AuthContextExports = {
		isAuth,
		login,
		login2fa,
		logout,
		refreshUser,
		user,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
