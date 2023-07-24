import { api } from '@/api/api'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

interface IUser {
	id?: number
	avatar_url?: string
	intra_profile_url?: string
	created_at?: Date
	has_2fa?: boolean
	name?: string
	blocked_users?: []
	friends? : []
	friend_requests?: []
}

interface AuthContextType {
	login: (code: string) => Promise<boolean> | void
	logout: () => void
	user: IUser
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)
export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const [user, setUser] = useState<{} | IUser>({})

	useEffect(() => {
		const token = localStorage.getItem('pong.token')
		if (token) {
			api.get('/me')
				.then((result) => 
				{console.log(result.data)
					setUser(result.data)})
				.catch(() => logout())
		}
		else {
			router.push('/')
		}
	}, [])

	function logout() {
		router.push('/')
		localStorage.removeItem('pong.token')
	}

	async function login(code: string) {
		return await axios
			.get(`http://localhost:3000/api/auth/login/callback?code=${code}`)
			.then(async function (result) {
				localStorage.setItem('pong.token', result.data.access_token)
				return await api
					.get(`/me`, {
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

	const value: AuthContextType = {
		login,
		logout,
		user,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
