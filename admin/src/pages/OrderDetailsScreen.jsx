import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select
} from '@windmill/react-ui';
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiPhone,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiCircle,
  FiTruck,
  FiCheck,
  FiX,
  FiEdit,
  FiSave
} from 'react-icons/fi';

import PageTitle from '../components/Typography/PageTitle';
import OrderServices from '../services/OrderServices';
import DeliveryServices from '../services/DeliveryServices';
import CustomerServices from '../services/CustomerServices';
import Loading from '../components/preloader/Loading';

const DisplayIcon = ({ emoji, size, color }) => (
  <span style={{ fontSize: size, color }} role="img" aria-label="icon">
    {emoji}
  </span>
);

DisplayIcon.propTypes = {
  emoji: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  color: PropTypes.string
};

const OrderDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [drivers, setDrivers] = useState([]);
  
  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  // Form states
  const [selectedDriver, setSelectedDriver] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Checklist state
  const [productChecklist, setProductChecklist] = useState([]);

  useEffect(() => {
    fetchOrderDetails();
    fetchDrivers();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await OrderServices.getOrderById(id);
      const orderData = response.data || response;
      setOrder(orderData);
      setProductChecklist(orderData.deliveryInfo?.productChecklist || []);
      setDeliveryNotes(orderData.deliveryInfo?.deliveryNotes || '');
      
      // Fetch latest customer data if customer ID is available
      if (orderData.user) {
        try {
          const customerResponse = await CustomerServices.getCustomerById(orderData.user);
          setCustomer(customerResponse);
        } catch (customerError) {
          console.warn('Could not fetch customer data:', customerError);
          setCustomer(null);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await DeliveryServices.getAllDrivers({ status: 'Active' });
      const driversData = response.data || response;
      setDrivers(driversData?.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      setUpdating(true);
      await DeliveryServices.assignOrderToDriver({
        orderId: order._id,
        driverId: selectedDriver,
        priority: 'medium'
      });
      
      setIsAssignModalOpen(false);
      fetchOrderDetails();
      alert('Driver assigned successfully!');
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Failed to assign driver');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    try {
      setUpdating(true);
      await OrderServices.updateOrder(order._id, { status: newStatus });
      
      setIsStatusModalOpen(false);
      fetchOrderDetails();
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleProductToggle = async (productId, collected) => {
    try {
      await DeliveryServices.markProductCollected(order._id, productId, collected);
      
      // Update local state
      setProductChecklist(prev => 
        prev.map(item => 
          item.productId === productId 
            ? { ...item, collected, collectedAt: collected ? new Date() : null }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status');
    }
  };

  const handleMarkOutForDelivery = async () => {
    try {
      setUpdating(true);
      await DeliveryServices.markOutForDelivery(order._id);
      fetchOrderDetails();
      alert('Order marked as out for delivery!');
    } catch (error) {
      console.error('Error marking out for delivery:', error);
      alert('Failed to mark order as out for delivery');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!verificationCode.trim()) {
      alert('Please enter verification code');
      return;
    }
    
    try {
      setUpdating(true);
      await DeliveryServices.completeDelivery(order._id, verificationCode);
      setIsVerificationModalOpen(false);
      fetchOrderDetails();
      alert('Delivery completed successfully!');
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Failed to complete delivery. Please check the verification code.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'primary';
      case 'Out for Delivery': return 'secondary';
      case 'Delivered': return 'success';
      case 'Cancel': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusActions = () => {
    if (!order) return [];
    
    const actions = [];
    
    switch (order.status) {
      case 'Pending':
        if (!order.deliveryInfo?.assignedDriver) {
          actions.push({
            label: 'Assign Driver',
            action: () => setIsAssignModalOpen(true),
            icon: FiUser,
            color: 'primary'
          });
        }
        actions.push({
          label: 'Start Processing',
          action: () => handleStatusUpdate('Processing'),
          icon: FiTruck,
          color: 'success'
        });
        break;
        
      case 'Processing':
        const allCollected = productChecklist.every(item => item.collected);
        if (allCollected && productChecklist.length > 0) {
          actions.push({
            label: 'Mark Out for Delivery',
            action: handleMarkOutForDelivery,
            icon: FiTruck,
            color: 'primary'
          });
        }
        break;
        
      case 'Out for Delivery':
        actions.push({
          label: 'Complete Delivery',
          action: () => setIsVerificationModalOpen(true),
          icon: FiCheckCircle,
          color: 'success'
        });
        break;
    }
    
    return actions;
  };

  if (loading) return <Loading loading={loading} />;
  if (!order) return <div>Order not found</div>;

  const collectedCount = productChecklist.filter(item => item.collected).length;
  const totalCount = productChecklist.length;
  const collectionProgress = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;

  return (
    <>
      <div className="flex items-center mb-6">
        <Button
          size="small"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <FiArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <PageTitle>Order #{order.invoice}</PageTitle>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        {/* Order Status Card */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Order Status</h4>
              <Badge type={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FiClock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center">
                <FiDollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  Total: ${order.total}
                </span>
              </div>
              
              <div className="flex items-center">
                <FiPackage className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  Payment: {order.paymentMethod}
                </span>
              </div>
            </div>
            
            {/* Status Actions */}
            <div className="mt-4 space-y-2">
              {getStatusActions().map((action, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={action.action}
                  disabled={updating}
                  className="w-full"
                >
                  <action.icon className="w-4 h-4 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Customer Info Card */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">Customer Information</h4>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FiUser className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {customer?.name || order.user_info?.name || 'Unknown Customer'}
                </span>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {customer?.phone || order.user_info?.contact || 'N/A'}
                </span>
              </div>
              
              <div className="flex items-start">
                <FiMapPin className="w-4 h-4 mr-2 text-gray-500 mt-1" />
                <span className="text-sm">
                  {customer?.address || order.user_info?.address || 'N/A'}
                  {(customer?.city || order.user_info?.city) && 
                    `, ${customer?.city || order.user_info?.city}`
                  }
                </span>
              </div>
              
              {customer && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  <span className="text-green-600">✓</span> Latest customer info
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Driver Info Card */}
        <Card>
          <CardBody>
            <h4 className="text-lg font-semibold mb-4">Driver Assignment</h4>
            
            {order.deliveryInfo?.assignedDriver ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiUser className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm">
                    {/* Driver name would need to be populated */}
                    Driver Assigned
                  </span>
                </div>
                
                {order.deliveryInfo.assignedAt && (
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      Assigned: {new Date(order.deliveryInfo.assignedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No driver assigned</p>
                <Button
                  size="small"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  <FiUser className="w-4 h-4 mr-1" />
                  Assign Driver
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Product Checklist */}
      {order.status === 'Processing' && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center">
                <FiPackage className="mr-2" />
                Product Collection Checklist
              </h4>
              <div className="text-sm text-gray-600">
                {collectedCount} / {totalCount} collected ({Math.round(collectionProgress)}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${collectionProgress}%` }}
              ></div>
            </div>

            {productChecklist.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiPackage className="mx-auto mb-2" size={48} />
                <p>No products in checklist</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productChecklist.map((item, index) => (
                  <div
                    key={item.productId || index}
                    className={`flex items-center p-3 border rounded-lg transition-colors ${
                      item.collected ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {item.image ? (
                        <img
                          src={typeof item.image === 'string' ? item.image : (Array.isArray(item.image) ? item.image[0] : '')}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <FiPackage className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <h5 className="font-medium text-gray-800">{item.title}</h5>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.collectedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Collected: {new Date(item.collectedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        size="small"
                        onClick={() => handleProductToggle(item.productId, !item.collected)}
                        className={`${
                          item.collected
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {item.collected ? (
                          <FiCheckCircle className="w-4 h-4" />
                        ) : (
                          <FiCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collection Status */}
            {totalCount > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  {collectedCount === totalCount ? (
                    <span className="flex items-center">
                      <FiCheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      All items collected! Ready for delivery.
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FiClock className="w-4 h-4 mr-2 text-blue-600" />
                      {totalCount - collectedCount} item(s) remaining to collect
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardBody>
          <h4 className="text-lg font-semibold mb-4">Order Items</h4>
          
          <div className="space-y-3">
            {order.cart?.map((item, index) => (
              <div key={index} className="flex items-center p-3 border rounded-lg">
                <div className="flex-shrink-0 mr-3">
                  {item.image ? (
                    <img
                      src={typeof item.image === 'string' ? item.image : (Array.isArray(item.image) ? item.image[0] : '')}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <FiPackage className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <h5 className="font-medium text-gray-800">{item.title}</h5>
                  <p className="text-sm text-gray-600">
                    ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${order.shippingCost}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${order.total}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assign Driver Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
        <ModalHeader>Assign Driver to Order</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Driver
              </label>
              <Select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">Choose a driver</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name?.en || driver.name} - {driver.phone}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="w-full sm:w-auto"
            layout="outline"
            onClick={() => setIsAssignModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleAssignDriver}
            disabled={!selectedDriver || updating}
          >
            Assign Driver
          </Button>
        </ModalFooter>
      </Modal>

      {/* Verification Code Modal */}
      <Modal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)}>
        <ModalHeader>Complete Delivery</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter customer's verification code"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ask the customer for their verification code to complete the delivery
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="w-full sm:w-auto"
            layout="outline"
            onClick={() => setIsVerificationModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleCompleteDelivery}
            disabled={!verificationCode.trim() || updating}
          >
            Complete Delivery
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default OrderDetailsScreen; 