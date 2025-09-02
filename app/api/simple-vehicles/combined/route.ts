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

// Transform WooCommerce vehicle data to specification format
function transformVehicleData(vehicle: WooCommerceVehicle): any {
  const acf = vehicle.acf || {};

  return {
    // Core specification fields
    id: vehicle.id,
    name: vehicle.name || `${acf.year || ''} ${acf.make || ''} ${acf.model || ''} ${acf.trim || ''}`.trim(),
    permalink: vehicle.permalink || `#vehicle-${vehicle.id}`,
    stock_status: vehicle.stock_status || 'instock',
    featured_image: vehicle.featured_image || '/placeholder.svg',

    // ACF data in specification format
    acf: {
      year: acf.year || '',
      make: acf.make || '',
      model: acf.model || '',
      trim: acf.trim || '',
      price: acf.price || 0,
      mileage: acf.mileage || 0,
      body_style: acf.body_style || '',
      drivetrain: acf.drivetrain || '',
      fuel_type: acf.fuel_type || '',
      transmission: acf.transmission || '',
      condition: acf.condition || 'Used',
      exterior_color: acf.exterior_color || '',
      interior_color: acf.interior_color || '',
      account_number_seller: acf.account_number_seller || '',
      account_name_seller: acf.account_name_seller || acf.dealer_name || '',
      business_name_seller: acf.business_name_seller || '',
      city_seller: acf.city_seller || '',
      state_seller: acf.state_seller || '',
      zip_seller: acf.zip_seller || '',
      vin: acf.vin || '',
      car_location_latitude: acf.car_location_latitude || null,
      car_location_longitude: acf.car_location_longitude || null,
    },

    // Additional fields for frontend compatibility
    featured: vehicle.stock_status === 'featured' || false,
    viewed: false,
    images: vehicle.featured_image ? [vehicle.featured_image] : ['/placeholder.svg'],
    badges: vehicle.stock_status === 'featured' ? ['FEATURED'] : [],
    title: vehicle.name || `${acf.year || ''} ${acf.make || ''} ${acf.model || ''} ${acf.trim || ''}`.trim(),
    mileage: acf.mileage ? acf.mileage.toLocaleString() : 'N/A',
    doors: '4',
    year: acf.year || 'N/A',
    salePrice: acf.price ? `$${acf.price.toLocaleString()}` : 'Call for Price',
    payment: acf.price ? `$${Math.round(acf.price / 60)}` : null,
    dealer: acf.account_name_seller || acf.business_name_seller || acf.dealer_name || 'Dealer',
    location: `${acf.city_seller || ''}, ${acf.state_seller || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Location N/A',
    phone: '(555) 123-4567',
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
    const sortBy = searchParams.get('sortBy') || searchParams.get('sort');

    // Build vehicles API URL with filters
    const vehiclesUrl = new URL(`${WP_BASE_URL}/vehicles`);
    vehiclesUrl.searchParams.set('per_page', pageSize.toString());
    vehiclesUrl.searchParams.set('page', page.toString());

    // Add sorting parameter
    if (sortBy && sortBy !== 'relevance') {
      vehiclesUrl.searchParams.set('sort', sortBy);
    }

    // Build filters URL for dependent filtering
    const filtersUrl = new URL(`${WP_BASE_URL}/filters`);

    // Add filters from request
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'page' && key !== 'pageSize' && value) {
        // Map frontend filter names to WordPress API names
        const filterMapping: { [key: string]: string } = {
          'vehicleType': 'body_style',
          'driveType': 'drivetrain',
          'exteriorColor': 'exterior_color',
          'interiorColor': 'interior_color',
          'sellerType': 'seller_type',
          'account_number_seller': 'account_number_seller'
        };

        const apiKey = filterMapping[key] || key;
        vehiclesUrl.searchParams.set(apiKey, value);

        // Pass ALL filters to the filters endpoint for comprehensive conditional filtering
        // This enables dynamic narrowing of all filter options based on current selections
        if (!['page', 'pageSize', 'sort', 'sortBy'].includes(key)) {
          filtersUrl.searchParams.set(apiKey, value);
        }
      }
    }

    // Add location-based filtering (radius and zipCode)
    const zipCode = searchParams.get('zipCode');
    const radius = searchParams.get('radius');
    if (zipCode && radius) {
      vehiclesUrl.searchParams.set('zipCode', zipCode);
      vehiclesUrl.searchParams.set('radius', radius);
      // Pass location filters to filters endpoint for location-aware conditional filtering
      filtersUrl.searchParams.set('zipCode', zipCode);
      filtersUrl.searchParams.set('radius', radius);
    }

    // Pass sorting parameter to filters endpoint if needed for conditional filtering
    if (sortBy && sortBy !== 'relevance') {
      filtersUrl.searchParams.set('sort', sortBy);
    }

    console.log('🔗 Fetching vehicles from:', vehiclesUrl.toString());
    console.log('🔗 Fetching filters from:', filtersUrl.toString());

    // Fetch vehicles and filters in parallel
    const [vehiclesResponse, filtersResponse] = await Promise.all([
      fetch(vehiclesUrl.toString()),
      fetch(filtersUrl.toString())
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

    console.log('🔍 DEBUG: Raw filters data structure:', {
      hasFilters: !!filtersData.filters,
      filterKeys: filtersData.filters ? Object.keys(filtersData.filters) : [],
      sampleMakes: filtersData.filters?.make?.slice(0, 3)
    });

    console.log('🔗 DEBUG: Conditional filtering applied:', {
      filtersUrlParams: filtersUrl.searchParams.toString(),
      hasConditionalFilters: filtersUrl.searchParams.toString().length > 0
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

    // Build applied filters object for specification compliance
    const appliedFilters: { [key: string]: string } = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'page' && key !== 'pageSize' && key !== 'sort' && key !== 'sortBy' && value) {
        appliedFilters[key] = value;
      }
    }

    console.log('🚨 DEBUG: WordPress API conditional filtering check:', {
      hasAppliedFilters: Object.keys(appliedFilters).length > 0,
      appliedFiltersCount: Object.keys(appliedFilters).length,
      modelsReturned: transformedFilters.models.length,
      sampleModels: transformedFilters.models.slice(0, 3),
      appliedFilters: appliedFilters
    });

    const response = {
      success: true,
      data: transformedVehicles,
      pagination: {
        total: totalRecords,
        page: page,
        per_page: pageSize,
        total_pages: totalPages
      },
      filters: transformedFilters,
      applied_filters: appliedFilters
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
        data: [],
        pagination: {
          total: 0,
          page: parseInt(request.nextUrl.searchParams.get('page') || '1'),
          per_page: parseInt(request.nextUrl.searchParams.get('pageSize') || '25'),
          total_pages: 0
        },
        filters: {
          makes: [], models: [], trims: [], years: [], conditions: [],
          vehicleTypes: [], driveTypes: [], transmissions: [], fuelTypes: [],
          exteriorColors: [], interiorColors: [], sellerTypes: [],
          dealers: [], states: [], cities: [], totalVehicles: 0
        },
        applied_filters: {}
      },
      { status: 500 }
    );
  }
}
