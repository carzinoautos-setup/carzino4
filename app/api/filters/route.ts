import { NextRequest, NextResponse } from 'next/server'
import { wooCommerceApi } from '../../../lib/api/woocommerce'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse applied filters for conditional filtering
    const appliedFilters: any = {}
    
    if (searchParams.get('make')) {
      appliedFilters.make = searchParams.get('make')?.split(',')
    }
    if (searchParams.get('model')) {
      appliedFilters.model = searchParams.get('model')?.split(',')
    }
    if (searchParams.get('condition')) {
      appliedFilters.condition = searchParams.get('condition')?.split(',')
    }
    if (searchParams.get('city')) {
      appliedFilters.city = searchParams.get('city')?.split(',')
    }
    if (searchParams.get('state')) {
      appliedFilters.state = searchParams.get('state')?.split(',')
    }
    if (searchParams.get('search')) {
      appliedFilters.search = searchParams.get('search')
    }
    
    // Fetch filter options from WooCommerce API
    const result = await wooCommerceApi.getFilterOptions(appliedFilters)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in filters API route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
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
      },
      { status: 500 }
    )
  }
}
