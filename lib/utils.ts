import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// URL utility functions for SEO-friendly car search URLs

interface FilterState {
  condition: string[];
  make: string[];
  model: string[];
  trim: string[];
  year: string[];
  vehicleType: string[];
  driveType: string[];
  transmission: string[];
  fuel_type: string[];
  exteriorColor: string[];
  interiorColor: string[];
  sellerType: string[];
  dealer: string[];
  city: string[];
  state: string[];
  mileage: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  paymentMin: string;
  paymentMax: string;
}

/**
 * Convert a string to URL-friendly format (lowercase with hyphens)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Convert URL-friendly format back to display format
 */
export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate the canonical URL path for make/model combination
 */
export function generateCarPath(make?: string, model?: string): string {
  if (!make && !model) {
    return '/cars';
  }

  if (make && !model) {
    return `/cars/${slugify(make)}`;
  }

  if (make && model) {
    return `/cars/${slugify(make)}/${slugify(model)}`;
  }

  return '/cars';
}

/**
 * Generate query parameters from filter state (excluding make/model)
 */
export function generateQueryParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Query param order for SEO consistency: trim → year → condition → body_type → price_min → price_max

  // Trim (already in path for single model, but query for multiple models)
  if (filters.trim.length > 0) {
    params.set('trim', filters.trim.map(slugify).join(','));
  }

  // Year
  if (filters.year.length > 0) {
    params.set('year', filters.year.join(','));
  }
  if (filters.yearMin && filters.yearMax) {
    params.set('year', `${filters.yearMin}-${filters.yearMax}`);
  } else if (filters.yearMin) {
    params.set('year_min', filters.yearMin);
  } else if (filters.yearMax) {
    params.set('year_max', filters.yearMax);
  }

  // Condition
  if (filters.condition.length > 0) {
    params.set('condition', filters.condition.map(slugify).join(','));
  }

  // Body type (vehicleType maps to body_type)
  if (filters.vehicleType.length > 0) {
    params.set('body_type', filters.vehicleType.map(slugify).join(','));
  }

  // Price range
  if (filters.priceMin) {
    params.set('price_min', filters.priceMin);
  }
  if (filters.priceMax) {
    params.set('price_max', filters.priceMax);
  }

  // Other filters (alphabetical order)
  if (filters.city.length > 0) {
    params.set('city', filters.city.map(slugify).join(','));
  }

  if (filters.dealer.length > 0) {
    params.set('dealer', filters.dealer.map(slugify).join(','));
  }

  if (filters.driveType.length > 0) {
    params.set('drivetrain', filters.driveType.map(slugify).join(','));
  }

  if (filters.exteriorColor.length > 0) {
    params.set('exterior_color', filters.exteriorColor.map(slugify).join(','));
  }

  if (filters.fuel_type.length > 0) {
    params.set('fuel_type', filters.fuel_type.map(slugify).join(','));
  }

  if (filters.interiorColor.length > 0) {
    params.set('interior_color', filters.interiorColor.map(slugify).join(','));
  }

  // Handle make when not in path (for category searches)
  if (filters.make.length > 0) {
    params.set('make', filters.make.map(slugify).join(','));
  }

  if (filters.mileage) {
    params.set('mileage', slugify(filters.mileage));
  }

  // Handle model when not in path (for make-only or category searches)
  if (filters.model.length > 0) {
    params.set('model', filters.model.map(slugify).join(','));
  }

  if (filters.paymentMin) {
    params.set('payment_min', filters.paymentMin);
  }
  if (filters.paymentMax) {
    params.set('payment_max', filters.paymentMax);
  }

  if (filters.sellerType.length > 0) {
    params.set('seller_type', filters.sellerType.map(slugify).join(','));
  }

  if (filters.state.length > 0) {
    params.set('state', filters.state.map(slugify).join(','));
  }

  if (filters.transmission.length > 0) {
    params.set('transmission', filters.transmission.map(slugify).join(','));
  }

  return params;
}

/**
 * Generate complete canonical URL from filter state
 */
export function generateCarURL(filters: FilterState): string {
  // Determine if we have a single make/model combination for the path
  const singleMake = filters.make.length === 1 ? filters.make[0] : undefined;
  const singleModel = filters.model.length === 1 ? filters.model[0] : undefined;

  // Generate path
  let path = generateCarPath(singleMake, singleModel);

  // Generate query parameters (excluding make/model if they're in the path)
  const queryFilters = { ...filters };

  if (singleMake && singleModel) {
    // Both in path, exclude from query
    queryFilters.make = [];
    queryFilters.model = [];
  } else if (singleMake && !singleModel) {
    // Only make in path, exclude make from query
    queryFilters.make = [];
  }

  const params = generateQueryParams(queryFilters);
  const queryString = params.toString();

  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Parse URL parameters and path to extract filter state
 */
export function parseCarURL(pathname: string, searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {
    condition: [],
    make: [],
    model: [],
    trim: [],
    year: [],
    vehicleType: [],
    driveType: [],
    transmission: [],
    fuel_type: [],
    exteriorColor: [],
    interiorColor: [],
    sellerType: [],
    dealer: [],
    city: [],
    state: [],
    mileage: '',
    priceMin: '',
    priceMax: '',
    yearMin: '',
    yearMax: '',
    paymentMin: '',
    paymentMax: '',
  };

  // Parse path for make/model
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'cars') {
    if (pathParts[1]) {
      filters.make = [unslugify(pathParts[1])];
    }
    if (pathParts[2]) {
      filters.model = [unslugify(pathParts[2])];
    }
  }

  // Parse query parameters
  for (const [key, value] of searchParams.entries()) {
    const values = value.split(',').map(v => v.trim());

    switch (key) {
      case 'trim':
        filters.trim = values.map(unslugify);
        break;
      case 'year':
        if (value.includes('-')) {
          const [min, max] = value.split('-');
          filters.yearMin = min;
          filters.yearMax = max;
        } else {
          filters.year = values;
        }
        break;
      case 'year_min':
        filters.yearMin = value;
        break;
      case 'year_max':
        filters.yearMax = value;
        break;
      case 'condition':
        filters.condition = values.map(unslugify);
        break;
      case 'body_type':
        filters.vehicleType = values.map(unslugify);
        break;
      case 'price_min':
        filters.priceMin = value;
        break;
      case 'price_max':
        filters.priceMax = value;
        break;
      case 'payment_min':
        filters.paymentMin = value;
        break;
      case 'payment_max':
        filters.paymentMax = value;
        break;
      case 'make':
        // Only use from query if not in path
        if (!filters.make?.length) {
          filters.make = values.map(unslugify);
        }
        break;
      case 'model':
        // Only use from query if not in path
        if (!filters.model?.length) {
          filters.model = values.map(unslugify);
        }
        break;
      case 'city':
        filters.city = values.map(unslugify);
        break;
      case 'dealer':
        filters.dealer = values.map(unslugify);
        break;
      case 'drivetrain':
        filters.driveType = values.map(unslugify);
        break;
      case 'exterior_color':
        filters.exteriorColor = values.map(unslugify);
        break;
      case 'fuel_type':
        filters.fuel_type = values.map(unslugify);
        break;
      case 'interior_color':
        filters.interiorColor = values.map(unslugify);
        break;
      case 'mileage':
        filters.mileage = unslugify(value);
        break;
      case 'seller_type':
        filters.sellerType = values.map(unslugify);
        break;
      case 'state':
        filters.state = values.map(unslugify);
        break;
      case 'transmission':
        filters.transmission = values.map(unslugify);
        break;
    }
  }

  return filters;
}

/**
 * Update the browser URL without triggering a page reload
 */
export function updateURL(filters: FilterState, replace = false): void {
  const url = generateCarURL(filters);

  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
}
