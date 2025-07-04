import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@windmill/react-ui';
import { FiX, FiTruck, FiPackage, FiMapPin } from 'react-icons/fi';
import DeliveryTodoList from '../delivery/DeliveryTodoList';

const OrderDetailsModal = ({ isOpen, onClose, orderId, orderData }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showDeliveryTodo, setShowDeliveryTodo] = useState(false);

  useEffect(() => {
    // Show delivery todo list if order is in processing or out for delivery
    if (orderData && (orderData.status === 'Processing' || orderData.status === 'Out for Delivery')) {
      setShowDeliveryTodo(true);
      setActiveTab('delivery');
    } else {
      setShowDeliveryTodo(false);
      setActiveTab('details');
    }
  }, [orderData]);

  const handleStatusChange = (newStatus) => {
    // Refresh the parent component or handle status change
    console.log('Order status changed to:', newStatus);
    // You can add callback to parent component here
  };

  if (!isOpen || !orderData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-4xl">
      <ModalHeader className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Order #{orderData.invoice}</h2>
          <p className="text-sm text-gray-600">Status: {orderData.status}</p>
        </div>
        <Button layout="link" onClick={onClose}>
          <FiX className="w-5 h-5" />
        </Button>
      </ModalHeader>

      <ModalBody className="max-h-96 overflow-y-auto">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            <FiPackage className="inline mr-2" />
            Order Details
          </button>
          
          {showDeliveryTodo && (
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'delivery'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('delivery')}
            >
              <FiTruck className="inline mr-2" />
              Delivery Todo
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <FiMapPin className="mr-2" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Name:</strong> {orderData.user_info?.name}</p>
                <p><strong>Contact:</strong> {orderData.user_info?.contact}</p>
                <p><strong>Email:</strong> {orderData.user_info?.email}</p>
                <p><strong>Payment:</strong> {orderData.paymentMethod}</p>
                <div className="col-span-full">
                  <p><strong>Address:</strong> {orderData.user_info?.address}</p>
                </div>
              </div>
              
              {/* Verification Code Display */}
              {orderData.verificationCode && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-sm font-medium text-yellow-800">
                    🔐 Verification Code: <span className="font-mono text-lg">{orderData.verificationCode}</span>
                  </p>
                  <p className="text-xs text-yellow-600">
                    {orderData.verificationCodeUsed ? 'Code has been used ✓' : 'Customer must provide this code for delivery'}
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <div className="space-y-2">
                {orderData.cart?.map((item, index) => (
                  <div key={index} className="flex items-center p-3 border rounded">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded mr-3"
                      />
                    )}
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>
                            Quantity: {item.quantity}
                            {item.unitName && ` × ${item.unitName}`}
                          </span>
                          <span>Price: {item.price} SAR</span>
                        </div>
                        
                        {/* Multi-unit information */}
                        {item.packQty > 1 && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Pack Size: {item.packQty} pieces per {item.unitName || 'unit'}
                            {' • '}Total Pieces: {item.quantity * item.packQty}
                          </div>
                        )}
                        
                        {/* SKU information */}
                        {item.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{(item.quantity * item.price).toFixed(2)} SAR</p>
                      {/* Price per piece for multi-unit items */}
                      {item.packQty > 1 && (
                        <p className="text-xs text-gray-500">
                          {(item.price / item.packQty).toFixed(2)} SAR/pc
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{orderData.subTotal} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{orderData.shippingCost} SAR</span>
                </div>
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{orderData.discount} SAR</span>
                  </div>
                )}
                {orderData.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Loyalty Discount:</span>
                    <span>-{orderData.loyaltyDiscount} SAR</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-1">
                  <span>Total:</span>
                  <span>{orderData.total} SAR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && showDeliveryTodo && (
          <DeliveryTodoList 
            orderId={orderId} 
            onStatusChange={handleStatusChange}
          />
        )}
      </ModalBody>

      <ModalFooter>
        <Button layout="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default OrderDetailsModal; 