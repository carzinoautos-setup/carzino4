# Carzino Autos - React Vehicle Management System

A modern, full-stack React application for automotive dealerships with integrated payment calculations, vehicle filtering, and WooCommerce connectivity.

![Vehicle Management System](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
![Express](https://img.shields.io/badge/Express-5.1.0-green)
![License](https://img.shields.io/badge/License-Private-red)

## 🚀 **Live Demo**

- **Vehicle Listings**: [MySQL Vehicles](https://a473d2afc0654d82ad63098ff3a2e48a-8fa8a87b3bd643ada0be05f0e.fly.dev/mysql-vehicles)
- **Payment Calculator**: [Payment Demo](https://a473d2afc0654d82ad63098ff3a2e48a-8fa8a87b3bd643ada0be05f0e.fly.dev/payment-demo)
- **Icon Customization**: [Icon Demo](https://a473d2afc0654d82ad63098ff3a2e48a-8fa8a87b3bd643ada0be05f0e.fly.dev/icon-demo)
- **WooCommerce Integration**: [WooCommerce Vehicles](https://a473d2afc0654d82ad63098ff3a2e48a-8fa8a87b3bd643ada0be05f0e.fly.dev/woocommerce-vehicles)

## 📋 **Table of Contents**

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Payment Calculator System](#payment-calculator-system)
- [WooCommerce Integration](#woocommerce-integration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Migration Guides](#migration-guides)

## ✨ **Features**

### 🚗 **Vehicle Management**

- **50k+ Vehicle Database** with MySQL backend
- **Advanced Filtering** by make, model, year, price, condition
- **Real-time Search** with debounced queries
- **Responsive Design** for mobile and desktop
- **Favorites System** with local storage persistence
- **Pagination** with configurable page sizes

### 💰 **Payment Calculator**

- **Real-time Payment Calculations** with loan amortization
- **Dynamic Filtering** by payment affordability
- **Customizable Parameters** (APR, term, down payment, trade-in)
- **Bulk Calculations** for vehicle listings
- **Server-side Caching** for performance optimization
- **Mobile-optimized Interface**

### 🔧 **Customization**

- **Custom Icon Upload** for vehicle specifications
- **Drag-and-drop Interface** for icon management
- **Theme Customization** via TailwindCSS
- **Component Library** with 50+ pre-built UI components

### 🛒 **WooCommerce Integration**

- **WordPress REST API** connectivity
- **ACF Field Mapping** for vehicle data
- **Global Settings** management
- **Product Synchronization** with custom meta fields
- **PHP-to-React Migration** tools

## 🛠 **Tech Stack**

### **Frontend**

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS 3** for styling
- **Radix UI** for accessible components
- **React Router 6** for SPA routing
- **React Query** for data fetching and caching
- **Lucide React** for icons

### **Backend**

- **Express.js** with TypeScript
- **MySQL 2** for database connectivity
- **Zod** for data validation
- **CORS** for cross-origin requests
- **Hot Reload** for development

### **Development Tools**

- **PNPM** package manager
- **Vitest** for testing
- **Prettier** for code formatting
- **ESLint** for code quality

## 📁 **Project Structure**

```
├── client/                     # React SPA frontend
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI component library (50+ components)
│   │   ├── VehicleCard.tsx   # Vehicle display component
│   │   ├── FilterSection.tsx # Filter UI component
│   │   └── IconUploader.tsx  # Custom icon upload component
│   ├── hooks/                # Custom React hooks
│   │   ├── usePaymentFilters.ts  # Payment calculation hook
│   │   └── use-toast.ts      # Toast notification hook
│   ├── lib/                  # Utility libraries
│   │   ├── paymentCalculator.ts  # Payment calculation utilities
│   │   ├── wordpressApi.ts   # WordPress/WooCommerce API client
│   │   ├── vehicleApi.ts     # Vehicle data API client
│   │   └── utils.ts          # Common utilities
│   ├── pages/                # Route components
│   │   ├── Index.tsx         # Home page
│   │   ├── MySQLVehiclesOriginalStyle.tsx  # Main vehicle listing
│   │   ├── PaymentCalculatorDemo.tsx       # Payment calculator demo
│   │   ├── WooCommerceVehicles.tsx        # WooCommerce integration
│   │   └── IconDemo.tsx      # Icon customization demo
│   ├── App.tsx               # App entry point with routing
│   └── global.css            # TailwindCSS configuration and themes
├── server/                   # Express API backend
│   ├── routes/               # API route handlers
│   │   ├── vehicles.ts       # Vehicle CRUD operations
│   │   ├── payments.ts       # Payment calculation APIs
│   │   └── demo.ts           # Demo endpoints
│   ├── services/             # Business logic services
│   │   ├── vehicleService.ts # Vehicle data service
│   │   └── mockVehicleService.ts  # Mock data service
│   ├── types/                # TypeScript type definitions
│   │   ├── vehicle.ts        # Vehicle data types
│   │   └── simpleVehicle.ts  # Simplified vehicle types
│   ├── db/                   # Database configuration
│   │   └── connection.ts     # MySQL connection setup
│   └── index.ts              # Express server setup
├── shared/                   # Shared types between client/server
│   └── api.ts                # Common API interfaces
├── docs/                     # Documentation files
├── netlify/                  # Netlify deployment configuration
└── public/                   # Static assets
```

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- PNPM 8+
- MySQL 8.0+

### **Installation**

```bash
# Clone the repository
git clone https://github.com/carzinoautos-setup/builder-NEW.git
cd builder-NEW

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
pnpm dev
```

### **Environment Variables**

Create a `.env.local` file:

```bash
# WordPress/WooCommerce Integration
VITE_WP_URL=https://your-wordpress-site.com

# Database Configuration (for MySQL features)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
```

### **Database Setup**

```bash
# Run the sample data generator (optional)
# This creates 50,000 sample vehicle records
pnpm tsx server/scripts/generateSampleData.ts
```

## 💰 **Payment Calculator System**

### **Features**

- **Real-time Calculations** using standard loan amortization formulas
- **Parameter Customization**: APR, loan term, down payment, trade-in value
- **Payment Range Filtering** to find vehicles within budget
- **Bulk Calculations** for entire vehicle listings
- **Server-side Caching** with 5-minute TTL for performance

### **API Endpoints**

```typescript
POST / api / payments / calculate; // Single payment calculation
POST / api / payments / bulk; // Bulk vehicle calculations
POST / api / payments / affordable - price; // Find affordable price range
GET / api / payments / cache - stats; // Performance monitoring
DELETE / api / payments / cache; // Cache management
```

### **Usage Example**

```typescript
import { usePaymentFilters } from "./hooks/usePaymentFilters";

const {
  paymentState,
  updatePaymentState,
  calculateVehiclePayment,
  affordablePriceRange,
} = usePaymentFilters({
  initialState: {
    paymentMin: "300",
    paymentMax: "600",
    interestRate: "4.9",
    loanTermMonths: "60",
    downPayment: "3000",
  },
});
```

## 🛒 **WooCommerce Integration**

### **Overview**

Complete integration with WordPress/WooCommerce for vehicle data management.

### **Setup**

1. Add the WordPress API bridge to your site
2. Configure ACF fields for vehicle data
3. Set up REST API endpoints
4. Connect React app to WordPress

### **Supported Features**

- **Product Synchronization** with custom meta fields
- **Real-time Data Fetching** via WordPress REST API
- **Global Settings** management through ACF options
- **Search and Filtering** across WooCommerce products
- **Payment Integration** with WordPress data

See [WooCommerce Integration Guide](./WORDPRESS-INTEGRATION-SETUP.md) for detailed setup instructions.

## 📊 **API Documentation**

### **Vehicle Endpoints**

```typescript
GET    /api/vehicles                    // Get vehicles with filters and pagination
GET    /api/vehicles/:id                // Get single vehicle by ID
GET    /api/vehicles/filters            // Get available filter options
GET    /api/health                      // Database health check
```

### **Payment Endpoints**

```typescript
POST / api / payments / calculate; // Calculate monthly payment
POST / api / payments / bulk; // Bulk payment calculations
POST / api / payments / affordable - price; // Find affordable price range
GET / api / payments / cache - stats; // Cache performance stats
DELETE / api / payments / cache; // Clear payment cache
```

### **WordPress Endpoints**

```typescript
GET    /wp-json/carzino/v1/vehicles           // WooCommerce vehicles
GET    /wp-json/carzino/v1/vehicles/:id       // Single WooCommerce vehicle
GET    /wp-json/carzino/v1/settings           // Global ACF settings
POST   /wp-json/carzino/v1/vehicles/affordable // Payment-based vehicle search
```

## 🚀 **Deployment**

### **Development**

```bash
pnpm dev        # Start development server
pnpm test       # Run tests
pnpm typecheck  # TypeScript validation
```

### **Production Build**

```bash
pnpm build      # Build client and server
pnpm start      # Start production server
```

### **Deployment Options**

- **Netlify**: Automated deployment with `netlify.toml`
- **Vercel**: Full-stack deployment support
- **Docker**: Containerized deployment
- **Traditional Hosting**: Static build + Node.js server

## 🔄 **Migration Guides**

### **From PHP to React**

- [WordPress Integration Setup](./WORDPRESS-INTEGRATION-SETUP.md)
- [Environment Variables Setup](./ENVIRONMENT-SETUP.md)
- [Payment Calculator Migration](./docs/payment-migration.md)

### **Data Migration**

- [WooCommerce Field Mapping](./woocommerce-mapping-template.csv)
- [Database Schema Migration](./docs/database-migration.md)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Use TypeScript for all new code
- Follow the existing code style (Prettier enforced)
- Add tests for new features
- Update documentation for API changes
- Use semantic commit messages

## 📝 **Changelog**

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes and version history.

## 📄 **License**

Private repository - All rights reserved.

## 🆘 **Support**

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Development**: See [Contributing Guidelines](#contributing)

## 🏗 **Roadmap**

- [ ] Advanced vehicle comparison features
- [ ] Financing calculator with multiple lenders
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-location inventory management
- [ ] Customer CRM integration

---

**Built with ❤️ for the automotive industry**
