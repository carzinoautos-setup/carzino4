import {
  SimpleVehicleRecord,
  SimplePaginationParams,
  SimpleVehiclesApiResponse,
  SimplePaginationMeta,
  SimpleVehicleFilters,
} from "../types/simpleVehicle.js";

// Data arrays matching the original demo exactly
const MAKES = [
  "Audi",
  "BMW",
  "Chevrolet",
  "Ford",
  "Honda",
  "Hyundai",
  "Mercedes-Benz",
  "Nissan",
];
const MODELS_BY_MAKE = {
  Audi: ["A3", "A4", "A6", "Q5", "Q7", "Q8"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X7"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Camaro", "Tahoe"],
  Ford: [
    "F-150",
    "Escape",
    "Explorer",
    "Mustang",
    "Edge",
    "Expedition",
    "Ranger",
  ],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class", "A-Class"],
  Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Murano"],
};

const TRIMS = [
  "Base",
  "LX",
  "EX",
  "EX-L",
  "Touring",
  "Sport",
  "Limited",
  "Premium",
  "Luxury",
  "SE",
  "SL",
  "SR",
  "Platinum",
  "Lariat",
  "XLT",
];
const CONDITIONS = ["New", "Used", "Certified"];
const TRANSMISSIONS = ["Auto", "CVT", "Manual"];
const DRIVETRAINS = ["4WD", "AWD", "FWD", "RWD"];
const DOORS = ["2 doors", "4 doors"];
const SELLER_TYPES = ["Dealer", "Private Seller"];

// Valid body styles - excludes "Uncategorized" per validation rules
const VALID_BODY_STYLES = [
  "Sedan",
  "Crossover/SUV",
  "Coupe",
  "Convertible",
  "Hatchback",
  "Van / Minivan",
  "Wagon",
  "Trucks",
  "Regular Cab",
  "Extended Cab",
  "Crew Cab",
];

const DEALERS = [
  "Bayside Ford",
  "Premium Auto Group",
  "Downtown Honda",
  "City Toyota",
  "Luxury Motors",
  "Northwest Chevrolet",
  "Eastside BMW",
  "Metro Audi",
  "Pacific Mercedes-Benz",
  "Summit Hyundai",
  "Valley Nissan",
];

const LOCATIONS = [
  "Lakewood, WA 98499",
  "Tacoma, WA 98402",
  "Federal Way, WA 98003",
  "Seattle, WA 98101",
  "Bellevue, WA 98004",
  "Everett, WA 98201",
  "Renton, WA 98057",
  "Kent, WA 98032",
  "Redmond, WA 98052",
  "Bothell, WA 98011",
  "Tukwila, WA 98168",
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1563720223185-11003d516935?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1494976793431-05c5c2b1b1b1?w=450&h=300&fit=crop",
  "https://images.unsplash.com/photo-1550355191-aa8a80b41353?w=450&h=300&fit=crop",
];

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatMileage(miles: number): string {
  if (miles < 100) return miles.toString();
  return formatNumber(miles);
}

function formatPrice(price: number): string {
  return `$${formatNumber(price)}`;
}

// Generate a realistic vehicle record matching original demo format
function generateSimpleVehicleRecord(id: number): SimpleVehicleRecord {
  const make = randomChoice(MAKES);
  const model = randomChoice(
    MODELS_BY_MAKE[make as keyof typeof MODELS_BY_MAKE],
  );
  const year = randomInt(2018, 2025);
  const trim = randomChoice(TRIMS);
  const condition = randomChoice(CONDITIONS);
  const drivetrain = randomChoice(DRIVETRAINS);
  const bodyStyle = randomChoice(VALID_BODY_STYLES);

  // Generate mileage based on condition
  let mileage: number;
  if (condition === "New") {
    mileage = randomInt(0, 50);
  } else {
    mileage = randomInt(1000, 120000);
  }

  // Generate price based on condition and year
  const basePrice = randomInt(25000, 85000);
  const yearFactor =
    condition === "New" ? 1 : Math.max(0.4, 1 - (2024 - year) * 0.08);
  const price = Math.round(basePrice * yearFactor);

  // Generate payment (roughly price/60 months with interest)
  const monthlyPayment = Math.round((price * 1.05) / 60);

  // Determine if vehicle should have pricing
  const hasPrice = Math.random() > 0.15; // 85% have prices

  const title = `${year} ${make} ${model} ${trim}`;

  // Simulate your WordPress "is_featured" field logic
  const isFeatured = Math.random() > 0.85; // 15% featured (simulating "yes" values)

  // Generate badges based on condition and features (not featured - that's separate)
  const badges = [condition];
  if (drivetrain !== "FWD") badges.push(drivetrain);

  return {
    id,
    featured: isFeatured, // This controls the red "Featured!" badge
    viewed: Math.random() > 0.7, // 30% viewed
    images: [randomChoice(SAMPLE_IMAGES)],
    badges, // These are the grey condition/drivetrain badges
    title,
    mileage: formatMileage(mileage),
    transmission: randomChoice(TRANSMISSIONS),
    doors: randomChoice(DOORS),
    drivetrain,
    condition,
    body_type: bodyStyle,
    salePrice: hasPrice ? formatPrice(price) : null,
    payment: hasPrice ? `$${monthlyPayment}` : null,
    dealer: randomChoice(DEALERS),
    location: randomChoice(LOCATIONS),
    phone: `(${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    seller_type: randomChoice(SELLER_TYPES),
    account_number_seller: `ACCT${randomInt(1000, 9999)}`,
  };
}

export class SimpleMockVehicleService {
  private vehicles: SimpleVehicleRecord[] = [];
  private readonly TOTAL_VEHICLES = 50000;

  constructor() {
    console.log(
      "🔧 SimpleMockVehicleService: Generating sample data (original demo format)...",
    );
    this.generateMockData();
    // Apply validation rule to ensure no invalid body_type vehicles
    this.vehicles = this.vehicles.filter(
      (vehicle) =>
        vehicle.body_type &&
        vehicle.body_type !== "Uncategorized" &&
        vehicle.body_type.trim() !== "",
    );
    console.log(
      `✅ SimpleMockVehicleService: ${this.vehicles.length} vehicles generated (invalid body_type excluded)`,
    );
  }

  private generateMockData() {
    for (let i = 1; i <= this.TOTAL_VEHICLES; i++) {
      this.vehicles.push(generateSimpleVehicleRecord(i));
    }
  }

  private matchesFilters(
    vehicle: SimpleVehicleRecord,
    filters: SimpleVehicleFilters,
  ): boolean {
    // VALIDATION RULE: Exclude vehicles with invalid body_type
    if (
      !vehicle.body_type ||
      vehicle.body_type === "Uncategorized" ||
      vehicle.body_type.trim() === ""
    ) {
      return false;
    }

    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      if (!filters.condition.includes(vehicle.condition)) return false;
    }

    // Make filter (extract from title)
    if (filters.make && filters.make.length > 0) {
      const vehicleMake = vehicle.title.split(" ")[1]; // "2025 Ford F-150..." -> "Ford"
      if (!filters.make.includes(vehicleMake)) return false;
    }

    // Vehicle Type filter (maps to body_type field)
    if (filters.vehicleType && filters.vehicleType.length > 0) {
      if (!filters.vehicleType.includes(vehicle.body_type)) return false;
    }

    // Drive type filter
    if (filters.driveType && filters.driveType.length > 0) {
      // Map driveType filter values to vehicle drivetrain
      const driveTypeMapping: { [key: string]: string[] } = {
        "AWD/4WD": ["AWD", "4WD"],
        FWD: ["FWD"],
        RWD: ["RWD"],
      };

      let matches = false;
      for (const filterType of filters.driveType) {
        const allowedDrivetrains = driveTypeMapping[filterType] || [filterType];
        if (allowedDrivetrains.includes(vehicle.drivetrain)) {
          matches = true;
          break;
        }
      }
      if (!matches) return false;
    }

    // Transmission filter
    if (filters.transmission && filters.transmission.length > 0) {
      if (!filters.transmission.includes(vehicle.transmission)) return false;
    }

    // Mileage filter
    if (filters.mileage) {
      const vehicleMileage = parseInt(vehicle.mileage.replace(/,/g, ""));
      const filterMileage = parseInt(filters.mileage);

      if (filters.mileage === "100001") {
        // "100,000 or more"
        if (vehicleMileage <= 100000) return false;
      } else {
        // "X or less"
        if (vehicleMileage > filterMileage) return false;
      }
    }

    // Seller type filter
    if (filters.sellerType && filters.sellerType.length > 0) {
      if (!filters.sellerType.includes(vehicle.seller_type)) return false;
    }

    // Dealer filter (only applies to vehicles where seller_type = "Dealer")
    if (filters.dealer && filters.dealer.length > 0) {
      // Only apply dealer filter to dealer vehicles
      if (vehicle.seller_type === "Dealer") {
        if (!filters.dealer.includes(vehicle.dealer)) return false;
      } else {
        // If filtering by dealer but this is a private seller, exclude it
        return false;
      }
    }

    // Price filters
    if (filters.priceMin || filters.priceMax) {
      if (!vehicle.salePrice) return false; // No price listed

      const price = parseInt(vehicle.salePrice.replace(/[\$,]/g, ""));

      if (filters.priceMin) {
        const minPrice = parseInt(filters.priceMin.replace(/[\$,]/g, ""));
        if (price < minPrice) return false;
      }

      if (filters.priceMax) {
        const maxPrice = parseInt(filters.priceMax.replace(/[\$,]/g, ""));
        if (price > maxPrice) return false;
      }
    }

    // Payment filters
    if (filters.paymentMin || filters.paymentMax) {
      if (!vehicle.payment) return false; // No payment listed

      const payment = parseInt(vehicle.payment.replace(/[\$,]/g, ""));

      if (filters.paymentMin) {
        const minPayment = parseInt(filters.paymentMin.replace(/[\$,]/g, ""));
        if (payment < minPayment) return false;
      }

      if (filters.paymentMax) {
        const maxPayment = parseInt(filters.paymentMax.replace(/[\$,]/g, ""));
        if (payment > maxPayment) return false;
      }
    }

    return true;
  }

  async getVehicles(
    pagination: SimplePaginationParams,
    filters: SimpleVehicleFilters = {},
    sortBy: string = "relevance"
  ): Promise<SimpleVehiclesApiResponse> {
    try {
      // Filter vehicles
      const filteredVehicles = this.vehicles.filter((vehicle) =>
        this.matchesFilters(vehicle, filters),
      );

      // Sort by ID descending (newest first)
      filteredVehicles.sort((a, b) => b.id - a.id);

      // Apply pagination
      const totalRecords = filteredVehicles.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);
      const offset = (pagination.page - 1) * pagination.pageSize;
      const paginatedVehicles = filteredVehicles.slice(
        offset,
        offset + pagination.pageSize,
      );

      // Build pagination metadata
      const meta: SimplePaginationMeta = {
        totalRecords,
        totalPages,
        currentPage: pagination.page,
        pageSize: pagination.pageSize,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      };

      return {
        data: paginatedVehicles,
        meta,
        success: true,
      };
    } catch (error) {
      console.error("Error in simple mock vehicle service:", error);

      return {
        data: [],
        meta: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: pagination.page,
          pageSize: pagination.pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        success: false,
        message: "Failed to fetch vehicles from simple mock service",
      };
    }
  }

  async getVehicleById(id: number): Promise<SimpleVehicleRecord | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) || null;
  }

  async getDealers(): Promise<{ name: string; count: number }[]> {
    // Get dealers only from vehicles where seller_type = "Dealer" AND valid body_type
    const dealerVehicles = this.vehicles.filter(
      (v) =>
        v.seller_type === "Dealer" &&
        v.body_type &&
        v.body_type !== "Uncategorized" &&
        v.body_type.trim() !== "",
    );

    // Count vehicles per dealer
    const dealerCounts = new Map<string, number>();
    dealerVehicles.forEach((vehicle) => {
      const current = dealerCounts.get(vehicle.dealer) || 0;
      dealerCounts.set(vehicle.dealer, current + 1);
    });

    // Convert to array and sort by name
    const dealers = Array.from(dealerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return dealers;
  }

  async getVehicleTypeCounts(): Promise<{ name: string; count: number }[]> {
    // Only count vehicles with valid body_type
    const validVehicles = this.vehicles.filter(
      (v) =>
        v.body_type &&
        v.body_type !== "Uncategorized" &&
        v.body_type.trim() !== "",
    );

    // Count vehicles per body type
    const typeCounts = new Map<string, number>();
    validVehicles.forEach((vehicle) => {
      const current = typeCounts.get(vehicle.body_type) || 0;
      typeCounts.set(vehicle.body_type, current + 1);
    });

    // Convert to array and sort by count descending
    const types = Array.from(typeCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return types;
  }

  async getFilterOptions(): Promise<{
    makes: string[];
    conditions: string[];
    driveTypes: string[];
    sellerTypes: string[];
  }> {
    // Only include options from vehicles with valid body_type
    const validVehicles = this.vehicles.filter(
      (v) =>
        v.body_type &&
        v.body_type !== "Uncategorized" &&
        v.body_type.trim() !== "",
    );

    // Extract makes from vehicle titles
    const makes = Array.from(
      new Set(validVehicles.map((v) => v.title.split(" ")[1])),
    ).sort();

    const conditions = Array.from(
      new Set(validVehicles.map((v) => v.condition)),
    ).sort();
    const driveTypes = ["AWD/4WD", "FWD", "RWD"]; // Simplified like original
    const sellerTypes = Array.from(
      new Set(validVehicles.map((v) => v.seller_type)),
    ).sort();

    return {
      makes,
      conditions,
      driveTypes,
      sellerTypes,
    };
  }
}
