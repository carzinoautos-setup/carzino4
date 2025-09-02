# 🚀 Deployment Guide: Next.js + Builder.io to Vercel

Complete guide to deploy your Carzino Autos vehicle inventory app to Vercel.

## 📋 Pre-Deployment Checklist

### ✅ Requirements Met
- [x] Next.js app structure created
- [x] Builder.io SDK integrated
- [x] WooCommerce API integration working
- [x] Vercel configuration ready
- [x] Components migrated and optimized

### 🔑 Required Accounts & API Keys

1. **Vercel Account** - [Create at vercel.com](https://vercel.com)
2. **Builder.io Account** - [Create at builder.io](https://builder.io)
3. **WooCommerce API Access** - Your existing WordPress site

## 🛠 Step-by-Step Deployment

### Step 1: Get Builder.io API Key

1. **Sign up at Builder.io**
   - Go to [builder.io](https://builder.io)
   - Create a new account
   - Create a new "Site" for your project

2. **Get API Key**
   - Navigate to Account Settings
   - Copy your **Public API Key**
   - Save this for environment variables

3. **Add Your Domain**
   - In Builder.io, go to Site Settings
   - Add your Vercel domain (you'll get this after deployment)
   - Example: `https://your-app.vercel.app`

### Step 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the App**
   ```bash
   # From your project directory
   vercel --prod
   ```

4. **Follow Prompts**
   - Link to existing project or create new
   - Select framework: **Next.js**
   - Confirm settings

### Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

#### Required Variables
```bash
# Builder.io Configuration
BUILDER_PUBLIC_KEY=your_builder_io_public_key_here
NEXT_PUBLIC_BUILDER_API_KEY=your_builder_io_public_key_here

# WordPress/WooCommerce API
VITE_WP_URL=https://env-uploadbackup62225-czdev.kinsta.cloud
NEXT_PUBLIC_WP_URL=https://env-uploadbackup62225-czdev.kinsta.cloud
```

#### How to Add in Vercel:
1. Go to your project dashboard in Vercel
2. Click **Settings** tab
3. Click **Environment Variables**
4. Add each variable with **Production** environment selected

### Step 4: Test API Integration

1. **Visit Test Page**
   ```
   https://your-app.vercel.app/test
   ```

2. **Test Each API**
   - Click "Test /api/vehicles" - should return vehicle data
   - Click "Test /api/filters" - should return filter options
   - Click "Test Direct API" - should connect to WooCommerce

3. **Verify Results**
   - All tests should return JSON data
   - No CORS errors
   - Vehicle data matches WooCommerce

### Step 5: Configure Builder.io Content

1. **Access Builder.io Editor**
   ```
   https://builder.io/content
   ```

2. **Create Your First Page**
   - Click "Create New"
   - Select "Page"
   - Choose your site
   - Use URL: `/` for homepage

3. **Add Vehicle Components**
   - Drag custom components:
     - `VehicleSearch`
     - `VehiclesGrid` 
     - `FilterSection`
     - `VehicleCard`

4. **Publish Changes**
   - Click "Publish" in Builder.io
   - Changes reflect instantly on your Vercel site

## 🎯 Testing iframe Integration

### For WordPress/Kinsta Integration

Once deployed, you can embed in WordPress:

```html
<iframe 
  src="https://your-app.vercel.app/vehicles" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border:none;">
</iframe>
```

### Test URLs

- **Homepage**: `https://your-app.vercel.app/`
- **Vehicles Page**: `https://your-app.vercel.app/vehicles`
- **API Test**: `https://your-app.vercel.app/test`

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Builder.io Not Loading
**Error**: Components not rendering
**Solution**: 
- Check `BUILDER_PUBLIC_KEY` is set correctly
- Verify domain is added in Builder.io settings
- Ensure public key matches your Builder.io account

#### 2. Vehicle Data Not Loading  
**Error**: Empty vehicle listings
**Solution**:
- Check `VITE_WP_URL` environment variable
- Test direct WooCommerce API: `/wp-json/custom/v1/vehicles`
- Verify CORS settings on WordPress

#### 3. Build Errors
**Error**: Deployment fails
**Solution**:
```bash
# Check locally first
npm run build
npm run type-check

# Common fixes:
npm install @types/node
npm install clsx tailwind-merge
```

#### 4. API Route Errors
**Error**: 500 errors on `/api/vehicles`
**Solution**:
- Check Vercel function logs
- Verify environment variables in Vercel dashboard
- Test WooCommerce API directly

### Verification Checklist

✅ **Deployment Successful**
- [ ] App loads at Vercel URL
- [ ] No console errors
- [ ] Builder.io content renders

✅ **API Integration Working**
- [ ] `/api/vehicles` returns data
- [ ] `/api/filters` returns filter options
- [ ] Search and filtering work
- [ ] Pagination functions

✅ **Builder.io Integration**
- [ ] Can edit content in Builder.io
- [ ] Changes publish instantly
- [ ] Custom components available

✅ **Performance**
- [ ] Page loads under 3 seconds
- [ ] Images load correctly
- [ ] Mobile responsive

## 📊 Performance Optimization

### Recommended Next Steps

1. **CDN Configuration**
   - Images served via Vercel CDN
   - Enable gzip compression

2. **Builder.io Optimization**
   - Use Builder.io image optimization
   - Lazy load components

3. **API Caching**
   - Enable React Query caching
   - Consider Redis for production

## 🎉 Success Metrics

Once deployed successfully, you should see:

- **Page Load**: < 3 seconds initial load
- **API Response**: < 1 second for vehicle data
- **Search**: Instant filter updates
- **Mobile**: Fully responsive design

## 📞 Support

### Next Steps After Deployment

1. **Content Creation**: Build pages in Builder.io
2. **WordPress Integration**: Add iframe to WordPress
3. **SEO Optimization**: Add meta tags and sitemaps
4. **Analytics**: Set up tracking

### Contact Information

- **Technical Issues**: Check Vercel function logs
- **Builder.io Issues**: [Builder.io documentation](https://www.builder.io/c/docs)
- **API Issues**: Test WooCommerce endpoints directly

---

**🎯 Your app should now be live at: `https://your-app.vercel.app`**

Test all functionality and proceed with Builder.io content creation!
