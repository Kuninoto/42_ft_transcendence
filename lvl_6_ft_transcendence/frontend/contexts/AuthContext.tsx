import { api } from '@/api/api'
import { UserProfile } from '@/common/type/backend/user-profile.interface'
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

export const removeParams: ImageLoader = ({ src }: { src: string }) => {
	return src.replace(/&?w=\d+&?/, '').replace(/&?p=\d+&?/, '')
}

export interface AuthContextExports {
	login: (code: string) => void
	logout: () => void
	user: UserProfile | {}
	refreshUser: () => void
}

const AuthContext = createContext<AuthContextExports>({} as AuthContextExports)

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<{} | UserProfile>({})

	//	useEffect(() => {
	//		const token = localStorage.getItem('pong.token')
	//
	//		if (token && pathname === '/') router.push('/dashboard')
	//
	//		if (token) {
	//			api
	//				.get<UserProfile>('/me')
	//				.then((result) => setUser(result.data))
	//				.catch(() => logout())
	//		} else if (pathname !== '/' && pathname !== '/auth') {
	//			router.push('/')
	//		}
	//	}, [])

	async function refreshUser() {
		const user = await api.get("/me")
		setUser(user.data)
	}

	function logout() {
		router.push('/')
		localStorage.removeItem('pong.token')
	}

	async function login(code: string) {

		const data = await axios
			.get(`http://localhost:3000/api/auth/login/callback?code=${code}`)
			.then(result => result.data)
			.catch(() => { throw "Network error" })

		localStorage.setItem('pong.token', data.access_token)
		const login = await api.get(`/me`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
			},
		})
			.then(result => result.data)
			.catch(() => { throw "Network error" })

		setUser(login)
	}

	const value: AuthContextExports = {
		login,
		logout,
		refreshUser,
		user,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
