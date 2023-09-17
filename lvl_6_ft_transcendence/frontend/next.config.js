/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ['localhost', 'cdn.intra.42.fr'],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: false,
	webpack: (config) => {
		config.externals.push({
			bufferutil: 'commonjs bufferutil',
			'utf-8-validate': 'commonjs utf-8-validate',
		})
		return config
	},
}

module.exports = nextConfig
