import React from 'react';
import PageTitle from '@/components/Typography/PageTitle';

const CustomerInsights = () => {
  return (
    <>
      <PageTitle>Customer Insights</PageTitle>
      
      <div className="min-h-screen px-6 mx-auto grid">
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">
                👥
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">
                Customer Insights Dashboard
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Coming Soon! Deep customer analytics including behavior analysis, 
                lifetime value calculations, retention metrics, and personalized recommendations.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Behavior Analysis</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Understand customer purchasing patterns</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Lifetime Value</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Calculate customer lifetime value</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Retention Metrics</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Track customer retention rates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerInsights; 