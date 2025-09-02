'use client'

import { BuilderComponent, useIsPreviewing } from '@builder.io/react'
import { BuilderContent } from '@builder.io/sdk'

// Import our custom components for Builder.io
import { VehicleCard } from '../vehicles/VehicleCard'
import { FilterSection } from '../vehicles/FilterSection'
import { VehiclesGrid } from '../vehicles/VehiclesGrid'
import { VehicleSearch } from '../vehicles/VehicleSearch'

interface RenderBuilderContentProps {
  content: BuilderContent | null
}

export function RenderBuilderContent({ content }: RenderBuilderContentProps) {
  const isPreviewing = useIsPreviewing()

  // If no content found and not in preview mode, show 404
  if (!content && !isPreviewing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600">Page not found</p>
        </div>
      </div>
    )
  }

  return (
    <BuilderComponent
      model="page"
      content={content}
      customComponents={[
        {
          component: VehicleCard,
          name: 'VehicleCard',
          inputs: [
            { name: 'vehicle', type: 'object' },
            { name: 'onViewDetails', type: 'function' }
          ]
        },
        {
          component: FilterSection,
          name: 'FilterSection',
          inputs: [
            { name: 'title', type: 'string' },
            { name: 'options', type: 'list' },
            { name: 'selectedValues', type: 'list' },
            { name: 'onSelectionChange', type: 'function' },
            { name: 'type', type: 'string' }
          ]
        },
        {
          component: VehiclesGrid,
          name: 'VehiclesGrid',
          inputs: [
            { name: 'vehicles', type: 'list' },
            { name: 'loading', type: 'boolean' }
          ]
        },
        {
          component: VehicleSearch,
          name: 'VehicleSearch',
          inputs: [
            { name: 'onSearch', type: 'function' },
            { name: 'placeholder', type: 'string' }
          ]
        }
      ]}
    />
  )
}
