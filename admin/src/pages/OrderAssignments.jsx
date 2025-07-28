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
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@windmill/react-ui";
import { FiTruck, FiUser, FiClock, FiCheckCircle, FiSettings, FiRefreshCw } from "react-icons/fi";

import useAsync from "../hooks/useAsync";
import useFilter from "../hooks/useFilter";
import NotFound from "../components/table/NotFound";
import PageTitle from "../components/Typography/PageTitle";
import { SidebarContext } from "../context/SidebarContext";
import DeliveryServices from "../services/DeliveryServices";
import Loading from "../components/preloader/Loading";

const OrderAssignments = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState('medium');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending orders
      const pendingResponse = await DeliveryServices.getPendingOrders({ 
        page: currentPage, 
        limit: ordersPerPage 
      });
      console.log('Pending Orders API Response:', pendingResponse);
      
      // Handle both direct response and wrapped response
      const pendingData = pendingResponse?.data || pendingResponse;
      const ordersData = pendingData?.orders || [];
      console.log('Processed Orders Data:', ordersData);
      setPendingOrders(ordersData);
      
      // Fetch available drivers
      const driversResponse = await DeliveryServices.getAvailableDrivers();
      console.log('Available Drivers API Response:', driversResponse);
      
      // Handle both direct response and wrapped response
      const driversData = driversResponse?.data || driversResponse;
      const availableDriversData = driversData?.drivers || [];
      console.log('Processed Available Drivers Data:', availableDriversData);
      setAvailableDrivers(availableDriversData);
      
      // Get auto-assignment setting
      const settingsResponse = await DeliveryServices.getDeliverySettings();
      console.log('Settings API Response:', settingsResponse);
      
      // Handle both direct response and wrapped response
      const settingsData = settingsResponse?.data || settingsResponse;
      const autoAssignSetting = settingsData?.settings?.autoAssignEnabled || false;
      console.log('Auto Assign Setting:', autoAssignSetting);
      setAutoAssignEnabled(autoAssignSetting);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setPendingOrders([]);
      setAvailableDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handleAutoAssignToggle = async () => {
    try {
      const newValue = !autoAssignEnabled;
      await DeliveryServices.updateDeliverySettings({
        autoAssignEnabled: newValue
      });
      setAutoAssignEnabled(newValue);
      
      if (newValue) {
        // Trigger auto assignment for pending orders
        await DeliveryServices.autoAssignPendingOrders();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling auto-assign:', error);
      alert('Failed to update auto-assignment setting');
    }
  };

  const handleManualAssign = (order) => {
    setSelectedOrder(order);
    setSelectedDriver('');
    setAssignmentPriority('medium');
    setIsAssignModalOpen(true);
  };

  const confirmAssignment = async () => {
    if (!selectedOrder || !selectedDriver) {
      alert('Please select a driver');
      return;
    }

    try {
      await DeliveryServices.assignOrderToDriver({
        orderId: selectedOrder._id,
        driverId: selectedDriver,
        priority: assignmentPriority
      });
      
      setIsAssignModalOpen(false);
      fetchData(); // Refresh data
      alert('Order assigned successfully!');
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Failed to assign order. Please try again.');
    }
  };

  const handleBulkAutoAssign = async () => {
    try {
      setLoading(true);
      await DeliveryServices.autoAssignPendingOrders();
      fetchData();
              alert(t("BulkAutoAssignmentCompleted"));
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Failed to auto-assign orders');
    }
  };

  if (loading) return <Loading loading={loading} />;

  return (
    <>
      <PageTitle>Order Assignments</PageTitle>
      
      {/* Controls */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoAssign"
                  checked={autoAssignEnabled}
                  onChange={handleAutoAssignToggle}
                  className="mr-2"
                />
                <label htmlFor="autoAssign" className="text-sm font-medium text-gray-700">
                  Enable Auto-Assignment
                </label>
              </div>
              <div className="text-sm text-gray-500">
                {autoAssignEnabled ? 
                  'New orders will be automatically assigned to available drivers' : 
                  'Orders require manual assignment'
                }
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="small" onClick={fetchData}>
                <FiRefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              {!autoAssignEnabled && (
                <Button size="small" onClick={handleBulkAutoAssign}>
                  <FiTruck className="w-4 h-4 mr-1" />
                  Auto-Assign All
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">
              Pending Orders ({pendingOrders.length})
            </h4>
            <div className="text-sm text-gray-500">
              Available Drivers: {availableDrivers.length}
            </div>
          </div>

          {pendingOrders.length === 0 ? (
            <NotFound title={t("NoPendingOrders")} />
          ) : (
            <TableContainer className="mb-8">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-700">#{order.invoice}</p>
                          <p className="text-sm text-gray-500">{order.paymentMethod}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-700">{order.customer.name}</p>
                          <p className="text-sm text-gray-500">{order.customer.contact}</p>
                          <p className="text-xs text-gray-500">{order.customer.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge type="neutral">
                          {order.orderSummary.itemCount} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">${order.orderSummary.total}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          type={
                            order.priority === 'urgent' ? 'danger' :
                            order.priority === 'high' ? 'warning' : 'neutral'
                          }
                        >
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="small"
                            onClick={() => handleManualAssign(order)}
                            disabled={availableDrivers.length === 0}
                          >
                            <FiUser className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Assignment Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
        <ModalHeader>Assign Order to Driver</ModalHeader>
        <ModalBody>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Order Details</h5>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Order:</strong> #{selectedOrder.invoice}</p>
                  <p><strong>Customer:</strong> {selectedOrder.customer.name}</p>
                  <p><strong>Total:</strong> ${selectedOrder.orderSummary.total}</p>
                  <p><strong>Items:</strong> {selectedOrder.orderSummary.itemCount}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Driver
                </label>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full"
                >
                  <option value="">Choose a driver...</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name.en} - {driver.deliveryInfo?.vehicleType} ({driver.deliveryInfo?.vehicleNumber})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={assignmentPriority}
                  onChange={(e) => setAssignmentPriority(e.target.value)}
                  className="w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end space-x-2">
            <Button layout="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAssignment}>
              Assign Order
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default OrderAssignments; 