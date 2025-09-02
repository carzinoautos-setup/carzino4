/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILDER_PUBLIC_KEY: process.env.BUILDER_PUBLIC_KEY,
    NEXT_PUBLIC_BUILDER_API_KEY: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
    VITE_WP_URL: process.env.VITE_WP_URL,
    NEXT_PUBLIC_WP_URL: process.env.NEXT_PUBLIC_WP_URL,
  },
  images: {
    domains: [
      'cdn.builder.io',
      'images.unsplash.com',
      'env-uploadbackup62225-czdev.kinsta.cloud'
    ],
  },
  serverExternalPackages: ['@builder.io/sdk'],
}

module.exports = nextConfig
