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
  const [data, setData] = useState({
    overview: {},
    timeAnalysis: {},
    drivers: {}, // FIXED: Changed from driverStats to drivers
    zonePerformance: {},
    period: 30
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

  // 💰 Currency Formatter
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    if (isNaN(num)) return '0 SAR';
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
  };

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
        setData(response.data);
        console.log("✅ Delivery data loaded successfully");
        console.log("🚚 FULL RESPONSE DATA:", response.data);
        console.log("👥 DRIVER STATS:", response.data.drivers); // FIXED: Changed from driverStats to drivers
        console.log("🎯 DRIVER PERFORMANCE ARRAY:", response.data.drivers?.driverPerformance); // FIXED: Changed from driverStats to drivers
      }
    } catch (error) {
      console.error("🚚 Delivery data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🧪 DEBUG: Test database connectivity and data structure
  const handleDebugDB = async () => {
    try {
      console.log("🧪 Starting database debug...");
      
      // Use httpService to match the pattern used in fetchDeliveryData
      const response = await httpService.get('/reports/delivery/test-data');
      
      console.log("🧪 Debug response:", response);
      
      if (response.success) {
        const { database, samples, testQuery, suggestions } = response.debug;
        
        // Show detailed alert with debug info
        const debugMessage = `
🧪 DATABASE DEBUG RESULTS:

📊 Database Counts:
- Total Admins: ${database.totalAdmins}
- Total Drivers: ${database.driversCount}
- Active Drivers: ${database.activeDrivers}
- Total Orders: ${database.totalOrders}
- Orders with Delivery Info: ${database.ordersWithDeliveryInfo}
- Orders with Assigned Driver: ${database.ordersWithAssignedDriver}
- Delivered Orders: ${database.deliveredOrders}
- Delivered with Driver: ${database.deliveredWithDriver}

🔍 Sample Data:
- Driver Records: ${samples.drivers.length}
- Order Records: ${samples.orders.length}

🧪 Test Query Results:
- Driver Aggregation: ${testQuery.driverAggregationResults.length} results
- Query Status: ${testQuery.message}

✅ Suggestions:
${Object.entries(suggestions).map(([key, value]) => `- ${value}`).join('\n')}

📋 Sample Driver Data:
${samples.drivers.map(driver => `
  • Name: ${driver.name?.en || 'N/A'}
  • Email: ${driver.email}
  • Role: ${driver.role}
  • On Duty: ${driver.deliveryInfo?.isOnDuty || false}
  • Total Deliveries: ${driver.deliveryStats?.totalDeliveries || 0}
`).join('')}

📋 Test Query Results:
${testQuery.driverAggregationResults.map(result => `
  • Driver: ${result.driverName}
  • Email: ${result.driverEmail}
  • Phone: ${result.driverPhone}
  • Deliveries: ${result.totalDeliveries}
  • Revenue: $${result.totalRevenue}
`).join('')}
        `;
        
        alert(debugMessage);
        
        // Also log to console for detailed inspection
        console.log("🧪 Detailed Debug Data:", {
          database,
          samples,
          testQuery,
          suggestions
        });
        
        // Force refresh the dashboard data
        await fetchDeliveryData();
        
      } else {
        alert(`❌ Debug failed: ${response.error}`);
      }
    } catch (error) {
      console.error("🧪 Debug error:", error);
      alert(`❌ Debug error: ${error.message}`);
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
            
            <Button
              onClick={handleDebugDB}
              className="bg-purple-500 hover:bg-purple-600 text-white ml-2"
              disabled={isLoading}
            >
              <FiAlertCircle className="w-4 h-4 mr-1" />
              Debug DB
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // 📊 OVERVIEW TAB COMPONENT
  const OverviewTab = () => {
    const overview = data?.overview || {}; // FIXED: Should access overview data, not driver data
    
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

  // 🚗 DRIVERS TAB COMPONENT
  const DriversTab = () => {
    const drivers = data?.drivers?.driverPerformance || [];
    const activeDrivers = data?.drivers?.activeDrivers || 0;
    const topPerformer = data?.drivers?.topPerformer || null;
    
    console.log("🚗 DriversTab Debug:", {
      driversCount: drivers.length,
      activeDrivers,
      topPerformer,
      rawDrivers: drivers,
      fullData: data
    });
    
    if (drivers.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold mb-2">No Driver Performance Data</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any driver performance data. This could mean:
          </p>
          <ul className="text-sm text-gray-500 mb-4 space-y-1">
            <li>• No orders have been assigned to drivers</li>
            <li>• No completed deliveries with driver assignments</li>
            <li>• Database connection issues</li>
            <li>• Field name mismatch in aggregation query</li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Debug Info:</strong> Found {activeDrivers} active drivers, {drivers.length} in performance data
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Drivers</p>
                <p className="text-2xl font-bold">{activeDrivers}</p>
              </div>
              <div className="text-3xl opacity-80">🚗</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Performers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
              <div className="text-3xl opacity-80">👥</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Top Performer</p>
                <p className="text-lg font-bold">{topPerformer?.driverName || 'N/A'}</p>
              </div>
              <div className="text-3xl opacity-80">🏆</div>
            </div>
          </div>
        </div>
        
        {/* Driver Performance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Driver Performance Leaderboard</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver, index) => (
                  <tr key={driver._id} className={index === 0 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index === 0 ? '🏆' : index + 1}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.driverName || 'Unknown Driver'}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{driver._id?.slice(-6) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.driverEmail || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.driverPhone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{driver.successfulDeliveries || 0}</span>
                        <span className="text-gray-500">/{driver.totalAssignments || 0}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.pendingDeliveries || 0} pending
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.successRate || 0}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(driver.successRate || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(driver.totalRevenue || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(driver.averageOrderValue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.averageRating || 5.0}
                        </div>
                        <div className="ml-1 text-yellow-400">
                          {'★'.repeat(Math.floor(driver.averageRating || 5))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.averageDeliveryTime || 0} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 🗺️ Zone Analysis Tab
  const ZonesTab = () => {
    const zoneData = data.zonePerformance || {};
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