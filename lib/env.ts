// Environment variables configuration for Next.js

export const env = {
  // Builder.io
  BUILDER_PUBLIC_KEY: process.env.BUILDER_PUBLIC_KEY || process.env.NEXT_PUBLIC_BUILDER_API_KEY,
  
  // WordPress/WooCommerce API
  WP_BASE_URL: process.env.VITE_WP_URL || process.env.NEXT_PUBLIC_WP_URL || 'https://env-uploadbackup62225-czdev.kinsta.cloud',
  
  // API endpoints
  VEHICLES_ENDPOINT: '/wp-json/custom/v1/vehicles',
  FILTERS_ENDPOINT: '/wp-json/custom/v1/filters',
  
  // Runtime environment
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const

// Validate required environment variables
if (!env.BUILDER_PUBLIC_KEY) {
  console.warn('Warning: BUILDER_PUBLIC_KEY is not set. Builder.io features may not work.')
}

if (!env.WP_BASE_URL) {
  console.warn('Warning: WP_BASE_URL is not set. Vehicle API may not work.')
}

export default env
