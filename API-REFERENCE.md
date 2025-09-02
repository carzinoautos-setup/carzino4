# API Reference

Complete API documentation for the Carzino Autos Vehicle Management System.

## 📋 **Table of Contents**

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [WordPress Plugin Endpoints](#wordpress-plugin-endpoints)
- [Vehicle Endpoints](#vehicle-endpoints)
- [Payment Endpoints](#payment-endpoints)
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
WordPress Plugin: https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1
```

## 🔐 **Authentication**

Currently, the API uses basic CORS protection. Future versions will include:

- JWT token authentication
- Rate limiting per user
- API key management

## 🔌 **WordPress Plugin Endpoints**

### **🚀 ACTIVE PLUGIN: Vehicle Inventory API v2.0**

**Plugin Location**: `/wp-content/plugins/vehicle-inventory-api/`  
**Status**: ✅ Active and working with conditional filtering

#### **GET /wp-json/custom/v1/ping**

Health check endpoint to verify the API is active.

**Response:**
```json
{
  "success": true,
  "message": "Vehicle API is alive!"
}
```

#### **GET /wp-json/custom/v1/vehicles**

Get vehicles with filtering, sorting, and pagination.

**Query Parameters:**

```typescript
interface VehicleFilters {
  // Pagination
  page?: number; // Default: 1
  per_page?: number; // Default: 10

  // Filtering (supports comma-separated multi-values)
  make?: string; // e.g., "Toyota" or "Toyota,Ford"
  model?: string; // e.g., "Camry" or "Camry,Civic"
  trim?: string; // e.g., "LE,SE"
  year?: string; // e.g., "2023" or "2022,2023"
  body_style?: string; // e.g., "Sedan,SUV"
  drivetrain?: string; // e.g., "FWD,AWD"
  fuel_type?: string; // e.g., "Gasoline,Hybrid"
  transmission?: string; // e.g., "Automatic,Manual"
  condition?: string; // e.g., "New,Used,Certified"
  certified?: string; // "1" for certified only
  exterior_color?: string;
  interior_color?: string;
  account_name_seller?: string; // Dealer name
  business_name_seller?: string;
  city_seller?: string;
  state_seller?: string;

  // Sorting
  sort?: 'price_asc' | 'price_desc' | 'mileage_asc' | 'mileage_desc' | 'year_asc' | 'year_desc';
}
```

**Example Requests:**

```bash
# Get all vehicles (page 1, 10 per page)
GET /wp-json/custom/v1/vehicles

# Filter by Toyota only
GET /wp-json/custom/v1/vehicles?make=Toyota

# Filter by Toyota and Ford, sort by price low to high
GET /wp-json/custom/v1/vehicles?make=Toyota,Ford&sort=price_asc

# Complex filtering with pagination
GET /wp-json/custom/v1/vehicles?make=Toyota&condition=Used,Certified&year=2020,2021,2022&page=2&per_page=20
```

**Response:**

```typescript
interface VehiclesResponse {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    permalink: string;
    stock_status: string;
    featured_image: string;
    acf: {
      make: string;
      model: string;
      year: number;
      trim: string;
      mileage: number;
      condition: string;
      transmission: string;
      drivetrain: string;
      fuel_type: string;
      body_style: string;
      exterior_color: string;
      interior_color: string;
      vin: string;
      certified: boolean;
      account_name_seller: string;
      business_name_seller: string;
      city_seller: string;
      state_seller: string;
      zip_seller: string;
      price: number;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
```

#### **GET /wp-json/custom/v1/filters**

🎯 **CONDITIONAL FILTERING ENDPOINT** - Returns filter options that narrow based on applied filters.

**Key Features:**
- ✅ **Cascading Filters**: Make → Model → Trim → Year properly narrow down
- ✅ **All Fields Narrow**: body_style, drivetrain, fuel_type, transmission, condition, certified, colors, dealer, city, state all narrow based on current vehicle pool
- ✅ **Multi-Select Support**: Supports comma-separated values (e.g., `make=Toyota,Ford`)

**Query Parameters:**

All the same parameters as the vehicles endpoint. The filters endpoint will:
1. **First**: Narrow the vehicle pool based on applied filters
2. **Then**: Calculate filter counts only from that narrowed pool

**Example Requests:**

```bash
# Get all available filter options
GET /wp-json/custom/v1/filters

# Get filter options when Toyota is selected
# Result: Only Toyota models, trims, years, and related options
GET /wp-json/custom/v1/filters?make=Toyota

# Get filter options when Toyota AND Ford are selected
# Result: Only Toyota + Ford models, trims, years, and related options
GET /wp-json/custom/v1/filters?make=Toyota,Ford

# Complex conditional filtering
GET /wp-json/custom/v1/filters?make=Toyota&model=Camry&condition=Used
```

**Response:**

```typescript
interface FiltersResponse {
  success: boolean;
  filters: {
    make: Array<{ name: string; count: number }>;
    model: Array<{ name: string; count: number }>;
    trim: Array<{ name: string; count: number }>;
    year: Array<{ name: string; count: number }>;
    body_style: Array<{ name: string; count: number }>;
    drivetrain: Array<{ name: string; count: number }>;
    fuel_type: Array<{ name: string; count: number }>;
    transmission: Array<{ name: string; count: number }>;
    condition: Array<{ name: string; count: number }>;
    certified: Array<{ name: string; count: number }>;
    exterior_color: Array<{ name: string; count: number }>;
    interior_color: Array<{ name: string; count: number }>;
    account_name_seller: Array<{ name: string; count: number }>;
    business_name_seller: Array<{ name: string; count: number }>;
    city_seller: Array<{ name: string; count: number }>;
    state_seller: Array<{ name: string; count: number }>;
  };
  applied_filters: {
    [key: string]: string; // Echo back applied filters
  };
}
```

**Example Response (Toyota selected):**

```json
{
  "success": true,
  "filters": {
    "model": [
      { "name": "Camry", "count": 12 },
      { "name": "Corolla", "count": 9 },
      { "name": "RAV4", "count": 15 }
    ],
    "trim": [
      { "name": "LE", "count": 6 },
      { "name": "SE", "count": 4 },
      { "name": "XLE", "count": 8 }
    ],
    "year": [
      { "name": "2023", "count": 10 },
      { "name": "2022", "count": 15 },
      { "name": "2021", "count": 11 }
    ],
    "body_style": [
      { "name": "Sedan", "count": 21 },
      { "name": "SUV", "count": 15 }
    ]
  },
  "applied_filters": {
    "make": "Toyota"
  }
}
```

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

### **WordPress Plugin Examples**

**Test API Health:**

```bash
curl -X GET "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/ping"
```

**Get All Vehicles:**

```bash
curl -X GET "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/vehicles?page=1&per_page=10"
```

**Filter by Toyota (conditional filtering):**

```bash
curl -X GET "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/filters?make=Toyota"
```

**Complex filtering with sorting:**

```bash
curl -X GET "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/vehicles?make=Toyota,Honda&condition=Used&sort=price_asc"
```

### **JavaScript/TypeScript Examples**

**Fetch Vehicles with Conditional Filters:**

```typescript
async function getVehiclesWithFilters(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  
  // Get vehicles and filters in parallel
  const [vehiclesResponse, filtersResponse] = await Promise.all([
    fetch(`/wp-json/custom/v1/vehicles?${params}`),
    fetch(`/wp-json/custom/v1/filters?${params}`)
  ]);

  const vehicles = await vehiclesResponse.json();
  const filterOptions = await filtersResponse.json();

  return { vehicles, filterOptions };
}

// Usage
const { vehicles, filterOptions } = await getVehiclesWithFilters({
  make: 'Toyota',
  condition: 'Used'
});
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

**WordPress Integration with Conditional Filtering:**

```bash
# Test conditional filtering - Toyota only
curl -X GET "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/filters?make=Toyota" \
  -H "Accept: application/json"

# Should return only Toyota models, trims, years, and related options
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

### **WordPress Plugin Cache Rebuild**

```bash
# Rebuild filter cache (if implemented)
https://env-uploadbackup62225-czdev.kinsta.cloud/?via_build_filters=1
```

## 📊 **Performance Considerations**

### **Caching Strategy**

- **Payment calculations**: 5-minute TTL
- **Vehicle data**: No caching (real-time updates)
- **Filter options**: Cached with transients (5-minute TTL)
- **WordPress data**: 5-minute TTL

### **Optimization Tips**

- Use bulk endpoints for multiple calculations
- Implement client-side caching for repeated requests
- Use pagination for large datasets
- Consider database indexing for custom filters
- Use conditional filtering to reduce payload size

## 🚀 **Builder.io Integration Notes**

### **Endpoints to Use:**

- `/wp-json/custom/v1/vehicles` → for vehicle cards
- `/wp-json/custom/v1/filters` → for building filter menus

### **Vehicle Endpoint Params:**

- `page`, `per_page`
- Any filter field (`make`, `model`, `trim`, etc.)
- `sort` values: `price_asc`, `price_desc`, `mileage_asc`, `mileage_desc`, `year_asc`, `year_desc`

### **Filters Endpoint Behavior:**

- ✅ **Cascades correctly**: `?make=Toyota` → only Toyota models/trims/years
- ✅ **Multi-select support**: `?make=Toyota,Ford` → only Toyota + Ford models/trims/years
- ✅ **All filters narrow**: body_style, drivetrain, fuel_type, transmission, condition, certified, colors, dealer, city, state all narrow to current vehicle pool

### **Expected Behavior:**

- Selecting Toyota → only Toyota-related values in all filters
- Selecting Toyota+Ford → only Toyota + Ford-related values in all filters
- Sorting works with filters applied
- Conditional filtering works for all cascading relationships

---

**Last Updated**: 2024-01-XX  
**API Version**: 2.0.0  
**WordPress Plugin**: Vehicle Inventory API v2.0 (Active)  
**Compatibility**: Node.js 18+, MySQL 8.0+, WordPress 5.0+
