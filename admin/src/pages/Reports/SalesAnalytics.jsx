import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  CardBody,
  Button
} from '@windmill/react-ui';
import PageTitle from '@/components/Typography/PageTitle';

/**
 * 📊 Sales Analytics Dashboard - Minimal Test Version
 * Testing basic component loading without complex imports
 */
const SalesAnalytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple test function
  const testFunction = useCallback(() => {
    console.log('🎸 Elvis lives! Component is working!');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setError(null);
    }, 1000);
  }, []);

  // Test useEffect
  useEffect(() => {
    console.log('🎸 Component mounted successfully!');
    testFunction();
  }, [testFunction]);

  return (
    <>
      <PageTitle>Sales Analytics - Test Version</PageTitle>
      
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              🎸 Sales Analytics Test Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Testing component loading - Elvis would be proud!
            </p>
          </div>
          <Button
            size="small"
            layout="outline"
            onClick={testFunction}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Test Button'}
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            🔧 Component Status
          </h2>
          <div className="space-y-2">
            <p className="text-green-600">✅ React hooks working</p>
            <p className="text-green-600">✅ useState working</p>
            <p className="text-green-600">✅ useEffect working</p>
            <p className="text-green-600">✅ useCallback working</p>
            <p className="text-green-600">✅ Component rendered successfully</p>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              Loading... 🎸
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">Elvis Says:</h3>
            <p className="text-gray-600 italic">
              "Thank you, thank you very much! The component is working beautifully!" 🎤
            </p>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default SalesAnalytics; 