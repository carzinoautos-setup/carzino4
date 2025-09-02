/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILDER_PUBLIC_KEY: process.env.BUILDER_PUBLIC_KEY,
    VITE_WP_URL: process.env.VITE_WP_URL,
  },
  images: {
    domains: [
      'cdn.builder.io',
      'images.unsplash.com',
      'env-uploadbackup62225-czdev.kinsta.cloud'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/woocommerce/:path*',
        destination: `${process.env.VITE_WP_URL}/wp-json/custom/v1/:path*`,
      },
    ]
  },
  serverExternalPackages: ['@builder.io/sdk'],
}

module.exports = nextConfig
