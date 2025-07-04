import React from 'react';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import Tooltip from '@/components/tooltip/Tooltip';

const DeliveryLocationIndicator = ({ order }) => {
  const deliveryLocation = order?.user_info?.deliveryLocation;
  const hasGPSLocation = deliveryLocation?.googleMapsLink;

  const handleQuickNavigate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasGPSLocation) {
      // Open Google Maps directly
      window.open(deliveryLocation.googleMapsLink, '_blank');
    }
  };

  const handleCopyLocation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasGPSLocation) {
      navigator.clipboard.writeText(deliveryLocation.googleMapsLink);
      alert('GPS location copied! Share with delivery driver.');
    }
  };

  if (!hasGPSLocation) {
    return (
      <div className="flex items-center">
        <Tooltip
          id={`no-gps-${order._id}`}
          Icon={FiMapPin}
          title="No GPS location - Manual delivery"
          bgColor="#6B7280"
          iconColorClass="text-gray-500"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {/* GPS Available Indicator */}
      <Tooltip
        id={`gps-available-${order._id}`}
        Icon={FiMapPin}
        title="GPS location available"
        bgColor="#059669"
        iconColorClass="text-emerald-600"
      />
      
      {/* Quick Navigate Button */}
      <button
        onClick={handleQuickNavigate}
        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
        title="Open in Google Maps"
      >
        <FiNavigation className="w-4 h-4" />
      </button>
      
      {/* Quick Copy Button */}
      <button
        onClick={handleCopyLocation}
        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-1 rounded transition-colors"
        title="Copy GPS link"
      >
        📍
      </button>
    </div>
  );
};

export default DeliveryLocationIndicator; 