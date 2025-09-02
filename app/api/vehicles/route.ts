import { NextRequest, NextResponse } from 'next/server'
import { wooCommerceApi } from '../../../lib/api/woocommerce'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    // Parse filters
    const filters: any = {}
    
    if (searchParams.get('make')) {
      filters.make = searchParams.get('make')?.split(',')
    }
    if (searchParams.get('model')) {
      filters.model = searchParams.get('model')?.split(',')
    }
    if (searchParams.get('condition')) {
      filters.condition = searchParams.get('condition')?.split(',')
    }
    if (searchParams.get('city')) {
      filters.city = searchParams.get('city')?.split(',')
    }
    if (searchParams.get('state')) {
      filters.state = searchParams.get('state')?.split(',')
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')
    }
    if (searchParams.get('priceMin')) {
      filters.priceMin = searchParams.get('priceMin')
    }
    if (searchParams.get('priceMax')) {
      filters.priceMax = searchParams.get('priceMax')
    }
    if (searchParams.get('paymentMin')) {
      filters.paymentMin = searchParams.get('paymentMin')
    }
    if (searchParams.get('paymentMax')) {
      filters.paymentMax = searchParams.get('paymentMax')
    }
    
    // Get sort parameter
    const sortBy = searchParams.get('sortBy') || 'relevance'
    
    // Fetch vehicles from WooCommerce API
    const result = await wooCommerceApi.getVehicles(
      { page, pageSize },
      filters,
      sortBy
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in vehicles API route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        data: [] 
      },
      { status: 500 }
    )
  }
}
