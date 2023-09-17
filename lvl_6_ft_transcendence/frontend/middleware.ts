import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
	const token = request.cookies.get('pong.token')

	if (!token) {
		return NextResponse.rewrite(new URL('/', request.url))
	}
}

export const config = {
	matcher: [
		'/dashboard',
		'/matchmaking',
		'/profile',
		'/themes',
		'/leaderboard',
	],
}
