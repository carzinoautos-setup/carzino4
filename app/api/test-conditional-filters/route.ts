import { NextRequest, NextResponse } from 'next/server'
import env from '../../../lib/env'

export async function GET(_request: NextRequest) {
  try {
    const wpBase = env.WP_BASE_URL.replace(/\/$/, '')
    
    // Test 1: All filters (no conditions)
    const allFiltersUrl = `${wpBase}/wp-json/custom/v1/filters`
    const allResponse = await fetch(allFiltersUrl, { cache: 'no-store' })
    const allData = await allResponse.json()

    // Test 2: Toyota only
    const toyotaFiltersUrl = `${wpBase}/wp-json/custom/v1/filters?make=Toyota`
    const toyotaResponse = await fetch(toyotaFiltersUrl, { cache: 'no-store' })
    const toyotaData = await toyotaResponse.json()

    // Test 3: Toyota + Ford multi-select
    const multiFiltersUrl = `${wpBase}/wp-json/custom/v1/filters?make=Toyota,Ford`
    const multiResponse = await fetch(multiFiltersUrl, { cache: 'no-store' })
    const multiData = await multiResponse.json()

    // Analyze results
    const allMakes = allData.filters?.make || []
    const allModels = allData.filters?.model || []
    
    const toyotaMakes = toyotaData.filters?.make || []
    const toyotaModels = toyotaData.filters?.model || []
    
    const multiMakes = multiData.filters?.make || []
    const multiModels = multiData.filters?.model || []

    // Check if Toyota-only still shows non-Toyota models (indicates broken filtering)
    const toyotaHasFordModels = toyotaModels.some((m: any) => 
      m.name.toLowerCase().includes('f-150') ||
      m.name.toLowerCase().includes('explorer') ||
      m.name.toLowerCase().includes('mustang') ||
      m.name.toLowerCase().includes('escape') ||
      m.name.toLowerCase().includes('bronco')
    )

    const toyotaHasChevyModels = toyotaModels.some((m: any) =>
      m.name.toLowerCase().includes('silverado') ||
      m.name.toLowerCase().includes('tahoe') ||
      m.name.toLowerCase().includes('malibu') ||
      m.name.toLowerCase().includes('camaro') ||
      m.name.toLowerCase().includes('corvette')
    )

    const isConditionalFilteringWorking = !toyotaHasFordModels && !toyotaHasChevyModels

    const tests = [
      {
        name: 'All Filters (No Conditions)',
        makeCount: allMakes.length,
        modelCount: allModels.length,
        success: allData.success,
        appliedFilters: allData.applied_filters || {},
        status: 'baseline'
      },
      {
        name: 'Toyota Only',
        makeCount: toyotaMakes.length,
        modelCount: toyotaModels.length,
        success: toyotaData.success,
        appliedFilters: toyotaData.applied_filters || {},
        hasFordModels: toyotaHasFordModels,
        hasChevyModels: toyotaHasChevyModels,
        isConditionalWorking: isConditionalFilteringWorking,
        sampleModels: toyotaModels.slice(0, 10).map((m: any) => m.name),
        status: isConditionalFilteringWorking ? 'pass' : 'fail'
      },
      {
        name: 'Toyota + Ford Multi-Select',
        makeCount: multiMakes.length,
        modelCount: multiModels.length,
        success: multiData.success,
        appliedFilters: multiData.applied_filters || {},
        status: multiData.success ? 'pass' : 'fail'
      }
    ]

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      conditionalFilteringWorking: isConditionalFilteringWorking,
      tests,
      summary: {
        totalTests: tests.length,
        passed: tests.filter(t => t.status === 'pass').length,
        failed: tests.filter(t => t.status === 'fail').length,
        baseline: tests.filter(t => t.status === 'baseline').length
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error?.message || String(error)
    }, { status: 500 })
  }
}
