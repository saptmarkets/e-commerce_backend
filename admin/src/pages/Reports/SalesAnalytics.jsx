import React from 'react';
import PageTitle from '@/components/Typography/PageTitle';

const SalesAnalytics = () => {
  return (
    <>
      <PageTitle>Sales Analytics</PageTitle>
      
      <div className="min-h-screen px-6 mx-auto grid">
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">
                📊
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">
                Sales Analytics Dashboard
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Coming Soon! This comprehensive sales analytics system will provide deep insights into revenue trends, 
                product performance, customer segmentation, and sales forecasting.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Revenue Analytics</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Track revenue trends and performance</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Product Performance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Analyze top-selling products</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Customer Segmentation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Understand customer behavior</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesAnalytics; 