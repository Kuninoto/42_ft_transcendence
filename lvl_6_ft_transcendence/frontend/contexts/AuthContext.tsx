import { api } from '@/api/api'
import { ImageLoader } from 'next/image'
import { UserProfile } from '@/common/type/backend/user-profile.interface'
import axios from 'axios'
import { useRouter, usePathname } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

export const removeParams: ImageLoader = ({ src } : { src: string }) => {
	return src.replace(/&?w=\d+&?/, '').replace(/&?p=\d+&?/, '');
};

export interface AuthContextExports {
	login: (code: string) => Promise<boolean> | void
	logout: () => void
	user: UserProfile | {}
	refreshUser: (user: UserProfile) => void
}

const AuthContext = createContext<AuthContextExports>({} as AuthContextExports)

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [user, setUser] = useState<{} | UserProfile>({})

	useEffect(() => {

		const token = localStorage.getItem('pong.token')

		if (token && pathname === "/" )
			router.push("/dashboard")

		if (token) {
			api.get<UserProfile>('/me')
				.then((result: axios) => setUser(result.data))
				.catch(() => logout())
		} else if (pathname !== "/" && pathname !== "/auth") {
			router.push('/')
		}
	}, [])

	function refreshUser(newUserInfo: UserProfile){
		setUser(newUserInfo)
	}

	function logout() {
		router.push('/')
		localStorage.removeItem('pong.token')
	}

	async function login(code: string) {
		return await axios
			.get(`http://localhost:3000/api/auth/login/callback?code=${code}`)
			.then(async function (result) {
				localStorage.setItem('pong.token', result.data.access_token)
				return await api.get(`/me`, {
						headers: {
							Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
						},
					})
					.then(function (newUser) {
						setUser(newUser.data)
						return true
					})
					.catch((error) => {
						console.error(error)
						return false
					})
			})
			.catch((err) => {
				console.error(err)
				return false
			})
	}

	const value: AuthContextExports = {
		login,
		logout,
		user,
		refreshUser
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
