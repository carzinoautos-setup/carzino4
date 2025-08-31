# WordPress/WooCommerce Integration Setup

## 🎯 **COMPLETE PHP REPLACEMENT**

This React system **COMPLETELY REPLACES** your existing PHP calculator system:

- ❌ **Remove WPCode JavaScript** (footer calculator)
- ❌ **Remove WPCode PHP Shortcode** (`[carzino_product_monthly_payment_dynamic]`)
- ❌ **Remove Elementor HTML structure** (car-payment-calc)
- ❌ **Remove cookie management PHP code**
- ✅ **Use React components** for everything

## 🔧 **Setup Steps**

### 1. **Add WordPress API Bridge**

Add the code from `wordpress-react-bridge-api.php` to your WordPress site:

- Option A: Add to `functions.php` in your theme
- Option B: Create it as a custom plugin
- Option C: Use Code Snippets plugin

### 2. **Configure Environment Variables**

Create a `.env` file in your React project root:

```bash
# Your WordPress site URL (Vite requires VITE_ prefix)
VITE_WP_URL=https://your-wordpress-site.com

# For development
# VITE_WP_URL=http://localhost/your-wp-site
```

### 3. **Update Your Meta Keys**

In `client/lib/wordpressApi.ts`, update the field mappings to match your actual WooCommerce meta keys:

```typescript
// Update these to match your meta keys:
'price' => get_field('your_price_field', $vehicle->ID),
'make' => get_field('your_make_field', $vehicle->ID),
'model' => get_field('your_model_field', $vehicle->ID),
// etc...
```

### 4. **Test the Integration**

1. Visit `/woocommerce-vehicles` in your React app
2. Verify vehicles load from WordPress
3. Test payment calculations
4. Test filtering and search

## 📋 **What You Can Remove from WordPress**

### **❌ WPCode JavaScript (Delete This)**

```javascript
// DELETE: The entire WPCode footer JavaScript
(function () {
  if (window.__carzino_calc_loaded) return;
  // ... entire calculator code
})();
```

### **❌ WPCode PHP Shortcode (Delete This)**

```php
// DELETE: The entire PHP shortcode
add_shortcode('carzino_product_monthly_payment_dynamic', function($atts = []){
  // ... entire shortcode function
});
```

### **❌ Elementor HTML Structure (Replace This)**

Replace your Elementor calculator with a simple React component embed or redirect users to your React app.

## 🔄 **Migration Path**

### **Phase 1: Side-by-Side**

- Keep existing WordPress pages
- Add React app at `/woocommerce-vehicles`
- Test and verify functionality

### **Phase 2: Gradual Replacement**

- Update WordPress pages to redirect to React
- Remove old calculator code gradually
- Monitor for any issues

### **Phase 3: Complete Migration**

- All vehicle pages use React
- Remove all old PHP calculator code
- Clean up WordPress database

## 🔌 **API Endpoints Created**

Your WordPress site will have these new endpoints:

```
GET  /wp-json/carzino/v1/vehicles           - Get vehicles with filters
GET  /wp-json/carzino/v1/vehicles/{id}      - Get single vehicle
GET  /wp-json/carzino/v1/settings           - Get global settings
POST /wp-json/carzino/v1/vehicles/affordable - Payment-based search
```

## 🧪 **Testing Checklist**

- [ ] WordPress API returns vehicle data
- [ ] Global settings (ACF options) load correctly
- [ ] Payment calculations match your existing formula
- [ ] Filters work with WooCommerce data
- [ ] Pagination functions properly
- [ ] Mobile responsiveness works
- [ ] Performance is acceptable

## 🚨 **Troubleshooting**

### **WordPress API Not Working**

1. Check WordPress REST API is enabled
2. Verify permalinks are set to "Post name" or similar
3. Check for CORS issues if React and WordPress are on different domains

### **Vehicle Data Not Loading**

1. Verify your post type is 'product' or update the code
2. Check ACF field names match your configuration
3. Ensure products are published and have price data

### **Payment Calculations Wrong**

1. Compare with your existing PHP formula
2. Check global settings (ACF options) are loading
3. Verify the amortization math matches your implementation

### **Performance Issues**

1. Enable WordPress caching
2. Optimize database queries
3. Consider adding Redis for API caching

## 🎉 **Benefits of Migration**

- ✅ **No more PHP calculator maintenance**
- ✅ **Real-time payment updates**
- ✅ **Better user experience**
- ✅ **Mobile-optimized interface**
- ✅ **Easier to customize and extend**
- ✅ **Modern React development workflow**
- ✅ **Centralized payment logic**
- ✅ **Better performance with caching**

## 📞 **Support**

If you need help with the migration:

1. Test the `/payment-demo` page first to understand the system
2. Review the WordPress API responses in browser dev tools
3. Compare payment calculations with your existing system
4. Check console for any JavaScript errors

The React system is designed to be a **drop-in replacement** for your existing PHP calculator while providing a much better user experience!
