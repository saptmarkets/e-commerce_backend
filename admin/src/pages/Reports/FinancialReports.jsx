import React from 'react';
import PageTitle from '@/components/Typography/PageTitle';

const FinancialReports = () => {
  return (
    <>
      <PageTitle>Financial Reports</PageTitle>
      
      <div className="min-h-screen px-6 mx-auto grid">
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">
                💰
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">
                Financial Reports Dashboard
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Coming Soon! Comprehensive financial analytics including P&L statements, 
                cash flow analysis, payment performance, and revenue projections.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">P&L Analysis</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Profit and Loss statements</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Cash Flow</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Track cash flow patterns</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">Payment Performance</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Monitor payment processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialReports; 