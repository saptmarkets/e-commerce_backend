import React, { useContext, useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableCell,
  TableFooter,
  TableContainer,
  Select,
  Input,
  Button,
  Card,
  CardBody,
  Pagination,
} from "@windmill/react-ui";
import { FiTruck, FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiMapPin } from "react-icons/fi";

import useAsync from "../hooks/useAsync";
import useFilter from "../hooks/useFilter";
import NotFound from "../components/table/NotFound";
import PageTitle from "../components/Typography/PageTitle";
import { SidebarContext } from "../context/SidebarContext";
import DeliveryServices from "../services/DeliveryServices";
import Loading from "../components/preloader/Loading";

const DeliveryDashboard = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const [deliveryStats, setDeliveryStats] = useState({});
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch delivery dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch delivery statistics
      const statsResponse = await DeliveryServices.getDeliveryStats();
      console.log('Dashboard API Response:', statsResponse);
      // Handle both direct response and wrapped response
      const statsData = statsResponse?.data || statsResponse;
      setDeliveryStats(statsData || {});
      
      // Fetch pending orders
      const pendingResponse = await DeliveryServices.getPendingOrders();
      console.log('Pending Orders API Response:', pendingResponse);
      // Handle both direct response and wrapped response
      const pendingData = pendingResponse?.data || pendingResponse;
      setPendingOrders(pendingData?.orders || []);
      
      // Fetch active drivers
      const driversResponse = await DeliveryServices.getActiveDrivers();
      console.log('Active Drivers API Response:', driversResponse);
      // Handle both direct response and wrapped response
      const driversData = driversResponse?.data || driversResponse;
      setActiveDrivers(driversData?.drivers || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Ensure arrays are always initialized on error
      setPendingOrders([]);
      setActiveDrivers([]);
      setDeliveryStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAssignOrder = async (orderId, driverId) => {
    try {
      await DeliveryServices.assignOrderToDriver({
        orderId,
        driverId,
        priority: 'medium'
      });
      
      // Refresh data
      fetchDashboardData();
      
      // Show success message
      alert('Order assigned successfully!');
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Failed to assign order. Please try again.');
    }
  };

  if (loading) return <Loading loading={loading} />;

  return (
    <>
      <PageTitle>Delivery Dashboard</PageTitle>
      
      {/* Statistics Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-full text-orange-500 bg-orange-100 mr-4">
              <FiTruck className="w-5 h-5" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Total Deliveries Today
              </p>
              <p className="text-lg font-semibold text-gray-700">
                {deliveryStats.orders?.deliveredToday || 0}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-full text-blue-500 bg-blue-100 mr-4">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Active Drivers
              </p>
              <p className="text-lg font-semibold text-gray-700">
                {deliveryStats.overview?.activeDrivers || 0}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-full text-yellow-500 bg-yellow-100 mr-4">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Pending Orders
              </p>
              <p className="text-lg font-semibold text-gray-700">
                {deliveryStats.orders?.pending || 0}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-full text-green-500 bg-green-100 mr-4">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">
                Completed Today
              </p>
              <p className="text-lg font-semibold text-gray-700">
                {deliveryStats.orders?.deliveredToday || 0}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-2">
        {/* Pending Orders */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-700">
                Pending Orders
              </h4>
              <Button
                size="small"
                onClick={() => window.location.href = '/delivery/assignments'}
              >
                View All
              </Button>
            </div>
            
            {pendingOrders.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No pending orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(pendingOrders || []).slice(0, 5).map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-700">#{order.invoice}</p>
                      <p className="text-sm text-gray-500">{order.user_info?.name}</p>
                      <p className="text-sm text-gray-500">${order.total}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Select
                        className="text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignOrder(order._id, e.target.value);
                          }
                        }}
                      >
                        <option value="">Assign Driver</option>
                        {(activeDrivers || []).map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name.en}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Active Drivers */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-700">
                Active Drivers
              </h4>
              <Button
                size="small"
                onClick={() => window.location.href = '/delivery/drivers'}
              >
                Manage Drivers
              </Button>
            </div>
            
            {activeDrivers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No active drivers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeDrivers || []).slice(0, 5).map((driver) => (
                  <div key={driver._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-700">{driver.name.en}</p>
                      <p className="text-sm text-gray-500">{driver.phone}</p>
                      <p className="text-sm text-gray-500">
                        Status: {driver.currentStats?.availability || 'offline'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        Today: {driver.currentStats?.todayDeliveries || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Active: {driver.currentStats?.activeDeliveries || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              layout="outline"
              size="large"
              onClick={() => window.location.href = '/delivery/assignments'}
              className="flex items-center justify-center space-x-2"
            >
              <FiTruck className="w-4 h-4" />
              <span>Assign Orders</span>
            </Button>
            
            <Button
              layout="outline"
              size="large"
              onClick={() => window.location.href = '/delivery/tracking'}
              className="flex items-center justify-center space-x-2"
            >
              <FiMapPin className="w-4 h-4" />
              <span>Live Tracking</span>
            </Button>
            
            <Button
              layout="outline"
              size="large"
              onClick={() => window.location.href = '/delivery/drivers'}
              className="flex items-center justify-center space-x-2"
            >
              <FiUser className="w-4 h-4" />
              <span>Manage Drivers</span>
            </Button>
            
            <Button
              layout="outline"
              size="large"
              onClick={() => window.location.href = '/delivery/settings'}
              className="flex items-center justify-center space-x-2"
            >
              <FiAlertCircle className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default DeliveryDashboard; 