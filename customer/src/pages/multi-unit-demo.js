import React, { useState, useEffect } from "react";
import Layout from "@layout/Layout";
import ProductCardMultiUnit from "@components/product/ProductCardMultiUnit";
import ProductCardEnhanced from "@components/product/ProductCardEnhanced";
import ProductServices from "@services/ProductServices";
import AttributeServices from "@services/AttributeServices";

const MultiUnitDemo = ({ products, attributes }) => {
  const [selectedView, setSelectedView] = useState('enhanced');

  // Filter products that have multi-units
  const multiUnitProducts = products?.filter(product => product.hasMultiUnits) || [];
  const regularProducts = products?.filter(product => !product.hasMultiUnits) || [];

  return (
    <Layout title="Multi-Unit Demo" description="Demonstration of multi-unit product functionality">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="py-10 lg:py-12">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Multi-Unit Product Demo
            </h1>
            <p className="text-gray-600 mb-6">
              This demo showcases products with multiple unit configurations. Customers can select 
              different units (like individual pieces, dozens, cases) with different pricing and pack quantities.
            </p>
            
            {/* View Toggle */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setSelectedView('enhanced')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'enhanced'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Enhanced Cards
              </button>
              <button
                onClick={() => setSelectedView('multiunit')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'multiunit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Multi-Unit Cards
              </button>
            </div>
          </div>

          {/* Multi-Unit Products Section */}
          {multiUnitProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Products with Multi-Unit Support ({multiUnitProducts.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {multiUnitProducts.map((product) => (
                  selectedView === 'enhanced' ? (
                    <ProductCardEnhanced
                      key={product._id}
                      product={product}
                      attributes={attributes}
                    />
                  ) : (
                    <ProductCardMultiUnit
                      key={product._id}
                      product={product}
                      attributes={attributes}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Regular Products Section */}
          {regularProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Regular Products (Basic Units Only) ({regularProducts.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {regularProducts.slice(0, 8).map((product) => (
                  selectedView === 'enhanced' ? (
                    <ProductCardEnhanced
                      key={product._id}
                      product={product}
                      attributes={attributes}
                    />
                  ) : (
                    <ProductCardMultiUnit
                      key={product._id}
                      product={product}
                      attributes={attributes}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Feature Explanation Section */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Multi-Unit System Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Unit Selection
                </h3>
                <p className="text-gray-600">
                  Choose from multiple unit options (pieces, dozens, cases) with different pack quantities and pricing.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Dynamic Pricing
                </h3>
                <p className="text-gray-600">
                  Prices adjust automatically based on selected unit, showing cost per base unit and total price.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Smart Stock Management
                </h3>
                <p className="text-gray-600">
                  Stock calculations based on pack quantities. System automatically calculates available units.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 7m0 6l-2-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Cart Integration
                </h3>
                <p className="text-gray-600">
                  Each unit selection creates unique cart items with proper unit information and pricing.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Fallback Support
                </h3>
                <p className="text-gray-600">
                  Works seamlessly with products that don't have multi-units, providing consistent experience.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Performance Optimized
                </h3>
                <p className="text-gray-600">
                  Efficient loading with fallbacks, error handling, and optimized API calls for smooth experience.
                </p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              How to Use Multi-Unit Products
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Look for products with the "MULTI-UNIT" badge</li>
              <li>Click on the unit dropdown to see available options</li>
              <li>Select your preferred unit (e.g., individual, dozen, case)</li>
              <li>View the pack quantity and price per base unit information</li>
              <li>Adjust quantity as needed</li>
              <li>Add to cart - each unit selection is treated as a separate item</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export async function getServerSideProps() {
  try {
    const [productsData, attributes] = await Promise.all([
      ProductServices.getShowingStoreProducts({}),
      AttributeServices.getShowingAttributes()
    ]);

    return {
      props: {
        products: productsData?.products || [],
        attributes: attributes || []
      }
    };
  } catch (error) {
    console.error('Error fetching demo data:', error);
    return {
      props: {
        products: [],
        attributes: []
      }
    };
  }
}

export default MultiUnitDemo;