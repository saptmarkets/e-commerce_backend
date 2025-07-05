// 📦 Inventory Reports Dashboard - Task 3.2.1 Implementation
// 🎸 Comprehensive inventory analytics with stock levels, movement tracking, and valuation

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Badge, Input, Select, Label } from '@windmill/react-ui';
import { FiPackage, FiTrendingUp, FiAlertTriangle, FiDollarSign, FiBarChart2, FiDownload, FiFilter } from 'react-icons/fi';
import PageTitle from '@/components/Typography/PageTitle';
import SectionTitle from '@/components/Typography/SectionTitle';
import useUtilsFunction from '@/hooks/useUtilsFunction';
import httpService from '@/services/httpService';

const InventoryReports = () => {
  const { currency, getNumberTwo } = useUtilsFunction();

  // 📊 State Management
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    movements: [],
    velocity: [],
    valuation: null,
    abcAnalysis: []
  });

  // 🔍 Filter State
  const [filters, setFilters] = useState({
    lowStockThreshold: 10,
    period: 30,
    category: '',
    stockStatus: 'all', // all, in_stock, low_stock, out_of_stock
    classification: 'all', // all, fast, medium, slow
    valuationMethod: 'fifo',
    page: 1,
    limit: 50
  });

  // 📤 Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    reportType: 'overview',
    sections: {
      overview: true,
      movements: false,
      velocity: false,
      valuation: false,
      abcAnalysis: false
    }
  });

  // 📈 Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🎸 Fetching inventory dashboard data...');
      console.log('🎸 Request params:', {
        lowStockThreshold: filters.lowStockThreshold,
        period: filters.period
      });
      
      const response = await httpService.get('/reports/inventory/dashboard', {
        params: {
          lowStockThreshold: filters.lowStockThreshold,
          period: filters.period
        }
      });

      console.log('🎸 Full API Response:', response);
      console.log('🎸 Response Data:', response.data);

      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('✅ Dashboard data loaded successfully');
        console.log('🎸 Dashboard data structure:', response.data.data);
      } else {
        console.error('❌ Failed to load dashboard data');
        console.error('❌ Response:', response.data);
      }
    } catch (error) {
      console.error('🎸 Dashboard Error:', error);
      console.error('🎸 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Apply Filters
  const applyFilters = () => {
    fetchDashboardData();
  };

  // 📊 Get Overview KPIs
  const getOverviewKPIs = () => {
    if (!dashboardData.stockOverview?.overview) {
      return {
        totalProducts: 0,
        totalStockValue: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        inStockCount: 0
      };
    }
    return dashboardData.stockOverview.overview;
  };

  // 📈 Get Stock Items
  const getStockItems = () => {
    return dashboardData.stockOverview?.stockItems || [];
  };

  // 🚀 Get Movement Data
  const getMovementData = () => {
    return dashboardData.stockMovement?.movements || [];
  };

  // ⚡ Get Velocity Data
  const getVelocityData = () => {
    return dashboardData.velocityAnalysis?.velocityAnalysis || [];
  };

  // 💰 Get Valuation Data
  const getValuationData = () => {
    return dashboardData.inventoryValuation?.valuation || [];
  };

  // 📊 Get ABC Analysis Data
  const getABCAnalysisData = () => {
    return dashboardData.abcAnalysis?.abcAnalysis || [];
  };

  // 🎨 Helper Functions
  const getSafeText = (text) => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || '';
    }
    return text || '';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock': return 'red';
      case 'low_stock': return 'orange';
      case 'in_stock': return 'green';
      default: return 'gray';
    }
  };

  const getVelocityColor = (classification) => {
    switch (classification) {
      case 'fast': return 'green';
      case 'medium': return 'yellow';
      case 'slow': return 'red';
      default: return 'gray';
    }
  };

  const getABCColor = (classification) => {
    switch (classification) {
      case 'A': return 'green';
      case 'B': return 'yellow';
      case 'C': return 'red';
      default: return 'gray';
    }
  };

  // 📤 Export Functions
  const exportToCSV = async (reportType) => {
    try {
      const response = await httpService.get('/reports/inventory/export/advanced', {
        params: {
          format: 'csv',
          reportType,
          lowStockThreshold: filters.lowStockThreshold,
          period: filters.period
        }
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // 🔍 Test basic product availability
  const testBasicData = async () => {
    try {
      console.log('🎸 Testing basic inventory data availability...');
      
      // Test the simple overview endpoint
      const overviewResponse = await httpService.get('/reports/inventory/overview', {
        params: { lowStockThreshold: 10, limit: 5 }
      });
      
      console.log('🎸 Overview test response:', overviewResponse.data);
      
      // Test the legacy inventory endpoint
      const legacyResponse = await httpService.get('/reports/inventory');
      console.log('🎸 Legacy inventory response:', legacyResponse.data);
      
    } catch (error) {
      console.error('🎸 Basic data test error:', error);
    }
  };

  // 🎯 Load data on mount and when filters change
  useEffect(() => {
    testBasicData(); // Test first
    fetchDashboardData();
  }, []);

  // 📊 Get data for rendering
  const kpis = getOverviewKPIs();
  const stockItems = getStockItems();
  const movementData = getMovementData();
  const velocityData = getVelocityData();
  const valuationData = getValuationData();
  const abcData = getABCAnalysisData();

  return (
    <>
      <PageTitle>Inventory Reports</PageTitle>
      
      <div className="container mx-auto px-6 py-8">
        
        {/* 🎯 Filter Controls */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiFilter className="mr-2" />
                <h3 className="text-lg font-semibold">Filter Options</h3>
              </div>
              <Button onClick={applyFilters} disabled={loading}>
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={filters.lowStockThreshold}
                  onChange={(e) => setFilters({...filters, lowStockThreshold: parseInt(e.target.value)})}
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label>Analysis Period (Days)</Label>
                <Select
                  value={filters.period}
                  onChange={(e) => setFilters({...filters, period: parseInt(e.target.value)})}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                  <option value={180}>Last 180 Days</option>
                  <option value={365}>Last Year</option>
                </Select>
              </div>
              <div>
                <Label>Stock Status</Label>
                <Select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                >
                  <option value="all">All Items</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </Select>
              </div>
              <div>
                <Label>Valuation Method</Label>
                <Select
                  value={filters.valuationMethod}
                  onChange={(e) => setFilters({...filters, valuationMethod: e.target.value})}
                >
                  <option value="fifo">FIFO</option>
                  <option value="lifo">LIFO</option>
                  <option value="average">Average Cost</option>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 📊 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-500 mr-4">
                <FiPackage className="text-blue-500 dark:text-blue-100" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-semibold">{kpis.totalProducts || 0}</p>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-500 mr-4">
                <FiDollarSign className="text-green-500 dark:text-green-100" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock Value</p>
                <p className="text-2xl font-semibold">{currency}{getNumberTwo(kpis.totalStockValue || 0)}</p>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-500 mr-4">
                <FiAlertTriangle className="text-red-500 dark:text-red-100" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-semibold">{kpis.outOfStockCount || 0}</p>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-500 mr-4">
                <FiTrendingUp className="text-orange-500 dark:text-orange-100" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-semibold">{kpis.lowStockCount || 0}</p>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-500 mr-4">
                <FiBarChart2 className="text-emerald-500 dark:text-emerald-100" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Well Stocked</p>
                <p className="text-2xl font-semibold">{kpis.inStockCount || 0}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 📦 Stock Overview Table */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Stock Overview</SectionTitle>
              <Button size="small" onClick={() => exportToCSV('overview')}>
                <FiDownload className="mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Stock Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium">
                        {getSafeText(item.title) || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3">{item.sku || 'N/A'}</td>
                      <td className="px-4 py-3">{getSafeText(item.categoryName) || 'Uncategorized'}</td>
                      <td className="px-4 py-3">{item.stock || 0}</td>
                      <td className="px-4 py-3">{currency}{getNumberTwo(item.stockValue || 0)}</td>
                      <td className="px-4 py-3">
                        <Badge type={getStockStatusColor(item.stockStatus)}>
                          {item.stockStatus?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* 🚀 Stock Movement Table */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Recent Stock Movements</SectionTitle>
              <Button size="small" onClick={() => exportToCSV('movement')}>
                <FiDownload className="mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Movement</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movementData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium">
                        {getSafeText(item.productTitle) || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3">{item.sku || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge type={item.movementType === 'out' ? 'red' : 'green'}>
                          {item.movementType === 'out' ? 'Out' : 'In'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{item.quantity || 0}</td>
                      <td className="px-4 py-3">{currency}{getNumberTwo(item.totalValue || 0)}</td>
                      <td className="px-4 py-3">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* ⚡ Product Velocity Analysis */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Product Velocity Analysis</SectionTitle>
              <Button size="small" onClick={() => exportToCSV('velocity')}>
                <FiDownload className="mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Total Sold</th>
                    <th className="px-4 py-3">Velocity Score</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {velocityData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium">
                        {getSafeText(item.productTitle) || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3">{item.currentStock || 0}</td>
                      <td className="px-4 py-3">{item.totalSold || 0}</td>
                      <td className="px-4 py-3">{(item.velocityScore || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge type={getVelocityColor(item.velocityClassification)}>
                          {item.velocityClassification || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{currency}{getNumberTwo(item.totalRevenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* 📊 ABC Analysis */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>ABC Analysis</SectionTitle>
              <Button size="small" onClick={() => exportToCSV('abc')}>
                <FiDownload className="mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Revenue %</th>
                    <th className="px-4 py-3">Cumulative %</th>
                  </tr>
                </thead>
                <tbody>
                  {abcData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3">{item.rank || index + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        {getSafeText(item.productTitle) || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge type={getABCColor(item.classification)}>
                          {item.classification || 'C'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{currency}{getNumberTwo(item.totalRevenue || 0)}</td>
                      <td className="px-4 py-3">{(item.revenuePercentage || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3">{(item.cumulativePercentage || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* 💰 Inventory Valuation Summary */}
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Inventory Valuation Summary</SectionTitle>
              <Button size="small" onClick={() => exportToCSV('valuation')}>
                <FiDownload className="mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-300">Total Stock Value</p>
                <p className="text-2xl font-semibold text-blue-800 dark:text-blue-200">
                  {currency}{getNumberTwo(dashboardData.inventoryValuation?.totalValuation?.totalStockValue || 0)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-300">Potential Revenue</p>
                <p className="text-2xl font-semibold text-green-800 dark:text-green-200">
                  {currency}{getNumberTwo(dashboardData.inventoryValuation?.totalValuation?.potentialRevenue || 0)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-300">Potential Profit</p>
                <p className="text-2xl font-semibold text-purple-800 dark:text-purple-200">
                  {currency}{getNumberTwo(dashboardData.inventoryValuation?.totalValuation?.potentialProfit || 0)}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-300">Avg Stock Value</p>
                <p className="text-2xl font-semibold text-orange-800 dark:text-orange-200">
                  {currency}{getNumberTwo(dashboardData.inventoryValuation?.totalValuation?.averageStockValue || 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 📈 Applied Filters Display */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Current Filter Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Low Stock Threshold:</span> {filters.lowStockThreshold}
              </div>
              <div>
                <span className="font-medium">Analysis Period:</span> {filters.period} days
              </div>
              <div>
                <span className="font-medium">Stock Status:</span> {filters.stockStatus}
              </div>
              <div>
                <span className="font-medium">Valuation Method:</span> {filters.valuationMethod.toUpperCase()}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default InventoryReports; 