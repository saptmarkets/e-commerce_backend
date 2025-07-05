import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  CardBody,
  Button,
  Alert,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableBody
} from '@windmill/react-ui';
import { 
  HiRefresh as RefreshIcon, 
  HiDownload as DownloadIcon
} from 'react-icons/hi';
import PageTitle from '@/components/Typography/PageTitle';
import requests from '@/services/httpService';

/**
 * 📊 Sales Analytics Dashboard - Restored Version
 * Gradually rebuilding with proper error handling
 */
const SalesAnalytics = () => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [apiTestResults, setApiTestResults] = useState([]);

  // Get admin info from Redux store
  const { admin } = useSelector(state => state.auth);

  // Test API endpoints one by one
  const testApiEndpoint = useCallback(async (endpoint, name) => {
    try {
      console.log(`🔍 Testing ${name}: ${endpoint}`);
      const data = await requests.get(endpoint);
      return {
        name,
        endpoint,
        status: 'success',
        data: data ? 'Data received' : 'No data',
        error: null
      };
    } catch (err) {
      console.error(`❌ ${name} failed:`, err);
      return {
        name,
        endpoint,
        status: 'error',
        data: null,
        error: err.message
      };
    }
  }, []);

  // Test all sales analytics endpoints
  const testAllEndpoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setApiTestResults([]);

    console.log('🎸 Starting API endpoint tests...');

    const endpointsToTest = [
      { endpoint: 'reports/sales/overview', name: 'Sales Overview' },
      { endpoint: 'reports/sales/trends', name: 'Sales Trends' },
      { endpoint: 'reports/sales/products', name: 'Product Performance' },
      { endpoint: 'reports/sales/customers', name: 'Customer Analytics' },
      { endpoint: 'reports/sales/geographic', name: 'Geographic Data' },
      { endpoint: 'reports/sales/payment-methods', name: 'Payment Methods' }
    ];

    const results = [];
    
    for (const { endpoint, name } of endpointsToTest) {
      const result = await testApiEndpoint(endpoint, name);
      results.push(result);
      setApiTestResults([...results]); // Update UI as we go
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('🎸 API testing complete!');
    setIsLoading(false);
  }, [testApiEndpoint]);

  // Test on component mount
  useEffect(() => {
    console.log('🎸 Sales Analytics component mounted successfully!');
    testAllEndpoints();
  }, [testAllEndpoints]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setApiTestResults([]);
    testAllEndpoints();
  }, [testAllEndpoints]);

  // Get status badge color
  const getStatusBadge = (status) => {
    return status === 'success' 
      ? <Badge type="success">✅ Working</Badge>
      : <Badge type="danger">❌ Error</Badge>;
  };

  return (
    <>
      <PageTitle>Sales Analytics - API Testing</PageTitle>
      
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              🎸 Sales Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Testing API endpoints and rebuilding functionality
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              size="small"
              layout="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              {isLoading ? 'Testing...' : 'Test APIs'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="danger" className="mb-6">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* API Test Results */}
      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            🔧 API Endpoint Testing Results
          </h2>
          
          {isLoading && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              Testing API endpoints... 🎸
            </div>
          )}

          {apiTestResults.length > 0 && (
            <TableContainer className="mb-4">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response</TableCell>
                    <TableCell>Error</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {apiTestResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{result.name}</div>
                          <div className="text-sm text-gray-500">{result.endpoint}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(result.status)}
                      </TableCell>
                      <TableCell>
                        {result.data || '-'}
                      </TableCell>
                      <TableCell>
                        {result.error ? (
                          <span className="text-red-600 text-sm">{result.error}</span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">Elvis Says:</h3>
            <p className="text-gray-600 italic">
              "Thank you, thank you very much! We're testing these APIs one by one, baby!" 🎤
            </p>
            <div className="mt-2 text-sm text-gray-500">
              Component Status: ✅ Working perfectly! 🎸
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default SalesAnalytics; 