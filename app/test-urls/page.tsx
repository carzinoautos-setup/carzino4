'use client'

import React, { useState } from "react";
import { generateCarURL, parseCarURL, slugify, unslugify } from "../../lib/utils";

export default function TestURLsPage() {
  const [testFilters, setTestFilters] = useState({
    condition: [],
    make: ["Toyota"],
    model: ["Camry"],
    trim: ["LE"],
    year: ["2022"],
    vehicleType: [],
    driveType: [],
    transmission: [],
    fuel_type: [],
    exteriorColor: [],
    interiorColor: [],
    sellerType: [],
    dealer: [],
    city: [],
    state: [],
    mileage: "",
    priceMin: "20000",
    priceMax: "30000",
    yearMin: "",
    yearMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  const [testURL, setTestURL] = useState("");
  const [parsedFilters, setParsedFilters] = useState<any>({});

  const generateURL = () => {
    const url = generateCarURL(testFilters);
    setTestURL(url);
  };

  const parseURL = () => {
    if (testURL) {
      const [path, search] = testURL.split('?');
      const searchParams = new URLSearchParams(search || '');
      const parsed = parseCarURL(path, searchParams);
      setParsedFilters(parsed);
    }
  };

  const testCases = [
    {
      name: "Single make/model with trim and year",
      filters: {
        make: ["Toyota"],
        model: ["Camry"],
        trim: ["LE"],
        year: ["2022"],
        condition: [],
        vehicleType: [],
        driveType: [],
        transmission: [],
        fuel_type: [],
        exteriorColor: [],
        interiorColor: [],
        sellerType: [],
        dealer: [],
        city: [],
        state: [],
        mileage: "",
        priceMin: "",
        priceMax: "",
        yearMin: "",
        yearMax: "",
        paymentMin: "",
        paymentMax: "",
      },
      expectedURL: "/cars/toyota/camry?trim=le&year=2022"
    },
    {
      name: "Used vehicles only",
      filters: {
        make: ["Ford"],
        model: ["F-150"],
        condition: ["Used"],
        trim: [],
        year: [],
        vehicleType: [],
        driveType: [],
        transmission: [],
        fuel_type: [],
        exteriorColor: [],
        interiorColor: [],
        sellerType: [],
        dealer: [],
        city: [],
        state: [],
        mileage: "",
        priceMin: "",
        priceMax: "",
        yearMin: "",
        yearMax: "",
        paymentMin: "",
        paymentMax: "",
      },
      expectedURL: "/cars/ford/f-150?condition=used"
    },
    {
      name: "With body type and price range",
      filters: {
        make: ["Honda"],
        model: ["Civic"],
        vehicleType: ["Sedan"],
        condition: [],
        trim: [],
        year: [],
        driveType: [],
        transmission: [],
        fuel_type: [],
        exteriorColor: [],
        interiorColor: [],
        sellerType: [],
        dealer: [],
        city: [],
        state: [],
        mileage: "",
        priceMin: "20000",
        priceMax: "30000",
        yearMin: "",
        yearMax: "",
        paymentMin: "",
        paymentMax: "",
      },
      expectedURL: "/cars/honda/civic?body_type=sedan&price_min=20000&price_max=30000"
    },
    {
      name: "Multiple makes (comma-separated)",
      filters: {
        make: ["Toyota", "Honda", "Ford"],
        model: [],
        vehicleType: ["SUV / Crossover"],
        condition: [],
        trim: [],
        year: [],
        driveType: [],
        transmission: [],
        fuel_type: [],
        exteriorColor: [],
        interiorColor: [],
        sellerType: [],
        dealer: [],
        city: [],
        state: [],
        mileage: "",
        priceMin: "",
        priceMax: "",
        yearMin: "",
        yearMax: "",
        paymentMin: "",
        paymentMax: "",
      },
      expectedURL: "/cars?make=toyota,honda,ford&body_type=suv-crossover"
    },
    {
      name: "Category-only search (no make/model path)",
      filters: {
        make: [],
        model: [],
        vehicleType: ["Truck"],
        condition: ["New"],
        trim: [],
        year: [],
        driveType: [],
        transmission: [],
        fuel_type: [],
        exteriorColor: [],
        interiorColor: [],
        sellerType: [],
        dealer: [],
        city: [],
        state: [],
        mileage: "",
        priceMin: "",
        priceMax: "",
        yearMin: "",
        yearMax: "",
        paymentMin: "",
        paymentMax: "",
      },
      expectedURL: "/cars?condition=new&body_type=truck"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/cars" className="px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700">
                Cars Search
              </a>
              <a href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                Original Page
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">SEO-Friendly URL Testing</h1>
        
        {/* Interactive URL Generator */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive URL Generator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Make:</label>
              <input
                type="text"
                value={testFilters.make[0] || ""}
                onChange={(e) => setTestFilters({...testFilters, make: e.target.value ? [e.target.value] : []})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Toyota"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Model:</label>
              <input
                type="text"
                value={testFilters.model[0] || ""}
                onChange={(e) => setTestFilters({...testFilters, model: e.target.value ? [e.target.value] : []})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Camry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Trim:</label>
              <input
                type="text"
                value={testFilters.trim[0] || ""}
                onChange={(e) => setTestFilters({...testFilters, trim: e.target.value ? [e.target.value] : []})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="LE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year:</label>
              <input
                type="text"
                value={testFilters.year[0] || ""}
                onChange={(e) => setTestFilters({...testFilters, year: e.target.value ? [e.target.value] : []})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="2022"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Min:</label>
              <input
                type="text"
                value={testFilters.priceMin}
                onChange={(e) => setTestFilters({...testFilters, priceMin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="20000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Max:</label>
              <input
                type="text"
                value={testFilters.priceMax}
                onChange={(e) => setTestFilters({...testFilters, priceMax: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="30000"
              />
            </div>
          </div>
          
          <button
            onClick={generateURL}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-4"
          >
            Generate URL
          </button>
          
          <button
            onClick={parseURL}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Parse URL
          </button>
          
          {testURL && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Generated URL:</label>
              <div className="bg-white p-3 border rounded-md font-mono text-sm">
                <a href={testURL} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {testURL}
                </a>
              </div>
            </div>
          )}
          
          {Object.keys(parsedFilters).length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Parsed Filters:</label>
              <pre className="bg-white p-3 border rounded-md text-sm overflow-x-auto">
                {JSON.stringify(parsedFilters, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Cases */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Automated Test Cases</h2>
          
          {testCases.map((testCase, index) => {
            const generatedURL = generateCarURL(testCase.filters);
            const isMatch = generatedURL === testCase.expectedURL;
            
            return (
              <div key={index} className={`border rounded-lg p-4 ${isMatch ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <h3 className="font-semibold mb-2">{testCase.name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Expected URL:</strong>
                    <div className="font-mono bg-white p-2 rounded border mt-1">
                      {testCase.expectedURL}
                    </div>
                  </div>
                  
                  <div>
                    <strong>Generated URL:</strong>
                    <div className={`font-mono p-2 rounded border mt-1 ${isMatch ? 'bg-white' : 'bg-red-100'}`}>
                      <a href={generatedURL} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {generatedURL}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isMatch ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {isMatch ? '✓ PASS' : '✗ FAIL'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Utility Functions Test */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Utility Functions Test</h2>
          
          <div className="space-y-4">
            <div>
              <strong>Slugify Test:</strong>
              <div className="mt-2 space-y-2 text-sm">
                <div><code>slugify("Mercedes-Benz")</code> → <code>"{slugify("Mercedes-Benz")}"</code></div>
                <div><code>slugify("GLC Class")</code> → <code>"{slugify("GLC Class")}"</code></div>
                <div><code>slugify("300 4MATIC")</code> → <code>"{slugify("300 4MATIC")}"</code></div>
              </div>
            </div>
            
            <div>
              <strong>Unslugify Test:</strong>
              <div className="mt-2 space-y-2 text-sm">
                <div><code>unslugify("mercedes-benz")</code> → <code>"{unslugify("mercedes-benz")}"</code></div>
                <div><code>unslugify("glc-class")</code> → <code>"{unslugify("glc-class")}"</code></div>
                <div><code>unslugify("300-4matic")</code> → <code>"{unslugify("300-4matic")}"</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
