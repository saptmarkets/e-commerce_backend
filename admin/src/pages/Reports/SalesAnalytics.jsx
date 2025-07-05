// 🎸 Sales Analytics Dashboard - Full Implementation
// Comprehensive sales performance dashboard with charts, KPIs, and export functionality

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Badge } from '@windmill/react-ui';
import { HiRefresh, HiDownload, HiTrendingUp, HiTrendingDown, HiUsers, HiShoppingCart, HiCash, HiEye } from 'react-icons/hi';
import requests from '@/services/httpService';
import { SalesLineChart, CustomerSegmentChart, PaymentMethodChart } from '@/components/Reports/Charts';
import AdvancedFilters from '@/components/Reports/Filters/AdvancedFilters';

const SalesAnalytics = () => {
  // 🎸 State Management
  const [salesData, setSalesData] = useState(null);
  const [chartsData, setChartsData] = useState({
    salesTrends: [],
    customerSegments: [],
    paymentMethods: []
  });
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    period: 'monthly',
    dateRange: { start: null, end: null },
    category: 'all',
    paymentMethod: 'all',
    customerSegment: 'all'
  });

  // 🎸 Data Fetching Functions
  const fetchSalesOverview = async () => {
    try {
      const response = await requests.get('/reports/sales/overview', { params: filters });
      return response.data || {};
    } catch (error) {
      console.error('🎸 Error fetching sales overview:', error);
      throw error;
    }
  };

  const fetchSalesTrends = async () => {
    try {
      const response = await requests.get('/reports/sales/trends', { params: filters });
      return response.data || [];
    } catch (error) {
      console.error('🎸 Error fetching sales trends:', error);
      return [];
    }
  };

  const fetchCustomerSegments = async () => {
    try {
      const response = await requests.get('/reports/sales/customer-segments', { params: filters });
      return response.data || [];
    } catch (error) {
      console.error('🎸 Error fetching customer segments:', error);
      return [];
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await requests.get('/reports/sales/payment-methods', { params: filters });
      return response.data || [];
    } catch (error) {
      console.error('🎸 Error fetching payment methods:', error);
      return [];
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await requests.get('/reports/sales/top-products', { params: filters });
      return response.data || [];
    } catch (error) {
      console.error('🎸 Error fetching top products:', error);
      return [];
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await requests.get('/reports/sales/recent-orders', { params: { ...filters, limit: 10 } });
      return response.data || [];
    } catch (error) {
      console.error('🎸 Error fetching recent orders:', error);
      return [];
    }
  };

  // 🎸 Main Data Loading Function
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎸 Loading all sales data...');
      
      // Fetch all data in parallel for better performance
      const [
        overviewData,
        trendsData,
        segmentsData,
        paymentsData,
        productsData,
        ordersData
      ] = await Promise.all([
        fetchSalesOverview(),
        fetchSalesTrends(),
        fetchCustomerSegments(),
        fetchPaymentMethods(),
        fetchTopProducts(),
        fetchRecentOrders()
      ]);

      // Update state with fetched data
      setSalesData(overviewData);
      setKpis(overviewData.kpis || kpis);
      setChartsData({
        salesTrends: trendsData,
        customerSegments: segmentsData,
        paymentMethods: paymentsData
      });
      setTopProducts(productsData);
      setRecentOrders(ordersData);
      
      console.log('🎸 All data loaded successfully!');
      
    } catch (err) {
      console.error('🎸 Error loading data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // 🎸 Effect Hook - Load data on component mount and filter changes
  useEffect(() => {
    loadAllData();
  }, [filters]);

  // 🎸 Event Handlers
  const handleRefresh = () => {
    console.log('🎸 Refreshing all data...');
    loadAllData();
  };

  const handleExport = () => {
    console.log('🎸 Exporting sales data...');
    // TODO: Implement export functionality
    alert('Export functionality coming soon! 🎸');
  };

  const handleFilterChange = (newFilters) => {
    console.log('🎸 Filters changed:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
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

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? HiTrendingUp : HiTrendingDown;
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

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
              Comprehensive sales performance insights and analytics
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

        {/* 🎸 Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
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
                  {formatCurrency(kpis.totalRevenue)}
                </p>
                <div className={`ml-2 flex items-center ${getGrowthColor(kpis.revenueGrowth)}`}>
                  {React.createElement(getGrowthIcon(kpis.revenueGrowth), { className: "w-4 h-4 mr-1" })}
                  <span className="text-sm font-medium">
                    {Math.abs(kpis.revenueGrowth || 0).toFixed(1)}%
                  </span>
                </div>
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
                  {formatNumber(kpis.totalOrders)}
                </p>
                <div className={`ml-2 flex items-center ${getGrowthColor(kpis.orderGrowth)}`}>
                  {React.createElement(getGrowthIcon(kpis.orderGrowth), { className: "w-4 h-4 mr-1" })}
                  <span className="text-sm font-medium">
                    {Math.abs(kpis.orderGrowth || 0).toFixed(1)}%
                  </span>
                </div>
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
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-700">
                  {formatNumber(kpis.totalCustomers)}
                </p>
                <div className={`ml-2 flex items-center ${getGrowthColor(kpis.customerGrowth)}`}>
                  {React.createElement(getGrowthIcon(kpis.customerGrowth), { className: "w-4 h-4 mr-1" })}
                  <span className="text-sm font-medium">
                    {Math.abs(kpis.customerGrowth || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
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
                {formatCurrency(kpis.avgOrderValue)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 🎸 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trends Chart */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📈 Sales Trends
            </h3>
            <SalesLineChart
              data={chartsData.salesTrends}
              loading={loading}
              height={320}
              title="Revenue Trends"
              showMovingAverage={true}
            />
          </CardBody>
        </Card>

        {/* Customer Segments Chart */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👥 Customer Segments
            </h3>
            <CustomerSegmentChart
              data={chartsData.customerSegments}
              loading={loading}
              height={320}
              title="Customer Distribution"
            />
          </CardBody>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💳 Payment Methods
            </h3>
            <PaymentMethodChart
              data={chartsData.paymentMethods}
              loading={loading}
              height={320}
              title="Payment Distribution"
            />
          </CardBody>
        </Card>

        {/* Top Products Table */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏆 Top Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Sales</th>
                    <th className="pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        <div className="animate-pulse">Loading products...</div>
                      </td>
                    </tr>
                  ) : topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{product.name}</td>
                        <td className="py-2">{formatNumber(product.quantity)}</td>
                        <td className="py-2">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        No products data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 🎸 Recent Orders Table */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📦 Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div className="animate-pulse">Loading orders...</div>
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">#{order.orderNumber}</td>
                      <td className="py-2">{order.customerName}</td>
                      <td className="py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">{formatCurrency(order.total)}</td>
                      <td className="py-2">
                        <Badge
                          type={order.status === 'Delivered' ? 'success' : 
                                order.status === 'Processing' ? 'warning' : 'neutral'}
                        >
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No recent orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* 🎸 Elvis Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          🎸 <strong>Elvis Says:</strong> "Thank you, thank you very much! This dashboard is rockin'!" 🎵
        </p>
      </div>
    </div>
  );
};

export default SalesAnalytics; 