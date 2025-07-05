// 🎸 Sales Analytics Dashboard - Fixed Data Handling Version
// Focuses on working with actual API responses and avoiding crashes

import React, { useState, useEffect, useContext } from 'react';
import { Card, CardBody, Button, Badge } from '@windmill/react-ui';
import { HiRefresh, HiDownload, HiTrendingUp, HiTrendingDown, HiUsers, HiShoppingCart, HiCash, HiEye, HiX, HiCheck } from 'react-icons/hi';
import requests from '@/services/httpService';
import { SidebarContext } from '@/context/SidebarContext';
import useUtilsFunction from '@/hooks/useUtilsFunction';

const SalesAnalytics = () => {
  const { currency, getNumberTwo } = useUtilsFunction();
  
  // 🎸 State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    trends: null,
    paymentMethods: null,
    topProducts: null,
    categories: null
  });

  // 🎸 Filter State
  const [filters, setFilters] = useState({
    period: 'daily', // daily, weekly, monthly
    month: new Date().getMonth() + 1, // 1-12
    year: new Date().getFullYear(),
    startDate: null,
    endDate: null
  });

  // 🎸 Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    dateRange: 'all',
    data: {
      overview: true,
      trends: true,
      paymentMethods: true,
      topProducts: true,
      categories: true
    }
  });

  // 🎸 Helper function to get date range based on filters
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (filters.period) {
      case 'daily':
        // Last 30 days
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      
      case 'weekly':
        // Last 12 weeks
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (12 * 7));
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      
      case 'monthly':
        // Specific month and year
        startDate = new Date(filters.year, filters.month - 1, 1);
        endDate = new Date(filters.year, filters.month, 0); // Last day of month
        break;
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // 🎸 Fetch data with filters
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎸 Fetching dashboard data from working endpoints...');
      
      const dateRange = getDateRange();
      const queryParams = new URLSearchParams({
        period: filters.period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const results = {};
      
      // Fetch all data with filters
      try {
        const response = await requests.get(`/reports/sales/overview?${queryParams}`);
        results.overview = response;
        console.log('🎸 Overview data:', response);
      } catch (err) {
        console.error('🎸 Overview error:', err);
        results.overview = null;
      }

      try {
        const response = await requests.get(`/reports/sales/trends?${queryParams}`);
        results.trends = response;
        console.log('🎸 Trends data:', response);
      } catch (err) {
        console.error('🎸 Trends error:', err);
        results.trends = null;
      }

      try {
        const response = await requests.get(`/reports/sales/payment-methods?${queryParams}`);
        results.paymentMethods = response;
        console.log('🎸 Payment methods data:', response);
      } catch (err) {
        console.error('🎸 Payment methods error:', err);
        results.paymentMethods = null;
      }

      try {
        const response = await requests.get(`/reports/sales/top-products?${queryParams}`);
        console.log('🎸 Top products data:', response);
        results.topProducts = response;
      } catch (err) {
        console.error('🎸 Top products error:', err);
        results.topProducts = null;
      }

      try {
        const response = await requests.get(`/reports/sales/categories?${queryParams}`);
        console.log('🎸 Categories data:', response);
        results.categories = response;
      } catch (err) {
        console.error('🎸 Categories error:', err);
        results.categories = null;
      }

      console.log('🎸 All data fetched successfully!', results);
      setDashboardData(results);
      
    } catch (error) {
      console.error('🎸 Dashboard fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  // 🎸 Filter Change Handlers
  const handlePeriodChange = (newPeriod) => {
    setFilters(prev => ({
      ...prev,
      period: newPeriod
    }));
  };

  const handleMonthChange = (month) => {
    setFilters(prev => ({
      ...prev,
      month: parseInt(month)
    }));
  };

  const handleYearChange = (year) => {
    setFilters(prev => ({
      ...prev,
      year: parseInt(year)
    }));
  };

  // 🎸 Refresh and Export handlers
  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = () => {
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
      if (!data || data.length === 0) {
        console.log('🎸 No data to export');
        alert('No data available to export');
        return;
      }

      const headers = Object.keys(data[0]);
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Analytics Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: #f9f9f9; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding: 20px; 
              background: white; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header h1 { 
              color: #333; 
              margin: 0; 
              font-size: 24px; 
            }
            .header p { 
              color: #666; 
              margin: 5px 0 0 0; 
            }
            .content { 
              background: white; 
              padding: 20px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold; 
              color: #333;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding: 20px; 
              background: white; 
              border-radius: 10px; 
              color: #666; 
              font-size: 12px; 
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #333; 
              margin: 20px 0 10px 0; 
            }
            .stats { 
              display: flex; 
              justify-content: space-around; 
              margin-bottom: 20px; 
            }
            .stat-item { 
              text-align: center; 
              padding: 10px; 
            }
            .stat-value { 
              font-size: 20px; 
              font-weight: bold; 
              color: #4A90E2; 
            }
            .stat-label { 
              font-size: 12px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Sales Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="content">
            <div class="section-title">📈 ${filename.replace('sales-analytics-', '').replace('-' + new Date().toISOString().split('T')[0], '').toUpperCase()}</div>
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <div>📊 Generated by SaptMarkets Analytics System</div>
            <div>Report Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.html`;
      link.click();
      
      console.log('📊 HTML export successful!');
      
    } catch (error) {
      console.error('📊 Export failed:', error);
      alert('Export failed. Please try CSV format.');
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
        'Payment Method': getSafeText(item.paymentMethod || item.method) || 'Unknown',
        'Revenue': formatCurrency(item.totalRevenue || item.revenue || 0),
        'Orders': formatNumber(item.totalOrders || item.orders || 0)
      }));
    }
    
    if (exportOptions.data.topProducts && topProductsData.length > 0) {
      exportData.topProducts = topProductsData.map(product => ({
        'Product Name': getSafeText(product.productName || product.name || product.title) || 'Unknown Product',
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
        'Category Name': getSafeText(category.categoryName || category.name) || 'Unknown Category',
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
    if (currency === '\uE900' || currency.includes('SAR') || currency.includes('riyal')) {
      return `${currency}${getNumberTwo(amount || 0)}`;
    }
    return `${currency}${getNumberTwo(amount || 0)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // 🎸 Helper function to safely get text from localization objects
  const getSafeText = (text) => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || '';
    }
    return text || '';
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

  // 🎸 Get data for rendering
  const kpis = getOverviewKPIs();
  const trendsData = getTrendsData();
  const paymentMethodsData = getPaymentMethodsData();
  const topProductsData = getTopProductsData();
  const categorySalesData = getCategorySalesData();

  // 🎸 Render Filter Controls
  const renderFilterControls = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' }
    ];

    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📅 Report Filters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period
              </label>
              <select
                value={filters.period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="daily">Daily (Last 30 days)</option>
                <option value="weekly">Weekly (Last 12 weeks)</option>
                <option value="monthly">Monthly (Specific month)</option>
              </select>
            </div>

            {/* Month Selection (only for monthly period) */}
            {filters.period === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Selection (only for monthly period) */}
            {filters.period === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Apply Filter Button */}
            <div className="flex items-end">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <HiRefresh className={loading ? 'animate-spin' : ''} />
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
          </div>

          {/* Current Filter Display */}
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Current Filter:</strong> {' '}
              {filters.period === 'daily' && 'Daily reports for last 30 days'}
              {filters.period === 'weekly' && 'Weekly reports for last 12 weeks'}
              {filters.period === 'monthly' && `Monthly report for ${months.find(m => m.value === filters.month)?.label} ${filters.year}`}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 🎸 Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📊 Sales Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time sales performance insights with advanced filtering
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

      {/* 🎸 Filter Controls */}
      <div className="mb-8">
        {renderFilterControls()}
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
                        <td className="py-2 font-medium">{getSafeText(item.paymentMethod || item.method) || 'Unknown'}</td>
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
                        {getSafeText(product.productName || product.name || product.title) || 'Unknown Product'}
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
                        {getSafeText(category.categoryName || category.name) || 'Unknown Category'}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAnalytics; 