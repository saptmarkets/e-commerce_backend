import React, { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import OrderServices from '@services/OrderServices';
import { notifySuccess, notifyError } from '@utils/toast';
import NeonSpinner from '@components/preloader/NeonSpinner';

const CancelOrderButton = ({ order, onCancelSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if order can be cancelled
  const canCancel = order.status === 'Pending' || order.status === 'Processing';

  if (!canCancel) {
    return null;
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      notifyError('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    try {
      const response = await OrderServices.cancelOrder(order._id, cancelReason);
      
      notifySuccess('Order cancelled successfully');
      setIsModalOpen(false);
      setCancelReason('');
      
      if (onCancelSuccess) {
        onCancelSuccess(response);
      }
      
      // Reload the page to show updated status
      window.location.reload();
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      notifyError(error?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
      >
        <FiX className="mr-2" />
        Cancel Order
      </button>

      {/* Cancel Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-red-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Order #{order.invoice}
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              
              {order.loyaltyPointsUsed > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <p className="text-purple-700 text-sm">
                    <strong>Note:</strong> {order.loyaltyPointsUsed} loyalty points used in this order will be restored to your account.
                  </p>
                </div>
              )}
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                disabled={isLoading}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading || !cancelReason.trim()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <NeonSpinner size="xs" className="mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelOrderButton; 