import axios from 'axios'

export const api = axios.create({
	baseURL: `http://localhost:3000/api`,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const multipartApi = axios.create({
	baseURL: `http://localhost:3000/api`,
	headers: {
		'Content-Type': 'multipart/form-data',
	},
})

multipartApi.interceptors.request.use((req) => {
	const token = localStorage.getItem('pong.token')
	if (token) req.headers['Authorization'] = `Bearer ${token}`
	return req
})

api.interceptors.request.use((req) => {
	const token = localStorage.getItem('pong.token')
	if (token) req.headers['Authorization'] = `Bearer ${token}`
	return req
})
