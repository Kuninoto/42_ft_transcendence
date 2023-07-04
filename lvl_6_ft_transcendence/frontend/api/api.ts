import axios from 'axios'

export const api = axios.create({
	baseURL: 'http://localhost:3000/api',
	headers: {
		Authorization: `Bearer ${localStorage.getItem('pong.token')}`,
		'Content-Type': 'application/json',
	},
})
