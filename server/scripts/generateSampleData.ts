import { getDatabase } from "../db/connection.js";

// Sample data arrays for realistic vehicle generation
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

function generateVIN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let vin = "";
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
}

// Generate a realistic vehicle record
function generateVehicleRecord(): any {
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

  return [
    year,
    make,
    model,
    randomChoice(TRIMS),
    randomChoice(BODY_STYLES),
    randomChoice([4, 6, 8]),
    randomChoice(FUEL_TYPES),
    randomChoice(TRANSMISSIONS),
    randomChoice(["6-Speed", "8-Speed", "10-Speed", "CVT"]),
    randomChoice(DRIVETRAINS),
    randomChoice(COLORS),
    randomChoice(COLORS),
    randomChoice([2, 4, 5]),
    price,
    mileage,
    randomChoice(TITLE_STATUSES),
    randomInt(20, 40),
    condition,
    Math.random() > 0.7 ? 1 : 0, // certified
    `ACCT${randomInt(1000, 9999)}`,
    randomChoice(SELLER_TYPES),
    randomFloat(2.5, 8.5, 2),
    randomInt(2000, 10000),
    randomInt(24, 84),
    randomInt(200, 800),
  ];
}

// Create vehicles table if it doesn't exist
async function createVehiclesTable(): Promise<void> {
  const db = getDatabase();

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      make VARCHAR(50) NOT NULL,
      model VARCHAR(50) NOT NULL,
      trim VARCHAR(50),
      body_style VARCHAR(30),
      engine_cylinders INT,
      fuel_type VARCHAR(30),
      transmission VARCHAR(30),
      transmission_speed VARCHAR(20),
      drivetrain VARCHAR(10),
      exterior_color_generic VARCHAR(30),
      interior_color_generic VARCHAR(30),
      doors INT,
      price DECIMAL(10,2) NOT NULL,
      mileage INT,
      title_status VARCHAR(20),
      highway_mpg INT,
      condition VARCHAR(20) NOT NULL,
      certified BOOLEAN DEFAULT FALSE,
      seller_account_number VARCHAR(20),
      seller_type VARCHAR(20),
      interest_rate DECIMAL(4,2),
      down_payment DECIMAL(10,2),
      loan_term INT,
      payments DECIMAL(10,2),
      INDEX idx_make (make),
      INDEX idx_model (model),
      INDEX idx_year (year),
      INDEX idx_price (price),
      INDEX idx_condition (condition),
      INDEX idx_mileage (mileage),
      INDEX idx_seller_type (seller_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await db.execute(createTableSQL);
    console.log("✅ Vehicles table created successfully");
  } catch (error) {
    console.error("❌ Error creating vehicles table:", error);
    throw error;
  }
}

// Generate and insert sample data
export async function generateSampleData(
  recordCount: number = 50000,
): Promise<void> {
  console.log(
    `🚀 Starting to generate ${recordCount} sample vehicle records...`,
  );

  try {
    const db = getDatabase();

    // Create table first
    await createVehiclesTable();

    // Check if data already exists
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as count FROM vehicles",
    );
    const existingCount = (countResult as any)[0].count;

    if (existingCount > 0) {
      console.log(
        `ℹ️  Found ${existingCount} existing records. Skipping data generation.`,
      );
      return;
    }

    // Generate data in batches for better performance
    const batchSize = 1000;
    const batches = Math.ceil(recordCount / batchSize);

    const insertSQL = `
      INSERT INTO vehicles (
        year, make, model, trim, body_style, engine_cylinders,
        fuel_type, transmission, transmission_speed, drivetrain,
        exterior_color_generic, interior_color_generic, doors, price,
        mileage, title_status, highway_mpg, condition, certified,
        seller_account_number, seller_type, interest_rate,
        down_payment, loan_term, payments
      ) VALUES ?
    `;

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(
        batchSize,
        recordCount - batch * batchSize,
      );
      const batchData = [];

      for (let i = 0; i < currentBatchSize; i++) {
        batchData.push(generateVehicleRecord());
      }

      await db.execute(insertSQL, [batchData]);

      const processed = (batch + 1) * batchSize;
      const progress = Math.min(processed, recordCount);
      console.log(
        `📊 Progress: ${progress}/${recordCount} records inserted (${((progress / recordCount) * 100).toFixed(1)}%)`,
      );
    }

    console.log("✅ Sample data generation completed successfully!");

    // Display summary
    const [finalCount] = await db.execute(
      "SELECT COUNT(*) as count FROM vehicles",
    );
    const totalRecords = (finalCount as any)[0].count;
    console.log(`📈 Total records in database: ${totalRecords}`);
  } catch (error) {
    console.error("❌ Error generating sample data:", error);
    throw error;
  }
}

// Script runner (can be called directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  const recordCount = process.argv[2] ? parseInt(process.argv[2]) : 50000;
  generateSampleData(recordCount)
    .then(() => {
      console.log("🎉 Sample data generation script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Sample data generation script failed:", error);
      process.exit(1);
    });
}
