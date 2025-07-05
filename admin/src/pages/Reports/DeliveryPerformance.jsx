import React from 'react';
import PageTitle from '@/components/Typography/PageTitle';

const DeliveryPerformance = () => {
  return (
    <>
      <PageTitle>Delivery Performance</PageTitle>
      
      <div className="min-h-screen px-6 mx-auto grid">
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">
                🚚
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">
                Delivery Performance Dashboard
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Coming Soon! Complete delivery analytics including driver performance, 
                route optimization, delivery times, and customer satisfaction metrics.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Driver Performance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Monitor driver efficiency and ratings</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Route Optimization</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Analyze delivery routes and efficiency</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Delivery Times</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Track delivery time performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryPerformance; 