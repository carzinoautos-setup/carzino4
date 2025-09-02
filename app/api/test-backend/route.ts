import { NextRequest, NextResponse } from 'next/server'
import env from '../../../lib/env'

export async function GET(request: NextRequest) {
  try {
    const tests = []
    
    // Test 1: All filters
    const allFiltersUrl = `${env.WP_BASE_URL}/wp-json/custom/v1/filters`
    const allFiltersRes = await fetch(allFiltersUrl)
    const allFiltersData = await allFiltersRes.json()
    
    tests.push({
      name: 'All Filters',
      url: allFiltersUrl,
      success: allFiltersData.success,
      makeCount: allFiltersData.filters?.make?.length || 0,
      modelCount: allFiltersData.filters?.model?.length || 0,
      sampleModels: allFiltersData.filters?.model?.slice(0, 5) || []
    })
    
    // Test 2: Toyota only
    const toyotaFiltersUrl = `${env.WP_BASE_URL}/wp-json/custom/v1/filters?make=Toyota`
    const toyotaFiltersRes = await fetch(toyotaFiltersUrl)
    const toyotaFiltersData = await toyotaFiltersRes.json()
    
    const hasFordModels = toyotaFiltersData.filters?.model?.some((m: any) => 
      m.name?.toLowerCase().includes('f-150') || 
      m.name?.toLowerCase().includes('explorer') || 
      m.name?.toLowerCase().includes('mustang')
    ) || false
    
    const hasChevyModels = toyotaFiltersData.filters?.model?.some((m: any) => 
      m.name?.toLowerCase().includes('silverado') || 
      m.name?.toLowerCase().includes('malibu') || 
      m.name?.toLowerCase().includes('tahoe')
    ) || false
    
    tests.push({
      name: 'Toyota Only',
      url: toyotaFiltersUrl,
      success: toyotaFiltersData.success,
      appliedFilters: toyotaFiltersData.applied_filters,
      modelCount: toyotaFiltersData.filters?.model?.length || 0,
      sampleModels: toyotaFiltersData.filters?.model?.slice(0, 10) || [],
      hasFordModels,
      hasChevyModels,
      isConditionalWorking: !hasFordModels && !hasChevyModels
    })
    
    // Test 3: Toyota + Ford
    const multiFiltersUrl = `${env.WP_BASE_URL}/wp-json/custom/v1/filters?make=Toyota,Ford`
    const multiFiltersRes = await fetch(multiFiltersUrl)
    const multiFiltersData = await multiFiltersRes.json()
    
    tests.push({
      name: 'Toyota + Ford',
      url: multiFiltersUrl,
      success: multiFiltersData.success,
      appliedFilters: multiFiltersData.applied_filters,
      modelCount: multiFiltersData.filters?.model?.length || 0,
      sampleModels: multiFiltersData.filters?.model?.slice(0, 10) || []
    })
    
    // Test 4: Toyota Camry (nested filtering)
    const camryFiltersUrl = `${env.WP_BASE_URL}/wp-json/custom/v1/filters?make=Toyota&model=Camry`
    const camryFiltersRes = await fetch(camryFiltersUrl)
    const camryFiltersData = await camryFiltersRes.json()
    
    tests.push({
      name: 'Toyota Camry',
      url: camryFiltersUrl,
      success: camryFiltersData.success,
      appliedFilters: camryFiltersData.applied_filters,
      trimCount: camryFiltersData.filters?.trim?.length || 0,
      sampleTrims: camryFiltersData.filters?.trim?.slice(0, 5) || []
    })
    
    return NextResponse.json({
      success: true,
      message: 'Backend API Test Results',
      timestamp: new Date().toISOString(),
      tests
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Backend API test failed',
      message: error?.message || String(error)
    }, { status: 500 })
  }
}
