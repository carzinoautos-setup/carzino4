import env from '../env'

export interface VehicleFilters {
  make?: string[]
  model?: string[]
  condition?: string[]
  priceMin?: string
  priceMax?: string
  paymentMin?: string
  paymentMax?: string
  search?: string
  city?: string[]
  state?: string[]
  [key: string]: any
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface Vehicle {
  id: number
  title: string
  images: string[]
  badges: string[]
  mileage: string
  transmission: string
  doors: string
  salePrice: string | null
  payment: string | null
  dealer: string
  location: string
  phone: string
  featured?: boolean
  viewed?: boolean
  city_seller?: string
  state_seller?: string
  zip_seller?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    totalRecords: number
    totalPages: number
    currentPage: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  error?: string
}

class WooCommerceApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = env.WP_BASE_URL
  }

  async getVehicles(
    pagination: PaginationParams,
    filters: VehicleFilters = {},
    sortBy: string = 'relevance'
  ): Promise<ApiResponse<Vehicle[]>> {
    try {
      const url = new URL(`${this.baseUrl}${env.VEHICLES_ENDPOINT}`)
      
      // Add pagination
      url.searchParams.set('per_page', pagination.pageSize.toString())
      url.searchParams.set('page', pagination.page.toString())

      // Add filters
      if (filters.make && filters.make.length > 0) {
        url.searchParams.set('make', filters.make.join(','))
      }
      if (filters.model && filters.model.length > 0) {
        url.searchParams.set('model', filters.model.join(','))
      }
      if (filters.condition && filters.condition.length > 0) {
        url.searchParams.set('condition', filters.condition.join(','))
      }
      if (filters.city && filters.city.length > 0) {
        url.searchParams.set('city_seller', filters.city.join(','))
      }
      if (filters.state && filters.state.length > 0) {
        url.searchParams.set('state_seller', filters.state.join(','))
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search)
      }

      // Add sorting
      if (sortBy && sortBy !== 'relevance') {
        const sortMapping: { [key: string]: string } = {
          'price-low': 'price_asc',
          'price-high': 'price_desc',
          'year-newest': 'year_desc',
          'mileage-low': 'mileage_asc',
          'mileage-high': 'mileage_desc'
        }
        const wpSortValue = sortMapping[sortBy] || sortBy
        url.searchParams.set('sort', wpSortValue)
      }

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const apiResponse = await response.json()

      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        throw new Error('API did not return expected format')
      }

      // Transform vehicles data
      const transformedVehicles = this.transformVehicles(apiResponse.data, filters)

      return {
        success: true,
        data: transformedVehicles,
        meta: {
          totalRecords: apiResponse.pagination?.total || transformedVehicles.length,
          totalPages: apiResponse.pagination?.total_pages || 1,
          currentPage: apiResponse.pagination?.page || pagination.page,
          pageSize: apiResponse.pagination?.per_page || pagination.pageSize,
          hasNextPage: apiResponse.pagination?.page < apiResponse.pagination?.total_pages,
          hasPreviousPage: (apiResponse.pagination?.page || 1) > 1
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getFilterOptions(appliedFilters: VehicleFilters = {}) {
    try {
      const url = new URL(`${this.baseUrl}${env.FILTERS_ENDPOINT}`)

      // Add applied filters for conditional filtering
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          url.searchParams.set(key, value.join(','))
        } else if (typeof value === 'string' && value) {
          url.searchParams.set(key, value)
        }
      })

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Filters API responded with status: ${response.status}`)
      }

      const apiResponse = await response.json()

      if (!apiResponse.success || !apiResponse.filters) {
        throw new Error('Filters API did not return expected format')
      }

      return {
        success: true,
        data: {
          makes: this.sortFilterOptions(apiResponse.filters.make || []),
          models: this.sortFilterOptions(apiResponse.filters.model || []),
          conditions: this.sortFilterOptions(apiResponse.filters.condition || []),
          cities: this.sortFilterOptions(apiResponse.filters.city_seller || []),
          states: this.sortFilterOptions(apiResponse.filters.state_seller || []),
          dealers: this.sortFilterOptions(apiResponse.filters.account_name_seller || []),
          vehicleTypes: this.sortFilterOptions(apiResponse.filters.body_style || []),
          driveTypes: this.sortFilterOptions(apiResponse.filters.drivetrain || []),
          transmissions: this.sortFilterOptions(apiResponse.filters.transmission || []),
          exteriorColors: this.sortFilterOptions(apiResponse.filters.exterior_color || []),
          interiorColors: this.sortFilterOptions(apiResponse.filters.interior_color || []),
          priceRange: apiResponse.filters.price_range || { min: 0, max: 100000 },
          yearRange: apiResponse.filters.year_range || { min: 2000, max: 2025 },
          mileageRange: apiResponse.filters.mileage_range || { min: 0, max: 200000 },
          totalVehicles: apiResponse.filters.total_vehicles || 0
        }
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
      return {
        success: false,
        data: {
          makes: [],
          models: [],
          conditions: [],
          cities: [],
          states: [],
          dealers: [],
          vehicleTypes: [],
          driveTypes: [],
          transmissions: [],
          exteriorColors: [],
          interiorColors: [],
          priceRange: { min: 0, max: 100000 },
          yearRange: { min: 2000, max: 2025 },
          mileageRange: { min: 0, max: 200000 },
          totalVehicles: 0
        }
      }
    }
  }

  private transformVehicles(vehicles: any[], filters: VehicleFilters): Vehicle[] {
    let transformedVehicles = vehicles.map(vehicle => {
      // Extract price from multiple possible fields
      const priceFields = [
        vehicle.acf?.price,
        vehicle.acf?.sale_price,
        vehicle.acf?.listing_price,
        vehicle.price,
        vehicle.regular_price,
        vehicle.acf?.vehicle_price,
        vehicle.acf?.asking_price
      ]

      const price = priceFields.find(p => p && p !== "" && p !== "0" && parseInt(p) > 0)
      const formattedPrice = price ? `$${parseInt(price).toLocaleString()}` : null

      // Calculate or get payment
      const existingPayment = vehicle.acf?.payment
      let payment = null

      if (existingPayment && existingPayment !== "0" && parseInt(existingPayment) > 0) {
        payment = `$${parseInt(existingPayment)}/mo*`
      } else if (price) {
        payment = `$${Math.round(parseInt(price) / 60)}/mo*`
      }

      // Format mileage
      const mileage = vehicle.acf?.mileage || vehicle.acf?.odometer
      const formattedMileage = mileage && parseInt(mileage) > 0 ? 
        `${parseInt(mileage).toLocaleString()}` : "0"

      // Get drivetrain for badges
      const drivetrain = vehicle.acf?.drivetrain || vehicle.acf?.drive_type

      return {
        id: vehicle.id,
        featured: vehicle.acf?.is_featured || false,
        viewed: false,
        images: vehicle.images?.slice(0, 3).map((img: any) => img.src) || [vehicle.featured_image].filter(Boolean),
        badges: [
          vehicle.acf?.condition || "Used",
          drivetrain || "",
          vehicle.acf?.is_featured ? "Featured!" : ""
        ].filter(Boolean),
        title: vehicle.name || `${vehicle.acf?.year} ${vehicle.acf?.make} ${vehicle.acf?.model}`.trim(),
        mileage: formattedMileage,
        transmission: vehicle.acf?.transmission || "Auto",
        doors: vehicle.acf?.doors ? `${vehicle.acf.doors} doors` : "4 doors",
        salePrice: formattedPrice,
        payment: payment,
        dealer: vehicle.acf?.business_name_seller ||
                vehicle.acf?.acount_name_seller ||
                vehicle.acf?.account_name_seller ||
                vehicle.acf?.dealer_name || "Carzino Dealer",
        location: `${vehicle.acf?.city_seller || "Local"}, ${vehicle.acf?.state_seller || "State"}`,
        phone: vehicle.acf?.phone_number_seller || "Contact Dealer",
        city_seller: vehicle.acf?.city_seller,
        state_seller: vehicle.acf?.state_seller,
        zip_seller: vehicle.acf?.zip_seller || vehicle.acf?.zip_code_seller
      }
    })

    // Apply client-side price filtering
    if (filters.priceMin || filters.priceMax) {
      transformedVehicles = transformedVehicles.filter(vehicle => {
        if (!vehicle.salePrice) return false
        
        const price = parseInt(vehicle.salePrice.replace(/[^\d]/g, ''))
        
        if (filters.priceMin && price < parseInt(filters.priceMin.replace(/[^\d]/g, ''))) {
          return false
        }
        
        if (filters.priceMax && price > parseInt(filters.priceMax.replace(/[^\d]/g, ''))) {
          return false
        }
        
        return true
      })
    }

    // Apply client-side payment filtering
    if (filters.paymentMin || filters.paymentMax) {
      transformedVehicles = transformedVehicles.filter(vehicle => {
        if (!vehicle.payment) return false
        
        const payment = parseInt(vehicle.payment.replace(/[^\d]/g, ''))
        
        if (filters.paymentMin && payment < parseInt(filters.paymentMin.replace(/[^\d]/g, ''))) {
          return false
        }
        
        if (filters.paymentMax && payment > parseInt(filters.paymentMax.replace(/[^\d]/g, ''))) {
          return false
        }
        
        return true
      })
    }

    return transformedVehicles
  }

  private sortFilterOptions(options: any[]): any[] {
    if (!Array.isArray(options)) return []
    return options.sort((a, b) => {
      const nameA = (a.name || a).toString().toLowerCase()
      const nameB = (b.name || b).toString().toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }
}

export const wooCommerceApi = new WooCommerceApiService()
