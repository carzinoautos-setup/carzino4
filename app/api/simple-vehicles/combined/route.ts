import { NextRequest, NextResponse } from 'next/server';
import { getCombinedVehicleData } from '../../../../server/routes/simpleVehicles';

export async function GET(request: NextRequest) {
  try {
    // Create a mock request and response object compatible with Express
    const mockReq = {
      method: 'GET',
      url: request.url,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
    };

    let responseData: any = null;
    let statusCode = 200;

    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      },
      setHeader: () => mockRes,
      end: () => mockRes,
    };

    // Call the existing function
    await getCombinedVehicleData(mockReq as any, mockRes as any);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in simple-vehicles combined API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
