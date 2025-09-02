'use client'

import React from 'react'
import { VehicleCard } from './VehicleCard'
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

interface VehiclesGridProps {
  vehicles: Vehicle[]
  loading?: boolean
  onViewDetails?: (vehicle: Vehicle) => void
  onToggleFavorite?: (vehicle: Vehicle) => void
  favorites?: { [key: number]: Vehicle }
}

export function VehiclesGrid({ 
  vehicles, 
  loading = false, 
  onViewDetails, 
  onToggleFavorite, 
  favorites = {} 
}: VehiclesGridProps) {
  if (loading) {
    return <LoadingSpinner />
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No vehicles found matching your criteria.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters to see more results.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onViewDetails={onViewDetails}
          onToggleFavorite={onToggleFavorite}
          favorites={favorites}
        />
      ))}
    </div>
  )
}
