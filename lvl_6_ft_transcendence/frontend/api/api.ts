import axios from 'axios'
import Cookies from 'js-cookie'

export const api = axios.create({
	baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const multipartApi = axios.create({
	baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
	headers: {
		'Content-Type': 'multipart/form-data',
	},
})

multipartApi.interceptors.request.use((req) => {
	const token = Cookies.get('pong.token')
	if (token) req.headers['Authorization'] = `Bearer ${token}`
	return req
})

api.interceptors.request.use((req) => {
	const token = Cookies.get('pong.token')
	if (token) req.headers['Authorization'] = `Bearer ${token}`
	return req
})
