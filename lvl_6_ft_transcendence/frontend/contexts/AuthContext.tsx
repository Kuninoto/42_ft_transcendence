import { api } from '@/api/api'
import { UserProfile } from '@/common/type/backend/user-profile.interface'
import { hasValues } from '@/common/utils/hasValues'
import axios from 'axios'
import { ImageLoader } from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'
import { useSocket } from './SocketContext'

export const removeParams: ImageLoader = ({ src }: { src: string }) => {
	return src.replace(/&?w=\d+&?/, '').replace(/&?p=\d+&?/, '')
}

export interface AuthContextExports {
	login: (code: string) => Promise<boolean>
	login2fa: (otp : string) => void
	logout: () => void
	user: UserProfile | {}
	refreshUser: () => void
}

const AuthContext = createContext<AuthContextExports>({} as AuthContextExports)

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<{} | UserProfile>({})

	const [tempToken, setTempToken] = useState("")

	const { connect } = useSocket()

	useEffect(() => {
		const token = localStorage.getItem('pong.token')

		if (token) {
			if ( pathname === "/") router.push('/dashboard')

			api
				.get<UserProfile>('/me')
				.then((result) => {
					if (hasValues(result.data)) setUser(result.data)
					else logout()
				})
				.catch(() => logout())
		} 
		else if (pathname !== '/' && pathname !== '/auth') {
			router.push('/')
		}
	}, [])

	async function refreshUser() {
		const user = await api.get("/me")
		setUser(user.data)
	}

	function logout() {
		router.push('/')
		localStorage.removeItem('pong.token')
	}

	async function login2fa( otp: string ) {


		console.log(tempToken)
		const data = await api.post('/auth/2fa/authenticate', {
			headers: {
				Authorization: `Bearer ${tempToken}`,
			},
			data: {
				otp
			}
		})
		.then(result => result.data)
		.catch((e) => { 
			console.log(e)
			throw "Network error" })

		localStorage.setItem('pong.token', data.accessToken)
		const login = await api.get(`/me`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
			},
		})
			.then(result => result.data)
			.catch((e) => { throw(e.response.data.message)})

		connect()
		setUser(login)
	}

	async function login(code: string): Promise<boolean> {

		const data = await axios
			.get(`http://localhost:3000/api/auth/login/callback?code=${code}`)
			.then(result => result.data)
			.catch(() => { throw "Network error" })

		if (data.has2fa) {
			setTempToken(data.accessToken)
			return false
		}

		localStorage.setItem('pong.token', data.accessToken)
		const login = await api.get(`/me`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
			},
		})
			.then(result => result.data)
			.catch((e) => { throw(e.response.data.message)})

		connect()
		setUser(login)
		return true
	}

	const value: AuthContextExports = {
		login,
		login2fa,
		logout,
		refreshUser,
		user
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
