'use client'

import { api } from '@/api/api'
import { UserProfile } from '@/common/types/backend'
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
	user: UserProfile
}

const AuthContext = createContext<AuthContextExports>({} as AuthContextExports)

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<UserProfile>({} as UserProfile)

	const [tempToken, setTempToken] = useState('')
	const isAuth = hasValues(user)

	const { connect } = useSocket()

	useEffect(() => {
		const token = Cookies.get('pong.token')

		if (token) {
			if (pathname === '/') router.push('/dashboard')

			api
				.get<UserProfile>('/me')
				.then((result) => {
					if (hasValues(result.data)) setUser(result.data)
					else logout()
				})
				.catch(() => logout())
		} else if (pathname !== '/' && pathname !== '/auth') {
			router.push('/')
		}
	}, [])

	async function refreshUser() {
		const user = await api.get('/me')
		setUser(user.data)
	}

	function logout() {
		router.push('/')
		setUser({} as UserProfile)

		if (socket) socket.disconnect()

		Cookies.remove('pong.token')
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
