import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Select,
  Label,
  Input
} from "@windmill/react-ui";
import {
  FiTruck,
  FiUsers,
  FiMapPin,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiTarget,
  FiActivity,
  FiAward,
  FiAlertCircle
} from "react-icons/fi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import PageTitle from "@/components/Typography/PageTitle";
import httpService from "@/services/httpService";

// 🚚 Delivery Performance Dashboard - Task 5.2.1 Implementation
const DeliveryPerformance = () => {
  // 🎯 State Management
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    driverStats: {},
    zonePerformance: {},
    customerSatisfaction: {},
    routeEfficiency: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    period: 30,
    startDate: "",
    endDate: "",
    driverId: "",
    zone: ""
  });

  // 🎨 Chart Colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // 🔄 Data Fetching
  useEffect(() => {
    fetchDeliveryData();
  }, [filters.period]);

  const fetchDeliveryData = async () => {
    try {
      setIsLoading(true);
      console.log("🚚 Fetching delivery performance data...");

      const response = await httpService.get('/reports/delivery', {
        params: filters
      });

      if (response.success) {
        setDashboardData(response.data);
        console.log("✅ Delivery data loaded successfully");
      }
    } catch (error) {
      console.error("🚚 Delivery data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex flex-wrap space-x-1 mb-6">
      {[
        { id: 'overview', label: 'Overview', icon: FiTruck },
        { id: 'drivers', label: 'Driver Performance', icon: FiUsers },
        { id: 'zones', label: 'Zone Analysis', icon: FiMapPin },
        { id: 'satisfaction', label: 'Customer Satisfaction', icon: FiStar },
        { id: 'routes', label: 'Route Efficiency', icon: FiTarget }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <tab.icon className="w-4 h-4 mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  // 🎛️ Filters Component
  const FiltersSection = () => (
    <Card className="mb-6">
      <CardBody>
        <h4 className="text-lg font-semibold mb-4">📊 Filters & Controls</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>�� Time Period</Label>
            <Select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: parseInt(e.target.value) }))}
              className="mt-1"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 6 Months</option>
            </Select>
          </div>
          
          <div>
            <Label>🗺️ Zone Filter</Label>
            <Input
              placeholder="Filter by zone/area"
              value={filters.zone}
              onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>👤 Driver Filter</Label>
            <Input
              placeholder="Filter by driver ID"
              value={filters.driverId}
              onChange={(e) => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={fetchDeliveryData}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiRefreshCw className="w-4 h-4" />}
              {isLoading ? " Loading..." : " Refresh"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // 📊 Overview Tab
  const OverviewTab = () => {
    const overview = dashboardData.overview || {};
    
    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
                <FiTruck className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-700">{overview.totalDeliveries?.toLocaleString() || 0}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
                <FiTarget className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{overview.successRate?.toFixed(1) || 0}%</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
                <FiClock className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-blue-600">{overview.averageDeliveryTime?.toFixed(0) || 0} min</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center">
              <div className="p-3 mr-4 text-purple-500 bg-purple-100 rounded-full">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-purple-600">{overview.activeDrivers || 0}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Delivery Status Distribution */}
        <Card>
          <CardBody>
            <h4 className="text-xl font-bold text-gray-800 mb-4">📦 Delivery Status Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{overview.successfulDeliveries || 0}</div>
                <div className="text-sm text-green-700">Delivered</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{overview.pendingDeliveries || 0}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{overview.failedDeliveries || 0}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{overview.topPerformingZone || 'N/A'}</div>
                <div className="text-sm text-yellow-700">Top Zone</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  // 👥 Driver Performance Tab
  const DriversTab = () => {
    const driverStats = dashboardData.driverStats || {};
    const drivers = driverStats.driverPerformance || [];
    
    return (
      <div className="space-y-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-800">👥 Driver Performance Leaderboard</h4>
                <p className="text-sm text-gray-500">Top performing delivery drivers</p>
              </div>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="px-4 py-4 text-left font-semibold text-gray-700">Driver</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Deliveries</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Success Rate</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Avg Time</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Rating</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver, index) => (
                    <tr key={driver._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                          }`}>
                            {index < 3 ? <FiAward className="w-4 h-4" /> : index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{driver.driverName}</p>
                            <p className="text-xs text-gray-500">{driver.driverEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">{driver.successfulDeliveries}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold ${driver.successRate >= 90 ? 'text-green-600' : driver.successRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {driver.successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-blue-600 font-medium">{driver.averageDeliveryTime?.toFixed(0) || 0} min</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <FiStar className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">{driver.averageRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        SAR {driver.totalRevenue?.toLocaleString() || 0}
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

  // 🗺️ Zone Analysis Tab
  const ZonesTab = () => {
    const zoneData = dashboardData.zonePerformance || {};
    const zones = zoneData.zonePerformance || [];
    
    return (
      <div className="space-y-6">
        <Card>
          <CardBody>
            <h4 className="text-xl font-bold text-gray-800 mb-6">🗺️ Zone Performance Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="px-4 py-4 text-left font-semibold text-gray-700">Zone</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Orders</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Success Rate</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Revenue</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Avg Order Value</th>
                    <th className="px-4 py-4 text-right font-semibold text-gray-700">Avg Delivery Time</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 text-orange-500 mr-2" />
                          <span className="font-medium">{zone.zone || 'Unknown Zone'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">{zone.totalOrders}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold ${zone.successRate >= 90 ? 'text-green-600' : zone.successRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {zone.successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        SAR {zone.totalRevenue?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-4 text-right text-blue-600 font-medium">
                        SAR {zone.averageOrderValue?.toFixed(2) || 0}
                      </td>
                      <td className="px-4 py-4 text-right text-purple-600 font-medium">
                        {zone.averageDeliveryTime?.toFixed(0) || 0} min
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

  // 😊 Customer Satisfaction Tab (Placeholder)
  const SatisfactionTab = () => (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <FiStar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h4 className="text-xl font-bold text-gray-600 mb-2">Customer Satisfaction Analytics</h4>
            <p className="text-gray-500">Coming soon! Comprehensive customer feedback and satisfaction metrics.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // 🛣️ Route Efficiency Tab (Placeholder)
  const RoutesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <FiTarget className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h4 className="text-xl font-bold text-gray-600 mb-2">Route Efficiency Analysis</h4>
            <p className="text-gray-500">Coming soon! Route optimization and efficiency metrics.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // 🎯 Tab Content Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'drivers':
        return <DriversTab />;
      case 'zones':
        return <ZonesTab />;
      case 'satisfaction':
        return <SatisfactionTab />;
      case 'routes':
        return <RoutesTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <PageTitle>🚚 Delivery Performance Dashboard</PageTitle>
        <p className="text-gray-600 mt-2">
          Comprehensive delivery analytics, driver performance, and operational insights
        </p>
      </div>

      {/* Filters */}
      <FiltersSection />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Loading delivery performance data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && renderTabContent()}
    </div>
  );
};

export default DeliveryPerformance; 