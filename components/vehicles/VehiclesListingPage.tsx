'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { VehiclesGrid } from './VehiclesGrid'
import { VehicleSearch } from './VehicleSearch'
import { FilterSection } from './FilterSection'
import { Button } from '../ui/button'
import { LoadingSpinner } from '../ui/loading-spinner'

interface Vehicle {
  id: number
  featured: boolean
  viewed: boolean
  images: string[]
  badges: string[]
  title: string
  mileage: string
  transmission: string
  doors: string
  salePrice: string | null
  payment: string | null
  dealer: string
  location: string
  phone: string
  city_seller?: string
  state_seller?: string
  zip_seller?: string
}

interface VehicleFilters {
  make?: string[]
  model?: string[]
  condition?: string[]
  priceMin?: string
  priceMax?: string
  search?: string
  city?: string[]
  state?: string[]
}

export function VehiclesListingPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<VehicleFilters>({})
  const [sortBy, setSortBy] = useState('relevance')
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({})
  
  const pageSize = 20

  // Fetch vehicles
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vehicles', currentPage, filters, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            acc[key] = value.join(',')
          } else if (typeof value === 'string' && value) {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, string>)
      })

      const response = await fetch(`/api/vehicles?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      return response.json()
    },
  })

  // Fetch filter options
  const { data: filtersData, isLoading: filtersLoading } = useQuery({
    queryKey: ['filters', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(filters).reduce((acc, [key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            acc[key] = value.join(',')
          } else if (typeof value === 'string' && value) {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, string>)
      )

      const response = await fetch(`/api/filters?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch filters')
      }
      return response.json()
    },
  })

  const vehicles = vehiclesData?.data || []
  const meta = vehiclesData?.meta
  const filterOptions = filtersData?.data || {}

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }))
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string[]) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
    setCurrentPage(1)
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    setCurrentPage(1)
  }

  const handleToggleFavorite = (vehicle: Vehicle) => {
    setFavorites(prev => {
      const updated = { ...prev }
      if (updated[vehicle.id]) {
        delete updated[vehicle.id]
      } else {
        updated[vehicle.id] = vehicle
      }
      return updated
    })
  }

  const clearAllFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Vehicle Inventory</h1>
        <VehicleSearch onSearch={handleSearch} defaultValue={filters.search} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {filtersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Make Filter */}
                {filterOptions.makes && filterOptions.makes.length > 0 && (
                  <FilterSection title="Make">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filterOptions.makes.slice(0, 10).map((make: any) => (
                        <label key={make.name} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.make?.includes(make.name) || false}
                            onChange={(e) => {
                              const currentMakes = filters.make || []
                              const newMakes = e.target.checked
                                ? [...currentMakes, make.name]
                                : currentMakes.filter(m => m !== make.name)
                              handleFilterChange('make', newMakes)
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm">{make.name}</span>
                          {make.count && (
                            <span className="ml-auto text-xs text-gray-500">
                              ({make.count})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Condition Filter */}
                {filterOptions.conditions && filterOptions.conditions.length > 0 && (
                  <FilterSection title="Condition">
                    <div className="space-y-2">
                      {filterOptions.conditions.map((condition: any) => (
                        <label key={condition.name} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.condition?.includes(condition.name) || false}
                            onChange={(e) => {
                              const currentConditions = filters.condition || []
                              const newConditions = e.target.checked
                                ? [...currentConditions, condition.name]
                                : currentConditions.filter(c => c !== condition.name)
                              handleFilterChange('condition', newConditions)
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm">{condition.name}</span>
                          {condition.count && (
                            <span className="ml-auto text-xs text-gray-500">
                              ({condition.count})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Price Range */}
                <FilterSection title="Price Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                      <input
                        type="number"
                        value={filters.priceMin || ''}
                        onChange={(e) => handleFilterChange('priceMin', [e.target.value])}
                        placeholder="$0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                      <input
                        type="number"
                        value={filters.priceMax || ''}
                        onChange={(e) => handleFilterChange('priceMax', [e.target.value])}
                        placeholder="$100,000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {/* Sort and Results Count */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {meta && (
                <>
                  Showing {vehicles.length} of {meta.totalRecords} vehicles
                  {currentPage > 1 && ` (Page ${currentPage} of ${meta.totalPages})`}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="year-newest">Year: Newest First</option>
                <option value="mileage-low">Mileage: Low to High</option>
              </select>
            </div>
          </div>

          {/* Vehicles Grid */}
          {vehiclesError ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading vehicles. Please try again.</p>
            </div>
          ) : (
            <VehiclesGrid
              vehicles={vehicles}
              loading={vehiclesLoading}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={!meta.hasPreviousPage || vehiclesLoading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {meta.totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={!meta.hasNextPage || vehiclesLoading}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
