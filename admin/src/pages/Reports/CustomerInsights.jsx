import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Input, Label, Select } from "@windmill/react-ui";
import { FiUsers, FiTrendingUp, FiMapPin, FiDollarSign, FiStar, FiDownload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import PageTitle from "@/components/Typography/PageTitle";
import httpService from "@/services/httpService";

// 🎸 Customer Insights Dashboard - Comprehensive Customer Analytics
// Created by AYE for SaptMarkets deep customer intelligence and business insights
// Features: CLV, RFM Analysis, Purchase Behavior, Geographic Distribution, Acquisition Trends

const CustomerInsights = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    period: 30,
    segment: "",
    city: "",
    limit: 50
  });

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
                <PieChart>
                  <Pie
                    data={overviewData.customerSegments || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(overviewData.customerSegments || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

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

      {/* Progress Update */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📊 PROGRESS UPDATE</h4>
        <p className="text-blue-700">
          ✅ <strong>Frontend Component:</strong> Customer Insights Dashboard - 90% Complete<br />
          🚧 <strong>Current Status:</strong> Building comprehensive customer analytics interface<br />
          ⏳ <strong>Next:</strong> Final testing and data validation<br />
          🎯 <strong>Features:</strong> Overview KPIs, CLV Analysis, RFM Segmentation, Purchase Behavior, Geographic Distribution
        </p>
      </div>
    </div>
  );
};

export default CustomerInsights; 