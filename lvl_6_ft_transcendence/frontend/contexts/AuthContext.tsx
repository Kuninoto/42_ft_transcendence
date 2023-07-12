import { api } from '@/api/api'
import axios from 'axios'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export interface IUser {
	name: string
	avatar_url: string
	created_at: Date
	has_2fa: boolean
} 

interface AuthContextType {
	login: (code: string) => Promise<boolean> | void
	user: IUser | {}
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<IUser | {}>({})

	useEffect(() => {
		const token = localStorage.getItem('pong.token')
		if (token)
		{
			api.get("/users/me")
			.then((result) => setUser(result.data))
			.catch((error) => console.error(error) )
		}	

	}, [])

	async function login(code: string) {
		return await axios
			.get(`http://localhost:3000/api/auth/login/callback?code=${code}`)
			.then(async function(result) {

				localStorage.setItem('pong.token', result.data.access_token)
				return await api.get(`/users/me`, {
					headers: {
						"Authorization" : `Bearer ${localStorage.getItem('pong.token')}`
					}
				}).then(function(newUser) {
					setUser(newUser.data)
					return true
				})
				.catch((error) => {
					console.log(error)
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
		user,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
