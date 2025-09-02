'use client'

import { useState } from 'react'
import { Button } from '../../components/ui/button'

export default function TestPage() {
  const [vehiclesResult, setVehiclesResult] = useState<any>(null)
  const [filtersResult, setFiltersResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testVehiclesAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vehicles?page=1&pageSize=5')
      const data = await response.json()
      setVehiclesResult(data)
    } catch (error) {
      setVehiclesResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testFiltersAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/filters')
      const data = await response.json()
      setFiltersResult(data)
    } catch (error) {
      setFiltersResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testWooCommerceDirectly = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://env-uploadbackup62225-czdev.kinsta.cloud/wp-json/custom/v1/vehicles?per_page=2&page=1')
      const data = await response.json()
      setVehiclesResult({ direct: data })
    } catch (error) {
      setVehiclesResult({ directError: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Test Vehicles API */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicles API</h2>
          <Button 
            onClick={testVehiclesAPI} 
            disabled={loading}
            className="mb-4 w-full"
          >
            {loading ? 'Testing...' : 'Test /api/vehicles'}
          </Button>
          {vehiclesResult && (
            <div className="bg-gray-100 p-4 rounded text-sm">
              <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(vehiclesResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Filters API */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Filters API</h2>
          <Button 
            onClick={testFiltersAPI} 
            disabled={loading}
            className="mb-4 w-full"
          >
            {loading ? 'Testing...' : 'Test /api/filters'}
          </Button>
          {filtersResult && (
            <div className="bg-gray-100 p-4 rounded text-sm">
              <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(filtersResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Direct WooCommerce */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Direct WooCommerce</h2>
          <Button 
            onClick={testWooCommerceDirectly} 
            disabled={loading}
            className="mb-4 w-full"
          >
            {loading ? 'Testing...' : 'Test Direct API'}
          </Button>
          {vehiclesResult?.direct && (
            <div className="bg-gray-100 p-4 rounded text-sm">
              <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(vehiclesResult.direct, null, 2)}
              </pre>
            </div>
          )}
          {vehiclesResult?.directError && (
            <div className="bg-red-100 p-4 rounded text-sm text-red-600">
              Error: {vehiclesResult.directError}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Client Environment</h3>
              <ul className="text-sm text-gray-600 mt-2">
                <li>WP URL: {process.env.NEXT_PUBLIC_WP_URL || 'Not set'}</li>
                <li>Builder Key: {process.env.NEXT_PUBLIC_BUILDER_API_KEY ? 'Set' : 'Not set'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">API Information</h3>
              <ul className="text-sm text-gray-600 mt-2">
                <li>Vehicles Endpoint: /api/vehicles</li>
                <li>Filters Endpoint: /api/filters</li>
                <li>WooCommerce URL: https://env-uploadbackup62225-czdev.kinsta.cloud</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
