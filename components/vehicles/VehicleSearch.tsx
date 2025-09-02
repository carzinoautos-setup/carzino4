'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'

interface VehicleSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  defaultValue?: string
}

export function VehicleSearch({ 
  onSearch, 
  placeholder = "Search vehicles...", 
  defaultValue = "" 
}: VehicleSearchProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Debounced search - trigger search after user stops typing
    if (value.length === 0) {
      onSearch('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        className="hidden" // Hidden submit button for form functionality
      >
        Search
      </button>
    </form>
  )
}
