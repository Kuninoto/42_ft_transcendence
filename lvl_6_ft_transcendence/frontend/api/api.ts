import axios from 'axios'

export const api = axios.create({
	baseURL: 'http://localhost:3000/api',
	headers: {
		Authorization:
			typeof window !== 'undefined'
				? 'Bearer ' + localStorage.getItem('pong.token')
				: null,
		'Content-Type': 'application/json',
	},
})

export const multipartApi = axios.create({
	baseURL: 'http://localhost:3000/api',
	headers: {
		Authorization:
			typeof window !== 'undefined'
				? 'Bearer ' + localStorage.getItem('pong.token')
				: null,
		'Content-Type': 'multipart/form-data',
	},
})
