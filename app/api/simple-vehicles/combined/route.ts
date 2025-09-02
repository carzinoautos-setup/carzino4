import { NextRequest, NextResponse } from 'next/server';

const WP_BASE_URL = "https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1";

interface WooCommerceVehicle {
  id: number;
  name: string;
  permalink?: string;
  stock_status?: string;
  featured_image?: string;
  acf: {
    make?: string;
    model?: string;
    trim?: string;
    year?: string;
    price?: number;
    vin?: string;
    mileage?: number;
    body_style?: string;
    drivetrain?: string;
    fuel_type?: string;
    transmission?: string;
    condition?: string;
    exterior_color?: string;
    interior_color?: string;
    account_number_seller?: string;
    account_name_seller?: string;
    business_name_seller?: string;
    city_seller?: string;
    state_seller?: string;
    zip_seller?: string;
  };
}

// Transform WooCommerce vehicle data to frontend format
function transformVehicleData(vehicle: WooCommerceVehicle): any {
  const acf = vehicle.acf || {};

  return {
    id: vehicle.id,
    featured: vehicle.stock_status === 'featured' || false,
    viewed: false,
    images: vehicle.featured_image ? [vehicle.featured_image] : ['/placeholder.svg'],
    badges: vehicle.stock_status === 'featured' ? ['FEATURED'] : [],
    title: vehicle.name || `${acf.year || ''} ${acf.make || ''} ${acf.model || ''} ${acf.trim || ''}`.trim(),
    mileage: acf.mileage ? acf.mileage.toLocaleString() : 'N/A',
    transmission: acf.transmission || 'N/A',
    doors: '4', // Default, can be added to ACF later
    year: acf.year || 'N/A',
    drivetrain: acf.drivetrain || 'N/A',
    fuel_type: acf.fuel_type || 'N/A',
    body_style: acf.body_style || 'N/A',
    exterior_color: acf.exterior_color || 'N/A',
    interior_color: acf.interior_color || 'N/A',
    condition: acf.condition || 'Used',
    vin: acf.vin || 'N/A',
    salePrice: acf.price ? `$${acf.price.toLocaleString()}` : 'Call for Price',
    payment: acf.price ? `$${Math.round(acf.price / 60)}` : null, // Rough estimate
    dealer: acf.account_name_seller || acf.business_name_seller || 'Dealer',
    location: `${acf.city_seller || ''}, ${acf.state_seller || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Location N/A',
    phone: '(555) 123-4567', // Add to ACF later if needed
    seller_type: 'Dealer',
    seller_account_number: acf.account_number_seller || '',
    city_seller: acf.city_seller || '',
    state_seller: acf.state_seller || '',
    zip_seller: acf.zip_seller || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    // Build vehicles API URL with filters
    const vehiclesUrl = new URL(`${WP_BASE_URL}/vehicles`);
    vehiclesUrl.searchParams.set('per_page', pageSize.toString());
    vehiclesUrl.searchParams.set('page', page.toString());

    // Add filters from request
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'page' && key !== 'pageSize' && value) {
        // Map frontend filter names to WordPress API names
        const filterMapping: { [key: string]: string } = {
          'vehicleType': 'body_style',
          'driveType': 'drivetrain',
          'exteriorColor': 'exterior_color',
          'interiorColor': 'interior_color',
          'sellerType': 'seller_type'
        };

        const apiKey = filterMapping[key] || key;
        vehiclesUrl.searchParams.set(apiKey, value);
      }
    }

    console.log('🔗 Fetching vehicles from:', vehiclesUrl.toString());

    // Fetch vehicles and filters in parallel
    const [vehiclesResponse, filtersResponse] = await Promise.all([
      fetch(vehiclesUrl.toString()),
      fetch(`${WP_BASE_URL}/filters`)
    ]);

    if (!vehiclesResponse.ok) {
      throw new Error(`Vehicles API error: ${vehiclesResponse.status} ${vehiclesResponse.statusText}`);
    }

    if (!filtersResponse.ok) {
      throw new Error(`Filters API error: ${filtersResponse.status} ${filtersResponse.statusText}`);
    }

    const vehiclesData = await vehiclesResponse.json();
    const filtersData = await filtersResponse.json();

    console.log('✅ WordPress API Response:', {
      vehiclesSuccess: vehiclesData.success,
      vehiclesCount: vehiclesData.data?.length || 0,
      filtersSuccess: filtersData.success
    });

    // Transform vehicles to frontend format
    const transformedVehicles = vehiclesData.success && vehiclesData.data
      ? vehiclesData.data.map((vehicle: WooCommerceVehicle) => transformVehicleData(vehicle))
      : [];

    // Calculate pagination
    const totalRecords = vehiclesData.pagination?.total || transformedVehicles.length;
    const totalPages = vehiclesData.pagination?.total_pages || Math.ceil(totalRecords / pageSize);

    // Transform filters data to match frontend expectations
    const transformedFilters = filtersData.success && filtersData.filters ? {
      makes: filtersData.filters.make || [],
      models: filtersData.filters.model || [],
      trims: filtersData.filters.trim || [],
      years: filtersData.filters.year || [],
      conditions: filtersData.filters.condition || [],
      vehicleTypes: filtersData.filters.body_style || [],
      driveTypes: filtersData.filters.drivetrain || [],
      transmissions: filtersData.filters.transmission || [],
      fuelTypes: filtersData.filters.fuel_type || [],
      exteriorColors: filtersData.filters.exterior_color || [],
      interiorColors: filtersData.filters.interior_color || [],
      sellerTypes: filtersData.filters.seller_type || [],
      dealers: filtersData.filters.account_name_seller || [],
      states: filtersData.filters.state_seller || [],
      cities: filtersData.filters.city_seller || [],
      totalVehicles: totalRecords
    } : {
      makes: [], models: [], trims: [], years: [], conditions: [],
      vehicleTypes: [], driveTypes: [], transmissions: [], fuelTypes: [],
      exteriorColors: [], interiorColors: [], sellerTypes: [],
      dealers: [], states: [], cities: [], totalVehicles: 0
    };

    console.log('🔍 DEBUG: Transformed filter counts:', {
      makes: transformedFilters.makes.length,
      models: transformedFilters.models.length,
      years: transformedFilters.years.length,
      conditions: transformedFilters.conditions.length,
      dealers: transformedFilters.dealers.length
    });

    const response = {
      success: true,
      data: {
        vehicles: transformedVehicles,
        meta: {
          totalRecords,
          totalPages,
          currentPage: page,
          pageSize: pageSize
        },
        filters: transformedFilters
      }
    };

    console.log('✅ Combined API response prepared successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in WooCommerce API route:', error);

    // Return error with empty data structure
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch from WooCommerce API',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {
          vehicles: [],
          meta: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: parseInt(request.nextUrl.searchParams.get('page') || '1'),
            pageSize: parseInt(request.nextUrl.searchParams.get('pageSize') || '25')
          },
          filters: {
            makes: [], models: [], trims: [], conditions: [],
            vehicleTypes: [], driveTypes: [], transmissions: [],
            exteriorColors: [], interiorColors: [], sellerTypes: [],
            dealers: [], states: [], cities: [], totalVehicles: 0
          }
        }
      },
      { status: 500 }
    );
  }
}
