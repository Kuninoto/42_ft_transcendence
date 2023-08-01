/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		domains: ['localhost', 'cdn.intra.42.fr'],
	},
}

module.exports = nextConfig
