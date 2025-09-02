import { Suspense } from 'react'
import { VehiclesListingPage } from '../../components/vehicles/VehiclesListingPage'
import { LoadingSpinner } from '../../components/ui/loading-spinner'

export const metadata = {
  title: 'Vehicle Inventory - Carzino Autos',
  description: 'Browse our complete vehicle inventory with advanced filtering and live pricing',
}

export default function VehiclesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <VehiclesListingPage />
        </Suspense>
      </div>
    </div>
  )
}
