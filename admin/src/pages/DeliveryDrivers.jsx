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
} from "@windmill/react-ui";
import { FiTruck, FiUser, FiEdit, FiTrash2, FiPlus, FiRefreshCw } from "react-icons/fi";

import NotFound from "../components/table/NotFound";
import PageTitle from "../components/Typography/PageTitle";
import { SidebarContext } from "../context/SidebarContext";
import DeliveryServices from "../services/DeliveryServices";
import Loading from "../components/preloader/Loading";

const DeliveryDrivers = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [driversPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  // Fetch drivers data
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: driversPerPage
      };
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      if (filterAvailability !== 'all') {
        params.availability = filterAvailability;
      }
      
      const response = await DeliveryServices.getAllDrivers(params);
      console.log('Drivers API Response:', response);
      
      // Handle both direct response and wrapped response
      const responseData = response?.data || response;
      const driversData = responseData?.drivers || [];
      
      console.log('Processed Drivers Data:', driversData);
      setDrivers(driversData);
      
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [currentPage, filterStatus, filterAvailability]);

  const handleStatusChange = async (driverId, newStatus) => {
    try {
      await DeliveryServices.updateDriver(driverId, { status: newStatus });
      fetchDrivers(); // Refresh data
      alert('Driver status updated successfully!');
    } catch (error) {
      console.error('Error updating driver status:', error);
      alert('Failed to update driver status');
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await DeliveryServices.deleteDriver(driverId);
        fetchDrivers(); // Refresh data
        alert('Driver deleted successfully!');
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Failed to delete driver');
      }
    }
  };

  if (loading) return <Loading loading={loading} />;

  return (
    <>
      <PageTitle>Delivery Drivers Management</PageTitle>
      
      {/* Controls */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-32"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Availability
                </label>
                <Select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="w-32"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button size="small" onClick={fetchDrivers}>
                <FiRefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button size="small" onClick={() => window.location.href = '/our-staff'}>
                <FiPlus className="w-4 h-4 mr-1" />
                Add Driver
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">
              Drivers ({drivers.length})
            </h4>
          </div>

          {drivers.length === 0 ? (
            <NotFound title="No Drivers Found" />
          ) : (
            <TableContainer className="mb-8">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell>Driver</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell>Today's Deliveries</TableCell>
                    <TableCell>Actions</TableCell>
                  </tr>
                </TableHeader>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FiUser className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{driver.name.en}</p>
                            <p className="text-sm text-gray-500">{driver.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-700">{driver.phone}</p>
                          <p className="text-xs text-gray-500">
                            Emergency: {driver.deliveryInfo?.emergencyContact?.phone || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-700">
                            {driver.deliveryInfo?.vehicleType || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {driver.deliveryInfo?.vehicleNumber || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            License: {driver.deliveryInfo?.licenseNumber || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={driver.status}
                          onChange={(e) => handleStatusChange(driver._id, e.target.value)}
                          className="text-sm"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          type={
                            driver.deliveryInfo?.availability === 'available' ? 'success' :
                            driver.deliveryInfo?.availability === 'busy' ? 'warning' : 'neutral'
                          }
                        >
                          {driver.deliveryInfo?.availability || 'offline'}
                        </Badge>
                        {driver.deliveryInfo?.isOnDuty && (
                          <p className="text-xs text-green-600 mt-1">On Duty</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium text-gray-700">
                            {driver.deliveryStats?.completedToday || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            Total: {driver.deliveryStats?.totalDeliveries || 0}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="small"
                            layout="outline"
                            onClick={() => window.location.href = `/our-staff?edit=${driver._id}`}
                          >
                            <FiEdit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="small"
                            layout="outline"
                            onClick={() => handleDeleteDriver(driver._id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <FiTrash2 className="w-3 h-3" />
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
    </>
  );
};

export default DeliveryDrivers; 