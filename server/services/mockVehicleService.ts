import {
  VehicleRecord,
  PaginationParams,
  VehiclesApiResponse,
  PaginationMeta,
  VehicleFilters,
} from "../types/vehicle.js";

// Mock data arrays for realistic vehicle generation
const MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Nissan",
  "Hyundai",
  "Volkswagen",
  "Mazda",
  "Subaru",
  "Lexus",
  "Acura",
  "Infiniti",
];
const MODELS_BY_MAKE = {
  Toyota: [
    "Camry",
    "Corolla",
    "RAV4",
    "Highlander",
    "Prius",
    "Sienna",
    "Tacoma",
    "Tundra",
  ],
  Honda: [
    "Civic",
    "Accord",
    "CR-V",
    "Pilot",
    "Odyssey",
    "Ridgeline",
    "HR-V",
    "Passport",
  ],
  Ford: [
    "F-150",
    "Explorer",
    "Escape",
    "Edge",
    "Mustang",
    "Expedition",
    "Bronco",
    "Transit",
  ],
  Chevrolet: [
    "Silverado",
    "Equinox",
    "Malibu",
    "Tahoe",
    "Suburban",
    "Camaro",
    "Corvette",
    "Traverse",
  ],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "7 Series", "X7", "i3"],
  "Mercedes-Benz": [
    "C-Class",
    "E-Class",
    "GLC",
    "GLE",
    "S-Class",
    "A-Class",
    "GLA",
    "G-Class",
  ],
  Audi: ["A4", "A6", "Q5", "Q7", "A3", "Q3", "A8", "e-tron"],
  Nissan: [
    "Altima",
    "Sentra",
    "Rogue",
    "Pathfinder",
    "Titan",
    "Frontier",
    "Murano",
    "Armada",
  ],
  Hyundai: [
    "Elantra",
    "Sonata",
    "Tucson",
    "Santa Fe",
    "Palisade",
    "Ioniq",
    "Venue",
    "Genesis",
  ],
  Volkswagen: [
    "Jetta",
    "Passat",
    "Tiguan",
    "Atlas",
    "Golf",
    "Arteon",
    "ID.4",
    "Taos",
  ],
  Mazda: [
    "Mazda3",
    "Mazda6",
    "CX-5",
    "CX-9",
    "CX-30",
    "MX-5 Miata",
    "CX-50",
    "CX-90",
  ],
  Subaru: [
    "Outback",
    "Forester",
    "Impreza",
    "Legacy",
    "Ascent",
    "Crosstrek",
    "WRX",
    "BRZ",
  ],
  Lexus: ["ES", "RX", "NX", "GX", "LX", "IS", "LS", "UX"],
  Acura: [
    "TLX",
    "MDX",
    "RDX",
    "ILX",
    "NSX",
    "TLX Type S",
    "MDX Type S",
    "Integra",
  ],
  Infiniti: ["Q50", "QX60", "QX80", "Q60", "QX50", "Q70", "QX30", "Q40"],
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
];
const BODY_STYLES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Hatchback",
  "Wagon",
  "Convertible",
  "Van",
];
const FUEL_TYPES = [
  "Gasoline",
  "Hybrid",
  "Electric",
  "Diesel",
  "Plug-in Hybrid",
];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT"];
const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"];
const COLORS = [
  "White",
  "Black",
  "Silver",
  "Gray",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Gold",
  "Orange",
];
const CONDITIONS = ["New", "Used", "Certified"];
const SELLER_TYPES = ["Dealer", "Private Seller"];
const TITLE_STATUSES = ["Clean", "Salvage", "Rebuilt", "Lemon", "Flood"];

// Helper functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate a realistic vehicle record
function generateVehicleRecord(id: number): VehicleRecord {
  const make = randomChoice(MAKES);
  const model = randomChoice(
    MODELS_BY_MAKE[make as keyof typeof MODELS_BY_MAKE],
  );
  const year = randomInt(2010, 2025);
  const condition = randomChoice(CONDITIONS);
  const mileage =
    condition === "New" ? randomInt(0, 50) : randomInt(1000, 150000);
  const basePrice = randomInt(15000, 80000);
  const depreciation =
    condition === "New" ? 1 : Math.max(0.3, 1 - (2024 - year) * 0.1);
  const price = Math.round(basePrice * depreciation);

  return {
    id,
    year,
    make,
    model,
    trim: randomChoice(TRIMS),
    body_style: randomChoice(BODY_STYLES),
    engine_cylinders: randomChoice([4, 6, 8]),
    fuel_type: randomChoice(FUEL_TYPES),
    transmission: randomChoice(TRANSMISSIONS),
    transmission_speed: randomChoice(["6-Speed", "8-Speed", "10-Speed", "CVT"]),
    drivetrain: randomChoice(DRIVETRAINS),
    exterior_color_generic: randomChoice(COLORS),
    interior_color_generic: randomChoice(COLORS),
    doors: randomChoice([2, 4, 5]),
    price,
    mileage,
    title_status: randomChoice(TITLE_STATUSES),
    highway_mpg: randomInt(20, 40),
    condition,
    certified: Math.random() > 0.7,
    seller_account_number: `ACCT${randomInt(1000, 9999)}`,
    seller_type: randomChoice(SELLER_TYPES),
    interest_rate: randomFloat(2.5, 8.5, 2),
    down_payment: randomInt(2000, 10000),
    loan_term: randomInt(24, 84),
    payments: randomInt(200, 800),
  };
}

export class MockVehicleService {
  private vehicles: VehicleRecord[] = [];
  private readonly TOTAL_VEHICLES = 50000;

  constructor() {
    console.log("🔧 MockVehicleService: Generating sample data...");
    this.generateMockData();
    console.log(
      `✅ MockVehicleService: ${this.vehicles.length} vehicles generated`,
    );
  }

  private generateMockData() {
    // Generate vehicles in batches to avoid blocking
    for (let i = 1; i <= this.TOTAL_VEHICLES; i++) {
      this.vehicles.push(generateVehicleRecord(i));
    }
  }

  private matchesFilters(
    vehicle: VehicleRecord,
    filters: VehicleFilters,
  ): boolean {
    if (filters.make && vehicle.make !== filters.make) return false;
    if (filters.model && vehicle.model !== filters.model) return false;
    if (filters.year && vehicle.year !== filters.year) return false;
    if (filters.minPrice && vehicle.price < filters.minPrice) return false;
    if (filters.maxPrice && vehicle.price > filters.maxPrice) return false;
    if (filters.condition && vehicle.condition !== filters.condition)
      return false;
    if (filters.maxMileage && vehicle.mileage > filters.maxMileage)
      return false;
    if (filters.fuelType && vehicle.fuel_type !== filters.fuelType)
      return false;
    if (filters.transmission && vehicle.transmission !== filters.transmission)
      return false;
    if (filters.drivetrain && vehicle.drivetrain !== filters.drivetrain)
      return false;
    if (filters.bodyStyle && vehicle.body_style !== filters.bodyStyle)
      return false;
    if (
      filters.certified !== undefined &&
      vehicle.certified !== filters.certified
    )
      return false;
    if (filters.sellerType && vehicle.seller_type !== filters.sellerType)
      return false;

    return true;
  }

  async getVehicles(
    filters: VehicleFilters = {},
    pagination: PaginationParams,
  ): Promise<VehiclesApiResponse> {
    try {
      // Filter vehicles
      const filteredVehicles = this.vehicles.filter((vehicle) =>
        this.matchesFilters(vehicle, filters),
      );

      // Sort vehicles
      const sortBy = pagination.sortBy || "id";
      const sortOrder = pagination.sortOrder || "DESC";

      filteredVehicles.sort((a, b) => {
        const aValue = a[sortBy as keyof VehicleRecord];
        const bValue = b[sortBy as keyof VehicleRecord];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return sortOrder === "DESC" ? -comparison : comparison;
      });

      // Apply pagination
      const totalRecords = filteredVehicles.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);
      const offset = (pagination.page - 1) * pagination.pageSize;
      const paginatedVehicles = filteredVehicles.slice(
        offset,
        offset + pagination.pageSize,
      );

      // Build pagination metadata
      const meta: PaginationMeta = {
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
      console.error("Error in mock vehicle service:", error);

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
        message: "Failed to fetch vehicles from mock service",
      };
    }
  }

  async getVehicleById(id: number): Promise<VehicleRecord | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) || null;
  }

  async getFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    conditions: string[];
    fuelTypes: string[];
    transmissions: string[];
    drivetrains: string[];
    bodyStyles: string[];
    sellerTypes: string[];
  }> {
    const makes = Array.from(new Set(this.vehicles.map((v) => v.make))).sort();
    const models = Array.from(
      new Set(this.vehicles.map((v) => v.model)),
    ).sort();
    const conditions = Array.from(
      new Set(this.vehicles.map((v) => v.condition)),
    ).sort();
    const fuelTypes = Array.from(
      new Set(this.vehicles.map((v) => v.fuel_type)),
    ).sort();
    const transmissions = Array.from(
      new Set(this.vehicles.map((v) => v.transmission)),
    ).sort();
    const drivetrains = Array.from(
      new Set(this.vehicles.map((v) => v.drivetrain)),
    ).sort();
    const bodyStyles = Array.from(
      new Set(this.vehicles.map((v) => v.body_style)),
    ).sort();
    const sellerTypes = Array.from(
      new Set(this.vehicles.map((v) => v.seller_type)),
    ).sort();

    return {
      makes,
      models,
      conditions,
      fuelTypes,
      transmissions,
      drivetrains,
      bodyStyles,
      sellerTypes,
    };
  }
}
