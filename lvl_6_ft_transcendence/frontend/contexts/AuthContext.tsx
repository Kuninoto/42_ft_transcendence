import { api } from '@/api/api'
import { createContext, ReactNode, useContext, useState } from 'react'

interface IUser {
	name?: string
}

type authContextType = {
	login: (code: string) => Promise<boolean> | void
	user: IUser
}

const authContextDefaultValues: authContextType = {
	login: function (code: string) {},
	user: {},
}

const AuthContext = createContext<authContextType>(authContextDefaultValues)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<
		| {
				name: string
		  }
		| {}
	>({})

	async function login(code: string) {
		return await api
			.get(`/auth/${code}`)
			.then((result) => {
				console.log(result.data)
				setUser(result.data)
				return true
			})
			.catch((err) => {
				console.error(err)
				return false
			})
	}

	const value: authContextType = {
		login,
		user,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	return useContext(AuthContext)
}
