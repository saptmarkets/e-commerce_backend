import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Badge } from '@windmill/react-ui';
import { FiPackage, FiCheck, FiX, FiTruck, FiMapPin, FiUser, FiPhone } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import DeliveryServices from '@/services/DeliveryServices';
import { notifySuccess, notifyError } from '@/utils/toast';

const DeliveryTodoList = ({ orderId, onStatusChange }) => {
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Fetch order details with product checklist
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await DeliveryServices.getOrderForDelivery(orderId);
      console.log('Delivery order data:', response);
      setOrderData(response);
      setRecipientName(response.customer?.name || '');
    } catch (error) {
      console.error('Error fetching order details:', error);
      notifyError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Mark product as collected/uncollected
  const toggleProductCollection = async (productId, collected) => {
    try {
      setUpdating(true);
      await DeliveryServices.markProductCollected(orderId, productId, collected);
      await fetchOrderDetails();
      notifySuccess(`Product ${collected ? 'collected' : 'uncollected'} successfully`);
    } catch (error) {
      console.error('Error updating product collection:', error);
      notifyError('Failed to update product collection');
    } finally {
      setUpdating(false);
    }
  };

  // Mark order as out for delivery
  const markOutForDelivery = async () => {
    try {
      setUpdating(true);
      await DeliveryServices.markOutForDelivery(orderId);
      await fetchOrderDetails();
      if (onStatusChange) onStatusChange();
      notifySuccess('Order marked as out for delivery');
    } catch (error) {
      console.error('Error marking out for delivery:', error);
      notifyError('Failed to mark order as out for delivery');
    } finally {
      setUpdating(false);
    }
  };

  // Complete delivery
  const completeDelivery = async () => {
    if (!verificationCode.trim()) {
      notifyError('Please enter verification code');
      return;
    }

    try {
      setUpdating(true);
      await DeliveryServices.completeDelivery(orderId, verificationCode, deliveryNotes, recipientName);
      await fetchOrderDetails();
      if (onStatusChange) onStatusChange();
      notifySuccess('Delivery completed successfully');
      setVerificationCode('');
      setDeliveryNotes('');
    } catch (error) {
      console.error('Error completing delivery:', error);
      notifyError('Failed to complete delivery. Please check verification code.');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading order details...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!orderData) {
    return (
      <Card className="mb-4">
        <CardBody>
          <p className="text-center text-gray-500">Order not found</p>
        </CardBody>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'primary';
      case 'Out for Delivery': return 'success';
      case 'Delivered': return 'success';
      default: return 'neutral';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Delivered":
        return "Delivered";
      case "Processing":
        return "Processing";
      case "Pending":
        return "Pending";
      case "Received":
        return "Received";
      case "Out for Delivery":
        return "OutForDelivery";
      case "Cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Get product checklist from the API response
  const productChecklist = orderData.productChecklist || [];
  const collectedCount = productChecklist.filter(item => item.collected).length;
  const totalCount = productChecklist.length;
  const allItemsCollected = orderData.allItemsCollected || (totalCount > 0 && collectedCount === totalCount);

  // Helper function to format product display with pack quantity
  const formatProductDisplay = (item) => {
    const unitName = item.unitName || 'pcs';
    const packQty = item.packQty || 1;
    const quantity = item.quantity || 1;
    
    if (packQty > 1) {
      const totalPieces = quantity * packQty;
      return {
        displayText: `${item.title}`,
        quantityText: `${quantity} ${unitName} (${packQty} pcs each)`,
        totalPiecesText: `Total: ${totalPieces} pieces`,
        hasMultiUnit: true
      };
    }
    
    return {
      displayText: item.title,
      quantityText: `${quantity} ${unitName}`,
      totalPiecesText: null,
      hasMultiUnit: false
    };
  };

  return (
    <div className="space-y-4">
      {/* Order Header */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Order #{orderData.invoice}</h3>
                              <Badge type={getStatusColor(orderData.status)}>{t(getStatusText(orderData.status))}</Badge>
              {/* Debug info for troubleshooting */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p><strong>Debug Info:</strong></p>
                  <p>Order ID: {orderData._id || orderData.orderId}</p>
                  <p>Invoice: {orderData.invoice}</p>
                  <p>Total: {orderData.total} SAR</p>
                  <p>SubTotal: {orderData.subTotal} SAR</p>
                  <p>Shipping: {orderData.shippingCost} SAR</p>
                  <p>Discount: {orderData.discount} SAR</p>
                  <p>Cart Items: {orderData.cart?.length || 0}</p>
                  <p>Checklist Items: {productChecklist.length}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total: {orderData.total} SAR</p>
              <p className="text-sm text-gray-600">{orderData.paymentMethod}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <FiUser className="mr-2 text-gray-500" />
              <span>{orderData.customer?.name}</span>
            </div>
            <div className="flex items-center">
              <FiPhone className="mr-2 text-gray-500" />
              <span>{orderData.customer?.contact}</span>
            </div>
            <div className="flex items-start col-span-full">
              <FiMapPin className="mr-2 text-gray-500 mt-1" />
              <span className="text-sm">{orderData.customer?.address}</span>
            </div>
          </div>

          {/* Verification Code Info (Hidden for Security) */}
          {orderData.verificationCode && orderData.status !== 'Delivered' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-800">
                🔐 Customer has a verification code for delivery completion
              </p>
              <p className="text-xs text-blue-600">
                Customer will provide the verification code when you arrive for delivery
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Product Checklist */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <FiPackage className="mr-2" />
              Product Checklist
            </h4>
            <div className="text-sm text-gray-600">
              {collectedCount} / {totalCount} collected
            </div>
          </div>

          {productChecklist.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiPackage className="mx-auto mb-2" size={48} />
              <p>No products found in checklist</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productChecklist.map((item, index) => {
                const productDisplay = formatProductDisplay(item);
                
                return (
                  <div key={item.productId || index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 mr-3">
                      {item.image ? (
                        <img 
                          src={item.image} 
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
                      <h5 className="font-medium text-gray-800">{productDisplay.displayText}</h5>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-blue-600">
                            {productDisplay.quantityText}
                          </span>
                          {productDisplay.hasMultiUnit && (
                            <span className="text-gray-500 text-xs">
                              {productDisplay.totalPiecesText}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.isComboItem && (
                        <p className="text-xs text-purple-600 mt-1">
                          🎁 {item.notes}
                        </p>
                      )}
                      {item.notes && !item.isComboItem && (
                        <p className="text-xs text-gray-500 mt-1">Notes: {item.notes}</p>
                      )}
                      {item.collectedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Collected: {new Date(item.collectedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Collection Status */}
                    <div className="flex-shrink-0 ml-3">
                      <button
                        onClick={() => toggleProductCollection(item.productId, !item.collected)}
                        disabled={updating}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          item.collected
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.collected ? (
                          <span className="flex items-center">
                            <FiCheck className="mr-1" size={12} />
                            Collected
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <FiX className="mr-1" size={12} />
                            Not Collected
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Collection Progress</span>
                <span>{Math.round((collectedCount / totalCount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(collectedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            {/* Processing Status Actions */}
            {orderData.status === 'Processing' && (
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Ready for Delivery?</h5>
                {allItemsCollected ? (
                  <Button
                    onClick={markOutForDelivery}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <FiTruck className="mr-2" />
                    {updating ? t("Processing") : 'Mark as Out for Delivery'}
                  </Button>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Please collect all items before marking as out for delivery
                    </p>
                    <p className="text-xs text-gray-500">
                      {collectedCount} of {totalCount} items collected
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Out for Delivery Status Actions */}
            {orderData.status === 'Out for Delivery' && (
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Complete Delivery</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter customer verification code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Who received the order?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Any additional notes about the delivery..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <Button
                    onClick={completeDelivery}
                    disabled={updating || !verificationCode.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <FiCheck className="mr-2" />
                    {updating ? 'Completing...' : 'Complete Delivery'}
                  </Button>
                </div>
              </div>
            )}

            {/* Delivered Status */}
            {orderData.status === 'Delivered' && (
              <div className="text-center py-4">
                <div className="text-green-600 mb-2">
                  <FiCheck size={32} className="mx-auto" />
                </div>
                <h5 className="font-medium text-green-800">Order Delivered Successfully</h5>
                <p className="text-sm text-gray-600 mt-1">
                  This order has been completed and delivered.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DeliveryTodoList; 