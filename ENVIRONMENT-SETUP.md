# Environment Variables Setup

## 🔧 **Fix for "process is not defined" Error**

The error occurred because this project uses **Vite** (not Create React App), which handles environment variables differently.

## ✅ **Fixed Issues:**

1. ✅ Updated `client/lib/wordpressApi.ts` to use `import.meta.env.VITE_WP_URL`
2. ✅ Updated `client/lib/performance.ts` to use `import.meta.env.DEV`
3. ✅ Updated `client/components/ErrorBoundary.tsx` to use `import.meta.env.DEV`

## 🔑 **Environment Variables Setup**

Create a `.env.local` file in your project root:

```bash
# WordPress/WooCommerce Connection for Vite
# Replace with your actual WordPress site URL
VITE_WP_URL=https://your-wordpress-site.com

# Example URLs:
# VITE_WP_URL=https://carzinoautos.com
# VITE_WP_URL=http://localhost/your-wp-site
# VITE_WP_URL=https://staging.carzinoautos.com
```

## 🔄 **Key Differences: Vite vs Create React App**

| Feature            | Create React App                         | Vite                     |
| ------------------ | ---------------------------------------- | ------------------------ |
| Environment access | `process.env.REACT_APP_*`                | `import.meta.env.VITE_*` |
| Development check  | `process.env.NODE_ENV === 'development'` | `import.meta.env.DEV`    |
| Variable prefix    | `REACT_APP_`                             | `VITE_`                  |

## 🚨 **Important Notes:**

- **Vite requires `VITE_` prefix** for environment variables to be exposed to the client
- **Restart your dev server** after creating/updating the `.env.local` file
- **Variables are only available after build** - they're replaced at build time, not runtime

## 🧪 **Test the Fix:**

1. Create `.env.local` with your WordPress URL
2. Restart your dev server (`pnpm dev`)
3. Visit `/woocommerce-vehicles` to test the WordPress connection
4. Check browser console for any remaining errors

## 📋 **Example .env.local File:**

```bash
# Copy this to your .env.local file and update the URL
VITE_WP_URL=https://carzinoautos.com
```

The error should now be resolved! 🎉
