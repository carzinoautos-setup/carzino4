# Deployment Guide

Complete deployment instructions for the Carzino Autos Vehicle Management System.

## 📋 **Table of Contents**

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [WordPress Integration](#wordpress-integration)
- [Deployment Options](#deployment-options)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 **Prerequisites**

### **System Requirements**

- **Node.js**: 18.0 or higher
- **PNPM**: 8.0 or higher
- **MySQL**: 8.0 or higher
- **WordPress**: 6.0+ (for WooCommerce integration)
- **Memory**: 2GB RAM minimum (4GB recommended)
- **Storage**: 10GB minimum

### **Services & Accounts**

- Database hosting (MySQL/PostgreSQL)
- Domain name and SSL certificate
- WordPress hosting (if using WooCommerce integration)
- Monitoring service (optional)

## 🌍 **Environment Setup**

### **Production Environment Variables**

Create a `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
PORT=8080

# WordPress/WooCommerce Integration
VITE_WP_URL=https://your-wordpress-site.com

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=carzino_vehicles
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# Security
SESSION_SECRET=your-super-secure-session-secret
JWT_SECRET=your-jwt-secret-key

# Performance
CACHE_TTL=300000
MAX_POOL_SIZE=10

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

### **Environment Validation**

```bash
# Validate all required environment variables are set
node -e "
const required = ['VITE_WP_URL', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
} else {
  console.log('✅ All environment variables configured');
}
"
```

## 🗄 **Database Configuration**

### **Production Database Setup**

```sql
-- Create database
CREATE DATABASE carzino_vehicles
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Create user with limited privileges
CREATE USER 'carzino_user'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON carzino_vehicles.* TO 'carzino_user'@'%';
FLUSH PRIVILEGES;

-- Verify connection
SHOW DATABASES;
```

### **Sample Data Generation**

```bash
# Generate production sample data (optional)
NODE_ENV=production pnpm tsx server/scripts/generateSampleData.ts

# Or import from existing data
mysql -u carzino_user -p carzino_vehicles < vehicle_data_backup.sql
```

### **Database Optimization**

```sql
-- Add indexes for common queries
CREATE INDEX idx_make_model ON vehicles(make, model);
CREATE INDEX idx_price_range ON vehicles(price);
CREATE INDEX idx_year_condition ON vehicles(year, condition);
CREATE INDEX idx_mileage ON vehicles(mileage);

-- Analyze tables for optimization
ANALYZE TABLE vehicles;
```

## 🛒 **WordPress Integration**

### **WordPress Setup**

1. **Install API Bridge**

   ```php
   // Add to your theme's functions.php or create a plugin
   // Copy contents from wordpress-react-bridge-api.php
   ```

2. **Configure ACF Fields**

   ```bash
   # Ensure these ACF option fields exist:
   - interest_rate (number)
   - default_sales_tax (number)
   - default_term (number)
   - default_down_pct (number)
   ```

3. **Enable REST API**

   ```php
   // Ensure WordPress REST API is enabled
   add_filter('rest_enabled', '__return_true');
   add_filter('rest_jsonp_enabled', '__return_true');
   ```

4. **CORS Configuration**
   ```php
   // Add CORS headers for React app
   function add_cors_http_header(){
       header("Access-Control-Allow-Origin: https://your-react-app-domain.com");
       header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
       header("Access-Control-Allow-Headers: Content-Type");
   }
   add_action('init','add_cors_http_header');
   ```

## 🚀 **Deployment Options**

### **Option 1: Netlify Deployment**

#### **Setup**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
pnpm build
netlify deploy --prod --dir=dist
```

#### **Netlify Configuration** (`netlify.toml`)

```toml
[build]
  command = "pnpm build"
  publish = "dist/spa"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **Option 2: Vercel Deployment**

#### **Setup**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### **Vercel Configuration** (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/spa/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "dist/server/node-build.mjs",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/dist/server/node-build.mjs"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/spa/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **Option 3: Traditional VPS/Cloud Hosting**

#### **Ubuntu/Debian Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PNPM
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Install PM2 for process management
npm install -g pm2

# Clone and setup application
git clone https://github.com/your-username/carzino-autos.git
cd carzino-autos
pnpm install
```

#### **PM2 Configuration** (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: "carzino-autos",
      script: "dist/server/node-build.mjs",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

#### **Nginx Configuration**

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **Option 4: Docker Deployment**

#### **Dockerfile**

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production image
FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

CMD ["node", "dist/server/node-build.mjs"]
```

#### **Docker Compose** (`docker-compose.yml`)

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_NAME=carzino_vehicles
      - DB_USER=carzino_user
      - DB_PASSWORD=secure_password
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=carzino_vehicles
      - MYSQL_USER=carzino_user
      - MYSQL_PASSWORD=secure_password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

## ✅ **Production Checklist**

### **Pre-Deployment**

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] WordPress integration verified
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Build process tested
- [ ] Performance benchmarks established

### **Security**

- [ ] Database credentials secured
- [ ] API endpoints protected
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Dependency vulnerabilities checked

### **Performance**

- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] Static asset optimization
- [ ] CDN configured (if applicable)
- [ ] Compression enabled
- [ ] Memory usage monitored

### **Monitoring**

- [ ] Error logging configured
- [ ] Performance monitoring setup
- [ ] Uptime monitoring enabled
- [ ] Database monitoring active
- [ ] Alert notifications configured

## 📊 **Monitoring & Maintenance**

### **Health Checks**

```bash
# Application health
curl -f http://your-domain.com/api/ping || exit 1

# Database health
curl -f http://your-domain.com/api/health || exit 1

# WordPress integration
curl -f https://your-wordpress-site.com/wp-json/carzino/v1/settings || exit 1
```

### **Performance Monitoring**

```bash
# Check cache statistics
curl http://your-domain.com/api/payments/cache-stats

# Monitor memory usage
free -h

# Check database performance
mysql -e "SHOW PROCESSLIST;"
```

### **Log Management**

```bash
# PM2 logs
pm2 logs carzino-autos

# System logs
tail -f /var/log/syslog

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **Backup Strategy**

```bash
# Database backup
mysqldump -u carzino_user -p carzino_vehicles > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/carzino-autos

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u carzino_user -p$DB_PASSWORD carzino_vehicles > /backups/db_$DATE.sql
find /backups -name "*.sql" -mtime +7 -delete
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Application Won't Start**

```bash
# Check logs
pm2 logs carzino-autos --lines 50

# Check environment variables
printenv | grep -E "(NODE_ENV|DB_|VITE_)"

# Test database connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1;"
```

#### **WordPress Integration Failing**

```bash
# Test WordPress API
curl -v https://your-wordpress-site.com/wp-json/carzino/v1/settings

# Check CORS headers
curl -H "Origin: https://your-react-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-wordpress-site.com/wp-json/carzino/v1/vehicles
```

#### **Performance Issues**

```bash
# Check memory usage
ps aux | grep node

# Monitor database queries
mysql -e "SHOW FULL PROCESSLIST;"

# Check cache hit rate
curl http://your-domain.com/api/payments/cache-stats
```

#### **Database Connection Issues**

```bash
# Test connection
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p

# Check connection limits
mysql -e "SHOW VARIABLES LIKE 'max_connections';"

# Monitor active connections
mysql -e "SHOW STATUS LIKE 'Threads_connected';"
```

### **Emergency Recovery**

#### **Application Rollback**

```bash
# Rollback with PM2
pm2 stop carzino-autos
git checkout previous-stable-tag
pnpm install
pnpm build
pm2 restart carzino-autos
```

#### **Database Recovery**

```bash
# Restore from backup
mysql -u carzino_user -p carzino_vehicles < backup_20240120.sql
```

### **Support Contacts**

- **Technical Issues**: Create GitHub issue
- **WordPress Integration**: Check WordPress API documentation
- **Hosting Issues**: Contact your hosting provider
- **Emergency**: Maintain emergency contact list

## 📈 **Scaling Considerations**

### **Horizontal Scaling**

- Load balancer configuration
- Database read replicas
- CDN for static assets
- Microservices architecture

### **Performance Optimization**

- Database query optimization
- Redis caching layer
- API response compression
- Image optimization

---

**Last Updated**: 2024-01-XX  
**Deployment Version**: 2.0.0  
**Minimum Requirements**: Node.js 18+, MySQL 8.0+
