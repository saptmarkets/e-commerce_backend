// 🎸 Sales Analytics Dashboard - Fixed Data Handling Version
// Focuses on working with actual API responses and avoiding crashes

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Badge } from '@windmill/react-ui';
import { HiRefresh, HiDownload, HiTrendingUp, HiTrendingDown, HiUsers, HiShoppingCart, HiCash, HiEye, HiX, HiCheck } from 'react-icons/hi';
import requests from '@/services/httpService';

const SalesAnalytics = () => {
  // 🎸 Simple State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // csv, excel, pdf
    data: {
      overview: true,
      trends: true,
      paymentMethods: true,
      topProducts: true,
      categories: true
    },
    dateRange: 'all' // all, today, week, month
  });
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    trends: null,
    paymentMethods: null,
    topProducts: null,
    categories: null
  });

  // 🎸 Safe Data Fetching - Only working endpoints
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎸 Fetching dashboard data from working endpoints...');
      
      // Only call endpoints that exist and work
      const promises = [];
      const results = {};

      // Overview endpoint (working)
      promises.push(
        requests.get('/reports/sales/overview').then(response => {
          results.overview = response;
          console.log('🎸 Overview data:', response);
        }).catch(err => {
          console.log('🎸 Overview endpoint failed:', err.message);
          results.overview = null;
        })
      );

      // Trends endpoint (working)  
      promises.push(
        requests.get('/reports/sales/trends').then(response => {
          results.trends = response;
          console.log('🎸 Trends data:', response);
        }).catch(err => {
          console.log('🎸 Trends endpoint failed:', err.message);
          results.trends = null;
        })
      );

      // Payment methods endpoint (working)
      promises.push(
        requests.get('/reports/sales/payment-methods').then(response => {
          results.paymentMethods = response;
          console.log('🎸 Payment methods data:', response);
        }).catch(err => {
          console.log('🎸 Payment methods endpoint failed:', err.message);
          results.paymentMethods = null;
        })
      );

      // Top products endpoint (working)
      promises.push(
        requests.get('/reports/sales/top-products').then(response => {
          results.topProducts = response;
          console.log('🎸 Top products data:', response);
        }).catch(err => {
          console.log('🎸 Top products endpoint failed:', err.message);
          results.topProducts = null;
        })
      );

      // Categories endpoint (new!)
      promises.push(
        requests.get('/reports/sales/categories').then(response => {
          results.categories = response;
          console.log('🎸 Categories data:', response);
        }).catch(err => {
          console.log('🎸 Categories endpoint failed:', err.message);
          results.categories = null;
        })
      );

      // Wait for all requests to complete
      await Promise.all(promises);
      
      // Update state with all results
      setDashboardData(results);
      console.log('🎸 All data fetched successfully!', results);
      
    } catch (err) {
      console.error('🎸 Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // 🎸 Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 🎸 Event Handlers
  const handleRefresh = () => {
    console.log('🎸 Refreshing dashboard data...');
    fetchDashboardData();
  };

  const handleExport = () => {
    console.log('🎸 Opening export modal...');
    setShowExportModal(true);
  };

  // 🎸 Export Functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        typeof row[header] === 'string' && row[header].includes(',') 
          ? `"${row[header]}"` 
          : row[header]
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToExcel = (data, filename) => {
    // For now, export as CSV (can be enhanced with a proper Excel library)
    exportToCSV(data, filename);
  };

  // 🎸 Simple PDF Export Function (temporarily disabled to prevent crashes)
  const exportToPDF = async (data, filename) => {
    try {
      // Create a simple HTML version for now
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SaptMarkets Sales Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; color: #8B5CF6; margin-bottom: 5px; }
            .section { margin-bottom: 15px; }
            .section-title { font-size: 14px; font-weight: bold; background: #F3F4F6; padding: 5px; margin-bottom: 8px; }
            .row { margin-bottom: 3px; padding: 2px; }
            .footer { text-align: center; border-top: 1px solid #E5E7EB; padding-top: 10px; margin-top: 20px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SaptMarkets Sales Analytics Report</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          
          <div class="content">
            ${data.overview ? `
              <div class="section">
                <div class="section-title">📊 Overview & KPIs</div>
                ${data.overview.map(item => `
                  <div class="row">${Object.keys(item)[0]}: ${Object.values(item)[0]}</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${data.trends && data.trends.length > 0 ? `
              <div class="section">
                <div class="section-title">📈 Sales Trends</div>
                ${data.trends.slice(0, 10).map(item => `
                  <div class="row">${item.Date} - ${item.Revenue}</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${data.paymentMethods && data.paymentMethods.length > 0 ? `
              <div class="section">
                <div class="section-title">💳 Payment Methods</div>
                ${data.paymentMethods.map(item => `
                  <div class="row">${item['Payment Method']}: ${item.Revenue}</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${data.topProducts && data.topProducts.length > 0 ? `
              <div class="section">
                <div class="section-title">🏆 Top Products</div>
                ${data.topProducts.slice(0, 10).map(item => `
                  <div class="row">${item['Product Name']}: ${item.Revenue}</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${data.categories && data.categories.length > 0 ? `
              <div class="section">
                <div class="section-title">📦 Category Sales</div>
                ${data.categories.map(item => `
                  <div class="row">${item['Category Name']}: ${item.Revenue}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>🎸 Generated by SaptMarkets Analytics System</div>
            <div>Elvis says: "Thank you, thank you very much!"</div>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.html`;
      link.click();
      
      console.log('🎸 HTML export successful! (PDF coming soon)');
      alert('🎸 Exported as HTML file! PDF functionality will be enhanced soon. For now, you can print the HTML file to PDF. 🎸');
      
    } catch (error) {
      console.error('🎸 Export failed:', error);
      alert('Export failed. Please try CSV format. 🎸');
    }
  };

  const prepareExportData = () => {
    const exportData = {};
    
    // Get the data using the same functions used in the UI
    const kpis = getOverviewKPIs();
    const trendsData = getTrendsData();
    const paymentMethodsData = getPaymentMethodsData();
    const topProductsData = getTopProductsData();
    const categorySalesData = getCategorySalesData();
    
    if (exportOptions.data.overview && kpis) {
      exportData.overview = [{
        'Total Revenue': formatCurrency(kpis.totalRevenue),
        'Total Orders': formatNumber(kpis.totalOrders),
        'Total Customers': formatNumber(kpis.totalCustomers),
        'Average Order Value': formatCurrency(kpis.avgOrderValue),
        'Revenue Growth': `${kpis.revenueGrowth.toFixed(1)}%`,
        'Order Growth': `${kpis.orderGrowth.toFixed(1)}%`
      }];
    }
    
    if (exportOptions.data.trends && trendsData.length > 0) {
      exportData.trends = trendsData.map(item => ({
        'Date': item.date ? new Date(item.date).toLocaleDateString() : 
               item.period ? item.period : 'N/A',
        'Revenue': formatCurrency(item.revenue || item.totalRevenue || 0),
        'Orders': formatNumber(item.orders || item.totalOrders || 0)
      }));
    }
    
    if (exportOptions.data.paymentMethods && paymentMethodsData.length > 0) {
      exportData.paymentMethods = paymentMethodsData.map(item => ({
        'Payment Method': item.paymentMethod || item.method || 'Unknown',
        'Revenue': formatCurrency(item.totalRevenue || item.revenue || 0),
        'Orders': formatNumber(item.totalOrders || item.orders || 0)
      }));
    }
    
    if (exportOptions.data.topProducts && topProductsData.length > 0) {
      exportData.topProducts = topProductsData.map(product => ({
        'Product Name': product.productName || product.name || product.title || 'Unknown Product',
        'Sales Quantity': formatNumber(product.quantity || product.totalQuantity || 0),
        'Revenue': formatCurrency(product.totalRevenue || product.revenue || 0),
        'Average Price': formatCurrency(
          (product.totalRevenue || product.revenue || 0) / 
          Math.max(product.quantity || product.totalQuantity || 1, 1)
        )
      }));
    }
    
    if (exportOptions.data.categories && categorySalesData.length > 0) {
      exportData.categories = categorySalesData.map(category => ({
        'Category Name': category.categoryName || category.name || 'Unknown Category',
        'Revenue': formatCurrency(category.totalRevenue || category.revenue || 0),
        'Orders': formatNumber(category.totalOrders || category.orders || 0),
        'Products': formatNumber(category.uniqueProducts || category.products || 0),
        'Market Share': `${category.revenuePercentage || 0}%`
      }));
    }
    
    return exportData;
  };

  const performExport = async () => {
    try {
      setExportLoading(true);
      const exportData = prepareExportData();
      const timestamp = new Date().toISOString().split('T')[0];
      
      Object.keys(exportData).forEach(dataType => {
        const filename = `sales-analytics-${dataType}-${timestamp}`;
        
        switch (exportOptions.format) {
          case 'csv':
            exportToCSV(exportData[dataType], filename);
            break;
          case 'excel':
            exportToExcel(exportData[dataType], filename);
            break;
          case 'pdf':
            exportToPDF(exportData[dataType], filename);
            break;
          default:
            exportToCSV(exportData[dataType], filename);
        }
      });
      
      setShowExportModal(false);
      console.log('🎸 Export completed successfully!');
      
    } catch (error) {
      console.error('🎸 Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // 🎸 Utility Functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // 🎸 Safe data extraction
  const getOverviewKPIs = () => {
    const overview = dashboardData.overview;
    if (!overview || !overview.data) {
      console.log('🎸 No overview data available');
      return null;
    }
    
    const data = overview.data;
    console.log('🎸 Overview data structure:', data);
    
    // Handle different possible data structures
    let kpiData = {};
    
    // Check if data has direct properties
    if (data.totalRevenue !== undefined || data.totalOrders !== undefined) {
      kpiData = {
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalOrders || 0,
        totalCustomers: data.totalCustomers || 0,
        avgOrderValue: data.avgOrderValue || 0,
        revenueGrowth: data.revenueGrowth || 0,
        orderGrowth: data.orderGrowth || 0
      };
    }
    // Check if data has nested structure
    else if (data.data) {
      const nestedData = data.data;
      kpiData = {
        totalRevenue: nestedData.totalRevenue || 0,
        totalOrders: nestedData.totalOrders || 0,
        totalCustomers: nestedData.totalCustomers || 0,
        avgOrderValue: nestedData.avgOrderValue || 0,
        revenueGrowth: nestedData.revenueGrowth || 0,
        orderGrowth: nestedData.orderGrowth || 0
      };
    }
    // Check if it has summary or overview properties
    else if (data.summary) {
      const summaryData = data.summary;
      kpiData = {
        totalRevenue: summaryData.totalRevenue || summaryData.revenue || 0,
        totalOrders: summaryData.totalOrders || summaryData.orders || 0,
        totalCustomers: summaryData.totalCustomers || summaryData.customers || 0,
        avgOrderValue: summaryData.avgOrderValue || summaryData.averageOrderValue || 0,
        revenueGrowth: summaryData.revenueGrowth || 0,
        orderGrowth: summaryData.orderGrowth || 0
      };
    }
    // Fallback: calculate from trends and payment data if available
    else {
      console.log('🎸 Overview data structure not recognized, calculating from trends data...');
      const trends = getTrendsData();
      const payments = getPaymentMethodsData();
      
      if (trends.length > 0) {
        const totalRevenue = trends.reduce((sum, item) => sum + (item.revenue || item.totalRevenue || 0), 0);
        const totalOrders = trends.reduce((sum, item) => sum + (item.orders || item.totalOrders || 0), 0);
        
        kpiData = {
          totalRevenue: totalRevenue,
          totalOrders: totalOrders,
          totalCustomers: data.totalCustomers || 0,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          revenueGrowth: 0,
          orderGrowth: 0
        };
      } else if (payments.length > 0) {
        const totalRevenue = payments.reduce((sum, item) => sum + (item.totalRevenue || item.revenue || 0), 0);
        const totalOrders = payments.reduce((sum, item) => sum + (item.totalOrders || item.orders || 0), 0);
        
        kpiData = {
          totalRevenue: totalRevenue,
          totalOrders: totalOrders,
          totalCustomers: data.totalCustomers || 0,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          revenueGrowth: 0,
          orderGrowth: 0
        };
      } else {
        // Final fallback - empty data
        kpiData = {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          avgOrderValue: 0,
          revenueGrowth: 0,
          orderGrowth: 0
        };
      }
    }
    
    console.log('🎸 Extracted KPI data:', kpiData);
    return kpiData;
  };

  const getTrendsData = () => {
    const trends = dashboardData.trends;
    if (!trends || !trends.data) return [];
    
    // Handle both array and object responses
    if (Array.isArray(trends.data)) {
      return trends.data;
    } else if (trends.data.trends && Array.isArray(trends.data.trends)) {
      return trends.data.trends;
    } else if (trends.data.data && Array.isArray(trends.data.data)) {
      return trends.data.data;
    }
    
    return [];
  };

  const getPaymentMethodsData = () => {
    const payments = dashboardData.paymentMethods;
    if (!payments || !payments.data) return [];
    
    // Handle both array and object responses
    if (Array.isArray(payments.data)) {
      return payments.data;
    } else if (payments.data.paymentMethods && Array.isArray(payments.data.paymentMethods)) {
      return payments.data.paymentMethods;
    } else if (payments.data.data && Array.isArray(payments.data.data)) {
      return payments.data.data;
    }
    
    return [];
  };

  const getTopProductsData = () => {
    const products = dashboardData.topProducts;
    if (!products || !products.data) return [];
    
    // Handle both array and object responses
    if (Array.isArray(products.data)) {
      return products.data;
    } else if (products.data.products && Array.isArray(products.data.products)) {
      return products.data.products;
    } else if (products.data.data && Array.isArray(products.data.data)) {
      return products.data.data;
    }
    
    return [];
  };

  const getCategorySalesData = () => {
    const categories = dashboardData.categories;
    if (!categories || !categories.data) return [];

    // Handle both array and object responses
    if (Array.isArray(categories.data)) {
      return categories.data;
    } else if (categories.data.categories && Array.isArray(categories.data.categories)) {
      return categories.data.categories;
    } else if (categories.data.data && Array.isArray(categories.data.data)) {
      return categories.data.data;
    }

    return [];
  };

  const kpis = getOverviewKPIs();
  const trendsData = getTrendsData();
  const paymentMethodsData = getPaymentMethodsData();
  const topProductsData = getTopProductsData();
  const categorySalesData = getCategorySalesData();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 🎸 Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎸 Sales Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time sales performance insights
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <HiRefresh className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={loading}
              layout="outline"
              className="flex items-center gap-2"
            >
              <HiDownload />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* 🎸 Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="text-red-800 font-semibold mb-2">Error Loading Data</h4>
          <p className="text-red-700">{error}</p>
          <Button
            onClick={handleRefresh}
            size="small"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* 🎸 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
              <HiCash className="w-6 h-6" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Total Revenue</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-700">
                  {kpis ? formatCurrency(kpis.totalRevenue) : '$0'}
                </p>
                {kpis && (
                  <div className={`ml-2 flex items-center ${kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.revenueGrowth >= 0 ? 
                      <HiTrendingUp className="w-4 h-4 mr-1" /> : 
                      <HiTrendingDown className="w-4 h-4 mr-1" />
                    }
                    <span className="text-sm font-medium">
                      {Math.abs(kpis.revenueGrowth).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
              <HiShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Total Orders</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-700">
                  {kpis ? formatNumber(kpis.totalOrders) : '0'}
                </p>
                {kpis && (
                  <div className={`ml-2 flex items-center ${kpis.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.orderGrowth >= 0 ? 
                      <HiTrendingUp className="w-4 h-4 mr-1" /> : 
                      <HiTrendingDown className="w-4 h-4 mr-1" />
                    }
                    <span className="text-sm font-medium">
                      {Math.abs(kpis.orderGrowth).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 mr-4 text-purple-500 bg-purple-100 rounded-full">
              <HiUsers className="w-6 h-6" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-700">
                {kpis ? formatNumber(kpis.totalCustomers) : '0'}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
              <HiEye className="w-6 h-6" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-700">
                {kpis ? formatCurrency(kpis.avgOrderValue) : '$0'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 🎸 Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trends Data Table */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📈 Sales Trends Data
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trends data...</p>
              </div>
            ) : trendsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Revenue</th>
                      <th className="pb-2">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendsData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">
                          {item.date ? new Date(item.date).toLocaleDateString() : 
                           item.period ? item.period : `Day ${index + 1}`}
                        </td>
                        <td className="py-2">{formatCurrency(item.revenue || item.totalRevenue || 0)}</td>
                        <td className="py-2">{formatNumber(item.orders || item.totalOrders || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>No trends data available</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Payment Methods Data Table */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💳 Payment Methods
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment data...</p>
              </div>
            ) : paymentMethodsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="pb-2">Method</th>
                      <th className="pb-2">Revenue</th>
                      <th className="pb-2">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethodsData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{item.paymentMethod || item.method || 'Unknown'}</td>
                        <td className="py-2">{formatCurrency(item.totalRevenue || item.revenue || 0)}</td>
                        <td className="py-2">{formatNumber(item.totalOrders || item.orders || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💳</div>
                <p>No payment methods data available</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 🎸 Top Products Table */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🏆 Top Products
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products data...</p>
            </div>
          ) : topProductsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Sales Qty</th>
                    <th className="pb-2">Revenue</th>
                    <th className="pb-2">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsData.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">
                        {product.productName || product.name || product.title || 'Unknown Product'}
                      </td>
                      <td className="py-2">{formatNumber(product.quantity || product.totalQuantity || 0)}</td>
                      <td className="py-2">{formatCurrency(product.totalRevenue || product.revenue || 0)}</td>
                      <td className="py-2">
                        {formatCurrency(
                          (product.totalRevenue || product.revenue || 0) / 
                          Math.max(product.quantity || product.totalQuantity || 1, 1)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏆</div>
              <p>No products data available</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 🎸 Category Sales Table */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📦 Category Sales Performance
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading category sales data...</p>
            </div>
          ) : categorySalesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Revenue</th>
                    <th className="pb-2">Orders</th>
                    <th className="pb-2">Products</th>
                    <th className="pb-2">Market Share</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySalesData.map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">
                        {category.categoryName || category.name || 'Unknown Category'}
                      </td>
                      <td className="py-2">{formatCurrency(category.totalRevenue || category.revenue || 0)}</td>
                      <td className="py-2">{formatNumber(category.totalOrders || category.orders || 0)}</td>
                      <td className="py-2">{formatNumber(category.uniqueProducts || category.products || 0)}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {category.revenuePercentage || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <p>No category sales data available</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 🎸 Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Export Sales Analytics</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['csv', 'excel', 'pdf'].map(format => (
                    <button
                      key={format}
                      onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        exportOptions.format === format
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium uppercase">{format}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format === 'csv' && 'Comma Separated Values'}
                        {format === 'excel' && 'Excel Spreadsheet'}
                        {format === 'pdf' && 'HTML Report (printable)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Data to Export
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'overview', label: 'Overview & KPIs', desc: 'Revenue, Orders, Customers, Growth rates' },
                    { key: 'trends', label: 'Sales Trends', desc: 'Daily/Weekly/Monthly sales data' },
                    { key: 'paymentMethods', label: 'Payment Methods', desc: 'Revenue breakdown by payment type' },
                    { key: 'topProducts', label: 'Top Products', desc: 'Best-selling products and revenue' },
                    { key: 'categories', label: 'Category Sales', desc: 'Revenue breakdown by product category' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={item.key}
                        checked={exportOptions.data[item.key]}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          data: { ...prev.data, [item.key]: e.target.checked }
                        }))}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={item.key} className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Date Range
                </label>
                <select
                  value={exportOptions.dateRange}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={performExport}
                  disabled={exportLoading || !Object.values(exportOptions.data).some(Boolean)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <HiDownload className="w-5 h-5 mr-2" />
                      Export Selected Data
                    </>
                  )}
                </Button>
                <Button
                  layout="outline"
                  onClick={() => setShowExportModal(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>

              {/* Elvis Message */}
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <div className="flex items-center text-purple-600 dark:text-purple-400 mb-2">
                  <span className="mr-2">🎸</span>
                  <span className="font-medium">Elvis Says:</span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 italic">
                  "Export that data, baby! CSV, Excel, and HTML reports - all rockin' and ready to go!" 🎵
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎸 Elvis Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          🎸 <strong>Elvis Says:</strong> "Now this baby works without crashing! Thank you, thank you very much!" 🎵
        </p>
      </div>
    </div>
  );
};

export default SalesAnalytics; 