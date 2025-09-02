import { NextRequest, NextResponse } from 'next/server';

// For now, let's create a simple mock response to get the app working
// This matches the expected structure from the frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    // Mock response data that matches what the frontend expects
    const mockResponse = {
      success: true,
      data: {
        vehicles: [
          {
            id: 1,
            featured: true,
            viewed: false,
            images: ['/placeholder.svg'],
            badges: ['FEATURED'],
            title: '2023 Toyota Camry LE',
            mileage: '15,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$28,900',
            payment: '$450',
            dealer: 'Sample Auto Dealer',
            location: 'Seattle, WA',
            phone: '(555) 123-4567',
            seller_type: 'Dealer',
            seller_account_number: 'D12345',
            city_seller: 'Seattle',
            state_seller: 'WA',
            zip_seller: '98101'
          }
        ],
        meta: {
          totalRecords: 1,
          totalPages: 1,
          currentPage: page,
          pageSize: pageSize
        },
        filters: {
          makes: [
            { name: 'Toyota', count: 150 },
            { name: 'Honda', count: 120 },
            { name: 'Ford', count: 100 },
            { name: 'Chevrolet', count: 90 },
            { name: 'Nissan', count: 80 }
          ],
          models: [
            { name: 'Camry', count: 25 },
            { name: 'Corolla', count: 20 },
            { name: 'RAV4', count: 30 }
          ],
          trims: [
            { name: 'LE', count: 15 },
            { name: 'XLE', count: 10 },
            { name: 'Limited', count: 8 }
          ],
          conditions: [
            { name: 'New', count: 50 },
            { name: 'Used', count: 200 },
            { name: 'Certified', count: 30 }
          ],
          vehicleTypes: [
            { name: 'Sedan', count: 100 },
            { name: 'SUV', count: 80 },
            { name: 'Truck', count: 60 }
          ],
          driveTypes: [
            { name: 'FWD', count: 120 },
            { name: 'AWD', count: 80 },
            { name: 'RWD', count: 50 }
          ],
          transmissions: [
            { name: 'Automatic', count: 180 },
            { name: 'Manual', count: 20 },
            { name: 'CVT', count: 40 }
          ],
          exteriorColors: [
            { name: 'White', count: 60 },
            { name: 'Black', count: 50 },
            { name: 'Silver', count: 40 },
            { name: 'Gray', count: 35 }
          ],
          interiorColors: [
            { name: 'Black', count: 80 },
            { name: 'Gray', count: 60 },
            { name: 'Beige', count: 40 }
          ],
          sellerTypes: [
            { name: 'Dealer', count: 200 },
            { name: 'Private Seller', count: 50 }
          ],
          dealers: [
            { name: 'Sample Auto Dealer', count: 25 },
            { name: 'Metro Motors', count: 20 },
            { name: 'City Cars', count: 15 }
          ],
          states: [
            { name: 'WA', count: 100 },
            { name: 'CA', count: 80 },
            { name: 'OR', count: 30 }
          ],
          cities: [
            { name: 'Seattle', count: 50 },
            { name: 'Tacoma', count: 25 },
            { name: 'Bellevue', count: 20 }
          ],
          totalVehicles: 280
        }
      }
    };

    console.log('✅ Simple vehicles combined API - returning mock data');
    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error in simple-vehicles combined API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {
          vehicles: [],
          meta: { totalRecords: 0, totalPages: 0, currentPage: 1, pageSize: 25 },
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
