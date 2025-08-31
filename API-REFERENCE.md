# API Reference

Complete API documentation for the Carzino Autos Vehicle Management System.

## 📋 **Table of Contents**

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Vehicle Endpoints](#vehicle-endpoints)
- [Payment Endpoints](#payment-endpoints)
- [WordPress Endpoints](#wordpress-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🌐 **Base URLs**

### **Development**

```
Local: http://localhost:8080/api
```

### **Production**

```
API: https://your-domain.com/api
WordPress: https://your-wordpress-site.com/wp-json/carzino/v1
```

## 🔐 **Authentication**

Currently, the API uses basic CORS protection. Future versions will include:

- JWT token authentication
- Rate limiting per user
- API key management

## 🚗 **Vehicle Endpoints**

### **GET /api/vehicles**

Get vehicles with filtering and pagination.

**Query Parameters:**

```typescript
interface VehicleFilters {
  page?: number; // Default: 1
  pageSize?: number; // Default: 20, Max: 100
  make?: string; // Filter by manufacturer
  model?: string; // Filter by model
  year?: number; // Filter by year
  minPrice?: number; // Minimum price filter
  maxPrice?: number; // Maximum price filter
  condition?: string; // "New" | "Used" | "Certified"
  maxMileage?: number; // Maximum mileage filter
  fuelType?: string; // Fuel type filter
  transmission?: string; // Transmission type
  drivetrain?: string; // Drivetrain type
  bodyStyle?: string; // Body style filter
  certified?: boolean; // Certified pre-owned filter
  sellerType?: string; // "Dealer" | "Private Seller"
  sortBy?: string; // "price" | "year" | "mileage" | "make"
  sortOrder?: string; // "ASC" | "DESC"
}
```

**Example Request:**

```bash
GET /api/vehicles?make=Honda&maxPrice=30000&page=1&pageSize=20
```

**Response:**

```typescript
interface VehiclesResponse {
  data: Vehicle[];
  meta: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  success: boolean;
  message?: string;
}
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 1,
      "year": 2023,
      "make": "Honda",
      "model": "Civic",
      "trim": "EX",
      "price": 28500,
      "mileage": 15000,
      "transmission": "CVT",
      "drivetrain": "FWD",
      "condition": "Used",
      "certified": true,
      "seller_type": "Dealer"
    }
  ],
  "meta": {
    "totalRecords": 250,
    "totalPages": 13,
    "currentPage": 1,
    "pageSize": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "success": true
}
```

### **GET /api/vehicles/:id**

Get a single vehicle by ID.

**Parameters:**

- `id` (number): Vehicle ID

**Response:**

```typescript
interface SingleVehicleResponse {
  data: Vehicle;
  success: boolean;
  message?: string;
}
```

**Example:**

```bash
GET /api/vehicles/123
```

### **GET /api/vehicles/filters**

Get available filter options for the frontend.

**Response:**

```typescript
interface FilterOptionsResponse {
  data: {
    makes: string[];
    models: string[];
    years: number[];
    bodyStyles: string[];
    fuelTypes: string[];
    transmissions: string[];
    drivetrains: string[];
    conditions: string[];
    priceRange: { min: number; max: number };
    mileageRange: { min: number; max: number };
  };
  success: boolean;
}
```

## 💰 **Payment Endpoints**

### **POST /api/payments/calculate**

Calculate monthly payment for a single vehicle.

**Request Body:**

```typescript
interface PaymentCalculationRequest {
  salePrice: number; // Vehicle sale price
  downPayment: number; // Down payment amount
  interestRate: number; // Annual percentage rate (0-50)
  loanTermMonths: number; // Loan term in months (12-120)
}
```

**Example Request:**

```json
{
  "salePrice": 28500,
  "downPayment": 3000,
  "interestRate": 4.9,
  "loanTermMonths": 60
}
```

**Response:**

```typescript
interface PaymentCalculationResponse {
  success: boolean;
  data: {
    monthlyPayment: number;
    totalLoanAmount: number;
    totalInterest: number;
    totalPayments: number;
    principal: number;
  };
  cached: boolean;
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "monthlyPayment": 478.32,
    "totalLoanAmount": 25500,
    "totalInterest": 3199.2,
    "totalPayments": 28699.2,
    "principal": 25500
  },
  "cached": false
}
```

### **POST /api/payments/bulk**

Calculate payments for multiple vehicles at once.

**Request Body:**

```typescript
interface BulkPaymentRequest {
  vehicles: Array<{
    id: number;
    salePrice: number;
  }>;
  downPayment: number;
  interestRate: number;
  loanTermMonths: number;
}
```

**Response:**

```typescript
interface BulkPaymentResponse {
  success: boolean;
  data: Array<{
    vehicleId: number;
    salePrice: number;
    monthlyPayment: number;
    totalLoanAmount: number;
    totalInterest: number;
    totalPayments: number;
    principal: number;
    cached: boolean;
  }>;
  totalCalculations: number;
  cacheHits: number;
}
```

### **POST /api/payments/affordable-price**

Calculate the maximum affordable vehicle price based on desired monthly payment.

**Request Body:**

```typescript
interface AffordablePriceRequest {
  desiredPayment: number; // Target monthly payment
  downPayment: number; // Available down payment
  interestRate: number; // Annual percentage rate
  loanTermMonths: number; // Desired loan term
}
```

**Response:**

```typescript
interface AffordablePriceResponse {
  success: boolean;
  data: {
    affordablePrice: number;
    desiredPayment: number;
    downPayment: number;
    interestRate: number;
    loanTermMonths: number;
  };
}
```

### **GET /api/payments/cache-stats**

Get payment calculation cache statistics for performance monitoring.

**Response:**

```typescript
interface CacheStatsResponse {
  success: boolean;
  data: {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheTTL: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}
```

### **DELETE /api/payments/cache**

Clear the payment calculation cache.

**Response:**

```typescript
interface ClearCacheResponse {
  success: boolean;
  message: string;
}
```

## 🛒 **WordPress Endpoints**

### **GET /wp-json/carzino/v1/vehicles**

Get vehicles from WooCommerce products.

**Query Parameters:**

```typescript
interface WordPressFilters {
  page?: number;
  per_page?: number;
  filters?: {
    make?: string;
    max_price?: number;
    condition?: string;
  };
}
```

**Response:**

```typescript
interface WordPressVehiclesResponse {
  success: boolean;
  data: Array<{
    id: number;
    title: string;
    price: number;
    make: string;
    model: string;
    year: number;
    // ... other WooCommerce fields
  }>;
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
```

### **GET /wp-json/carzino/v1/vehicles/:id**

Get single vehicle from WooCommerce.

### **GET /wp-json/carzino/v1/settings**

Get global settings from ACF options.

**Response:**

```typescript
interface WordPressSettingsResponse {
  success: boolean;
  data: {
    default_apr: number;
    default_sales_tax: number;
    default_term: number;
    default_down_pct: number;
  };
}
```

### **POST /wp-json/carzino/v1/vehicles/affordable**

Get vehicles within payment affordability range.

## ❌ **Error Handling**

### **Standard Error Response**

```typescript
interface ErrorResponse {
  success: false;
  error: string | string[];
  code?: string;
  details?: any;
}
```

### **Common HTTP Status Codes**

| Code | Description      | Example                                 |
| ---- | ---------------- | --------------------------------------- |
| 200  | Success          | Request completed successfully          |
| 400  | Bad Request      | Invalid parameters or malformed request |
| 404  | Not Found        | Vehicle or endpoint not found           |
| 422  | Validation Error | Input validation failed                 |
| 429  | Rate Limited     | Too many requests                       |
| 500  | Server Error     | Internal server error                   |

### **Error Examples**

**400 Bad Request:**

```json
{
  "success": false,
  "error": "Sale price must be greater than 0",
  "code": "INVALID_SALE_PRICE"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": "Vehicle not found",
  "code": "VEHICLE_NOT_FOUND"
}
```

**422 Validation Error:**

```json
{
  "success": false,
  "error": [
    "Interest rate must be between 0% and 50%",
    "Loan term must be between 1 and 120 months"
  ],
  "code": "VALIDATION_ERROR"
}
```

## 🔄 **Rate Limiting**

Currently not implemented, but planned for future releases:

- **100 requests per minute** per IP address
- **1000 requests per hour** per IP address
- **Bulk endpoints**: 10 requests per minute
- **Payment calculations**: 50 per minute

## 📝 **Examples**

### **JavaScript/TypeScript Examples**

**Fetch Vehicles:**

```typescript
async function getVehicles(filters: VehicleFilters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([_, value]) => value != null),
  );

  const response = await fetch(`/api/vehicles?${params}`);
  const data: VehiclesResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error as string);
  }

  return data;
}
```

**Calculate Payment:**

```typescript
async function calculatePayment(params: PaymentCalculationRequest) {
  const response = await fetch("/api/payments/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data: PaymentCalculationResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error as string);
  }

  return data.data;
}
```

**Bulk Payment Calculation:**

```typescript
async function calculateBulkPayments(
  vehicles: Array<{ id: number; salePrice: number }>,
  paymentParams: Omit<PaymentCalculationRequest, "salePrice">,
) {
  const response = await fetch("/api/payments/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicles,
      ...paymentParams,
    }),
  });

  return response.json();
}
```

### **cURL Examples**

**Get Vehicles:**

```bash
curl -X GET "http://localhost:8080/api/vehicles?make=Honda&maxPrice=30000" \
  -H "Accept: application/json"
```

**Calculate Payment:**

```bash
curl -X POST "http://localhost:8080/api/payments/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "salePrice": 28500,
    "downPayment": 3000,
    "interestRate": 4.9,
    "loanTermMonths": 60
  }'
```

**WordPress Integration:**

```bash
curl -X GET "https://your-wordpress-site.com/wp-json/carzino/v1/vehicles" \
  -H "Accept: application/json"
```

## 🔧 **Development Tools**

### **API Testing Script**

```bash
# Test all endpoints
pnpm tsx server/scripts/testApi.ts
```

### **Cache Management**

```bash
# Clear payment cache
curl -X DELETE "http://localhost:8080/api/payments/cache"

# Check cache stats
curl -X GET "http://localhost:8080/api/payments/cache-stats"
```

## 📊 **Performance Considerations**

### **Caching Strategy**

- **Payment calculations**: 5-minute TTL
- **Vehicle data**: No caching (real-time updates)
- **Filter options**: 1-hour TTL
- **WordPress data**: 5-minute TTL

### **Optimization Tips**

- Use bulk endpoints for multiple calculations
- Implement client-side caching for repeated requests
- Use pagination for large datasets
- Consider database indexing for custom filters

---

**Last Updated**: 2024-01-XX  
**API Version**: 2.0.0  
**Compatibility**: Node.js 18+, MySQL 8.0+
