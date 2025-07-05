import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Input, Label, Select, Modal, ModalHeader, ModalBody, ModalFooter } from "@windmill/react-ui";
import { FiUsers, FiTrendingUp, FiMapPin, FiDollarSign, FiStar, FiDownload, FiEye, FiShoppingBag, FiCalendar, FiX, FiExternalLink } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import PageTitle from "@/components/Typography/PageTitle";
import httpService from "@/services/httpService";

// 🎸 Customer Insights Dashboard - Comprehensive Customer Analytics
// Created by AYE for SaptMarkets deep customer intelligence and business insights
// Features: CLV, RFM Analysis, Purchase Behavior, Geographic Distribution, Acquisition Trends

const CustomerInsights = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    period: 30,
    segment: "",
    city: "",
    limit: 50
  });

  // 🎸 Customer Detail States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 🎸 Load Customer Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log("🎸 Fetching customer dashboard data...");
      
      const response = await httpService.get('/reports/customer/dashboard', {
        params: {
          period: filters.period,
          city: filters.city || undefined
        }
      });

      console.log("🎸 Customer dashboard response:", response);
      
      if (response.success) {
        setDashboardData(response.data);
        console.log("✅ Customer dashboard loaded successfully");
      } else {
        console.error("❌ Failed to load customer dashboard");
      }
    } catch (error) {
      console.error("🎸 Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎸 Handle Filter Changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 🎸 Handle Customer Selection and Load Order Details
  const handleCustomerSelect = async (customer) => {
    try {
      setSelectedCustomer(customer);
      setIsCustomerModalOpen(true);
      setCustomerOrdersLoading(true);
      
      console.log("🎸 Loading orders for customer:", customer.customerId || customer._id);
      
      // Get customer order history
      const response = await httpService.get(`/orders/customer/${customer.customerId || customer._id}`, {
        params: {
          limit: 100, // Get more orders for detailed view
          page: 1
        }
      });
      
      console.log("🎸 Customer orders response:", response);
      console.log("🎸 Response type:", typeof response);
      console.log("🎸 Response keys:", Object.keys(response || {}));
      
      if (response && response.orders && Array.isArray(response.orders)) {
        setCustomerOrders(response.orders);
        console.log("✅ Orders loaded from response.orders:", response.orders.length);
      } else if (response && Array.isArray(response)) {
        setCustomerOrders(response);
        console.log("✅ Orders loaded from response array:", response.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        setCustomerOrders(response.data);
        console.log("✅ Orders loaded from response.data:", response.data.length);
      } else {
        setCustomerOrders([]);
        console.log("❌ No orders found in response");
      }
      
    } catch (error) {
      console.error("🎸 Error loading customer orders:", error);
      setCustomerOrders([]);
    } finally {
      setCustomerOrdersLoading(false);
    }
  };

  // 🎸 Close Customer Modal
  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setSelectedCustomer(null);
    setCustomerOrders([]);
    setSelectedOrder(null);
  };

  // 🎸 Handle Order Selection
  const handleOrderSelect = (order) => {
    setSelectedOrder(selectedOrder?._id === order._id ? null : order);
  };

  // 🎸 Navigate to Order Details Page
  const handleViewOrderDetails = (order) => {
    // Navigate to the existing order details page
    history.push(`/order/${order._id}`);
  };

  // 🎸 Export Customer Data
  const exportToCSV = async (reportType) => {
    try {
      console.log("🎸 Starting customer export for:", reportType);
      
      const response = await httpService.get('/reports/customer/export', {
        params: {
          format: 'csv',
          reportType,
          period: filters.period,
          segment: filters.segment,
          city: filters.city
        }
      });

      console.log("🎸 Export response:", response);
      
      if (response && typeof response === 'string') {
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("✅ CSV export successful");
      } else {
        console.error("❌ Invalid export response");
      }
    } catch (error) {
      console.error("🎸 Export error:", error);
    }
  };

  // 🎸 Load data on component mount and filter changes
  useEffect(() => {
    fetchDashboardData();
  }, [filters.period, filters.city]);

  // 🎸 Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // 🎸 Color palette for charts
  const chartColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  // 🎸 Format Date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🎸 Format Order Status
  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'cancel':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 🎸 Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex flex-wrap space-x-1 mb-6">
      {[
        { id: 'overview', label: 'Overview', icon: FiUsers },
        { id: 'clv', label: 'Lifetime Value', icon: FiDollarSign },
        { id: 'rfm', label: 'RFM Analysis', icon: FiStar },
        { id: 'behavior', label: 'Purchase Behavior', icon: FiTrendingUp },
        { id: 'geographic', label: 'Geographic', icon: FiMapPin }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <tab.icon className="w-4 h-4 mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  // 🎸 Filters Component
  const FiltersSection = () => (
    <Card className="mb-6">
      <CardBody>
        <h4 className="text-lg font-semibold mb-4">📊 Filters & Controls</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>📅 Period (Days)</Label>
            <Select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', parseInt(e.target.value))}
              className="mt-1"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 6 Months</option>
              <option value={365}>Last Year</option>
            </Select>
          </div>
          
          <div>
            <Label>🏙️ City Filter</Label>
            <Input
              placeholder="Enter city name"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>👥 Customer Segment</Label>
            <Select
              value={filters.segment}
              onChange={(e) => handleFilterChange('segment', e.target.value)}
              className="mt-1"
            >
              <option value="">All Segments</option>
              <option value="VIP">VIP Customers</option>
              <option value="Premium">Premium Customers</option>
              <option value="Regular">Regular Customers</option>
              <option value="New">New Customers</option>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={fetchDashboardData}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "🔄 Refresh"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // 🎸 Overview Tab Component
  const OverviewTab = () => {
    const overviewData = dashboardData.customerOverview || {};
    const overview = overviewData.overview || {};

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-700">{overview.totalCustomers?.toLocaleString() || 0}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
                <FiDollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(overview.totalSpent)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-yellow-500 bg-yellow-100 rounded-full">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Avg. Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(overview.averageLifetimeValue)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-purple-500 bg-purple-100 rounded-full">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-700">{overview.activeCustomers?.toLocaleString() || 0}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Customer Segments Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Segments Bar Chart */}
          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">👥 Customer Segments</h4>
                <Button
                  size="sm"
                  onClick={() => exportToCSV('overview')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={overviewData.customerSegments || []}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="_id" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [value.toLocaleString(), 'Customers']}
                      labelFormatter={(label) => `${label} Segment`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8884d8"
                      name="Customer Count"
                      radius={[0, 4, 4, 0]}
                    >
                      {(overviewData.customerSegments || []).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry._id === 'VIP' ? '#8b5cf6' :
                            entry._id === 'Premium' ? '#3b82f6' :
                            entry._id === 'Regular' ? '#10b981' :
                            entry._id === 'New' ? '#f59e0b' :
                            '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Customer Segments Summary Cards */}
          <Card>
            <CardBody>
              <h4 className="text-lg font-semibold mb-4">📊 Segment Details</h4>
              <div className="space-y-4">
                {(overviewData.customerSegments || []).map((segment, index) => {
                  const totalCustomers = overviewData.customerSegments.reduce((sum, s) => sum + s.count, 0);
                  const percentage = totalCustomers > 0 ? ((segment.count / totalCustomers) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ 
                            backgroundColor: 
                              segment._id === 'VIP' ? '#8b5cf6' :
                              segment._id === 'Premium' ? '#3b82f6' :
                              segment._id === 'Regular' ? '#10b981' :
                              segment._id === 'New' ? '#f59e0b' :
                              '#6b7280'
                          }}
                        ></div>
                        <div>
                          <p className="font-medium text-sm">{segment._id} Customers</p>
                          <p className="text-xs text-gray-600">{percentage}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{segment.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">customers</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Top Customers Table */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">🏆 Top Customers</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-right">Total Spent</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                    <th className="px-4 py-2 text-center">Segment</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(overviewData.topCustomers || []).map((customer, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium">{customer.name}</td>
                      <td className="px-4 py-2 text-gray-600">{customer.email}</td>
                      <td className="px-4 py-2 text-gray-600">{customer.city}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-4 py-2 text-right">{customer.totalOrders}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.customerSegment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                          customer.customerSegment === 'Premium' ? 'bg-blue-100 text-blue-800' :
                          customer.customerSegment === 'Regular' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.customerSegment}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleCustomerSelect(customer)}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <FiEye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 🎸 Customer Lifetime Value Tab
  const CLVTab = () => {
    const clvData = dashboardData.lifetimeValue || {};

    return (
      <div className="space-y-6">
        {/* CLV Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(clvData.clvSummary || []).map((segment, index) => (
            <Card key={index}>
              <CardBody>
                <h4 className="text-lg font-semibold mb-2">{segment._id} Segment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customers:</span>
                    <span className="font-medium">{segment.customerCount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. CLV:</span>
                    <span className="font-medium">{formatCurrency(segment.averageClv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total CLV:</span>
                    <span className="font-medium">{formatCurrency(segment.totalClv)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* CLV Analysis Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">💰 Customer Lifetime Value Analysis</h4>
              <Button
                size="sm"
                onClick={() => exportToCSV('clv')}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export CLV Data
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-right">Current CLV</th>
                    <th className="px-4 py-2 text-right">Predicted CLV</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                    <th className="px-4 py-2 text-right">AOV</th>
                    <th className="px-4 py-2 text-center">Segment</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(clvData.clvAnalysis || []).slice(0, 20).map((customer, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium">{customer.name}</td>
                      <td className="px-4 py-2 text-gray-600">{customer.city}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(customer.currentClv)}</td>
                      <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(customer.predictedLifetimeValue)}</td>
                      <td className="px-4 py-2 text-right">{customer.totalOrders}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(customer.averageOrderValue)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.customerSegment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                          customer.customerSegment === 'Premium' ? 'bg-blue-100 text-blue-800' :
                          customer.customerSegment === 'Regular' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.customerSegment}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleCustomerSelect(customer)}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <FiEye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 🎸 RFM Analysis Tab
  const RFMTab = () => {
    const rfmData = dashboardData.rfmAnalysis || {};

    return (
      <div className="space-y-6">
        {/* RFM Summary Chart */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">🎯 RFM Segments Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rfmData.rfmSummary || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customerCount" fill="#8884d8" name="Customer Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* RFM Analysis Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">📊 RFM Customer Analysis</h4>
              <Button
                size="sm"
                onClick={() => exportToCSV('rfm')}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export RFM Data
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-right">Recency</th>
                    <th className="px-4 py-2 text-right">Frequency</th>
                    <th className="px-4 py-2 text-right">Monetary</th>
                    <th className="px-4 py-2 text-center">RFM Score</th>
                    <th className="px-4 py-2 text-center">Segment</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(rfmData.rfmAnalysis || []).slice(0, 20).map((customer, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium">{customer.name}</td>
                      <td className="px-4 py-2 text-gray-600">{customer.city}</td>
                      <td className="px-4 py-2 text-right">{customer.recency} days</td>
                      <td className="px-4 py-2 text-right">{customer.frequency}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(customer.monetary)}</td>
                      <td className="px-4 py-2 text-center font-mono">{customer.rfmScore}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.rfmSegment === 'Champions' ? 'bg-green-100 text-green-800' :
                          customer.rfmSegment === 'Loyal Customers' ? 'bg-blue-100 text-blue-800' :
                          customer.rfmSegment === 'At Risk' ? 'bg-yellow-100 text-yellow-800' :
                          customer.rfmSegment === 'Lost Customers' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.rfmSegment}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleCustomerSelect(customer)}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <FiEye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 🎸 Purchase Behavior Tab
  const BehaviorTab = () => {
    const behaviorData = dashboardData.purchaseBehavior || {};

    return (
      <div className="space-y-6">
        {/* Category Analysis Chart */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">📈 Popular Categories</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={behaviorData.categoryAnalysis || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" name="Revenue" />
                  <Bar dataKey="totalQuantity" fill="#8884d8" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Purchase Patterns Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">🛒 Customer Purchase Patterns</h4>
              <Button
                size="sm"
                onClick={() => exportToCSV('behavior')}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export Behavior Data
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                    <th className="px-4 py-2 text-right">Products</th>
                    <th className="px-4 py-2 text-right">Total Spent</th>
                    <th className="px-4 py-2 text-right">Categories</th>
                    <th className="px-4 py-2 text-right">Frequency</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(behaviorData.purchasePatterns || []).slice(0, 20).map((customer, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium">{customer.customerName}</td>
                      <td className="px-4 py-2 text-gray-600">{customer.customerCity}</td>
                      <td className="px-4 py-2 text-right">{customer.totalOrderCount}</td>
                      <td className="px-4 py-2 text-right">{customer.totalProducts}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-4 py-2 text-right">{customer.categoryCount}</td>
                      <td className="px-4 py-2 text-right">{customer.orderFrequency?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleCustomerSelect(customer)}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <FiEye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 🎸 Geographic Distribution Tab
  const GeographicTab = () => {
    const geoData = dashboardData.geographicDistribution || {};

    return (
      <div className="space-y-6">
        {/* Geographic Chart */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">🌍 Customer Distribution by Location</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData.geographicData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customerCount" fill="#8884d8" name="Customer Count" />
                  <Bar dataKey="totalSpent" fill="#82ca9d" name="Total Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Geographic Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">📍 Geographic Performance</h4>
              <Button
                size="sm"
                onClick={() => exportToCSV('geographic')}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export Geographic Data
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-right">Customers</th>
                    <th className="px-4 py-2 text-right">Total Spent</th>
                    <th className="px-4 py-2 text-right">Avg. Spent</th>
                    <th className="px-4 py-2 text-right">Active Customers</th>
                    <th className="px-4 py-2 text-right">Penetration %</th>
                  </tr>
                </thead>
                <tbody>
                  {(geoData.geographicData || []).map((location, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium">{location.location}</td>
                      <td className="px-4 py-2 text-right">{location.customerCount}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(location.totalSpent)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(location.averageSpent)}</td>
                      <td className="px-4 py-2 text-right">{location.activeCustomers}</td>
                      <td className="px-4 py-2 text-right">{location.penetrationRate?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 🎸 Customer Detail Modal
  const CustomerDetailModal = () => (
    <Modal isOpen={isCustomerModalOpen} onClose={closeCustomerModal}>
      <ModalHeader className="flex items-center justify-between">
        <div className="flex items-center">
          <FiUsers className="w-5 h-5 mr-2 text-blue-500" />
          <span>Customer Details: {selectedCustomer?.name}</span>
        </div>
        <Button
          className="ml-auto text-gray-500 hover:text-gray-700"
          layout="link"
          size="icon"
          onClick={closeCustomerModal}
        >
          <FiX className="w-4 h-4" />
        </Button>
      </ModalHeader>
      
      <ModalBody className="max-h-96 overflow-y-auto">
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">👤 Customer Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedCustomer.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedCustomer.email || selectedCustomer.customerEmail}
                </div>
                <div>
                  <span className="font-medium">City:</span> {selectedCustomer.city || selectedCustomer.customerCity}
                </div>
                <div>
                  <span className="font-medium">Segment:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedCustomer.customerSegment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                    selectedCustomer.customerSegment === 'Premium' ? 'bg-blue-100 text-blue-800' :
                    selectedCustomer.customerSegment === 'Regular' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCustomer.customerSegment || selectedCustomer.rfmSegment}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Total Spent:</span> {formatCurrency(selectedCustomer.totalSpent || selectedCustomer.currentClv || selectedCustomer.monetary)}
                </div>
                <div>
                  <span className="font-medium">Total Orders:</span> {selectedCustomer.totalOrders || selectedCustomer.totalOrderCount || selectedCustomer.frequency}
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <FiShoppingBag className="w-4 h-4 mr-2" />
                  📦 Order History
                </div>
                <div className="text-xs text-gray-500">
                  <FiEye className="w-3 h-3 inline mr-1" />
                  Expand | <FiExternalLink className="w-3 h-3 inline mr-1" />
                  View Details
                </div>
              </h4>
              
              {customerOrdersLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <FiShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No orders found for this customer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">#{order.invoice || order._id}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <FiCalendar className="w-3 h-3 inline mr-1" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.totalAmount || order.total)}</div>
                          <div className="text-sm text-gray-600">{order.cart?.length || 0} items</div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="xs"
                            onClick={() => handleOrderSelect(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            title="Toggle order items"
                          >
                            <FiEye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleViewOrderDetails(order)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            title="View full order details"
                          >
                            <FiExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Order Items (Expandable) */}
                      {selectedOrder?._id === order._id && (
                        <div className="mt-3 pt-3 border-t bg-blue-50 rounded p-3">
                          <h5 className="font-medium mb-2">🛒 Items Purchased:</h5>
                          <div className="space-y-2">
                            {order.cart?.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center text-sm">
                                <div className="flex-1">
                                  <div className="font-medium">{item.title}</div>
                                  {item.sku && <div className="text-gray-500">SKU: {item.sku}</div>}
                                </div>
                                <div className="text-center px-2">
                                  <span className="text-gray-600">Qty: {item.quantity}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(item.price)}</div>
                                  <div className="text-gray-500">Total: {formatCurrency(item.price * item.quantity)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Order Summary */}
                          <div className="mt-3 pt-2 border-t border-blue-200">
                            <div className="flex justify-between items-center font-medium">
                              <span>Order Total:</span>
                              <span>{formatCurrency(order.totalAmount || order.total)}</span>
                            </div>
                            {order.paymentMethod && (
                              <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Payment Method:</span>
                                <span>{order.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>
      
      <ModalFooter>
        <Button onClick={closeCustomerModal} layout="outline">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );

  // 🎸 Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'clv':
        return <CLVTab />;
      case 'rfm':
        return <RFMTab />;
      case 'behavior':
        return <BehaviorTab />;
      case 'geographic':
        return <GeographicTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <PageTitle>👥 Customer Insights</PageTitle>
        <p className="text-gray-600 mt-2">
          Comprehensive customer analytics and intelligence dashboard
        </p>
      </div>

      {/* Filters */}
      <FiltersSection />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading customer insights...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && renderTabContent()}

      {/* Customer Detail Modal */}
      <CustomerDetailModal />

    </div>
  );
};

export default CustomerInsights; 