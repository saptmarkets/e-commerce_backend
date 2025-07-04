import React, { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiCheckCircle } from 'react-icons/fi';
import httpService from '@/services/httpService';

const DeliveryProgressIndicator = ({ orderId, orderStatus }) => {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderStatus === 'Processing' || orderStatus === 'Out for Delivery') {
      fetchDeliveryInfo();
    }
  }, [orderId, orderStatus]);

  const fetchDeliveryInfo = async () => {
    try {
      setLoading(true);
      const response = await httpService.get(`/delivery/order/${orderId}`);
      setDeliveryInfo(response.data);
    } catch (error) {
      console.warn('Failed to fetch delivery info:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!deliveryInfo || loading) {
    return null;
  }

  const { productChecklist } = deliveryInfo;
  const totalProducts = productChecklist?.length || 0;
  const collectedProducts = productChecklist?.filter(item => item.collected).length || 0;
  const progressPercentage = totalProducts > 0 ? Math.round((collectedProducts / totalProducts) * 100) : 0;

  return (
    <div className="text-xs mt-1">
      <div className="flex items-center space-x-1">
        <FiPackage size={12} className="text-blue-600" />
        <span className="text-blue-600 font-medium">
          {collectedProducts}/{totalProducts} collected
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div 
          className={`h-1.5 rounded-full ${
            progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default DeliveryProgressIndicator; 