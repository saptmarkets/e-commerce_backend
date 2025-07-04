import React from 'react';
import { FiMapPin, FiNavigation, FiCopy, FiExternalLink } from 'react-icons/fi';

const DeliveryLocationCard = ({ order }) => {
  const deliveryLocation = order?.user_info?.deliveryLocation;
  const address = order?.user_info?.address;
  const customerName = order?.user_info?.name;
  const customerContact = order?.user_info?.contact;

  // If no location data, show basic address
  if (!deliveryLocation?.googleMapsLink) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <FiMapPin className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-semibold text-gray-700">Delivery Address</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">{address}</p>
        <p className="text-xs text-gray-500">No GPS location available</p>
      </div>
    );
  }

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(deliveryLocation.googleMapsLink);
    alert('Location link copied! You can paste it in any map app.');
  };

  const handleOpenGoogleMaps = () => {
    window.open(deliveryLocation.googleMapsLink, '_blank');
  };

  const handleGetDirections = () => {
    // Try to open in Google Maps app first, fallback to web
    const mapsAppLink = `comgooglemaps://?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    const webLink = deliveryLocation.googleMapsLink;
    
    // Try app first
    const link = document.createElement('a');
    link.href = mapsAppLink;
    link.click();
    
    // Fallback to web after 1 second if app doesn't open
    setTimeout(() => {
      window.open(webLink, '_blank');
    }, 1000);
  };

  return (
    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <FiMapPin className="w-5 h-5 text-emerald-600 mr-2" />
          <h3 className="font-semibold text-emerald-800">📍 Customer Location</h3>
        </div>
        <div className="flex items-center text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
          GPS Tracked
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-3 p-2 bg-white rounded border border-emerald-100">
        <p className="font-medium text-gray-800">{customerName}</p>
        <p className="text-sm text-gray-600">{customerContact}</p>
        <p className="text-sm text-gray-600 mt-1">{address}</p>
      </div>

      {/* Location Details */}
      <div className="mb-3 text-sm text-emerald-700">
        <div className="flex justify-between items-center">
          <span>📊 Coordinates:</span>
          <span className="font-mono text-xs">
            {deliveryLocation.latitude?.toFixed(6)}, {deliveryLocation.longitude?.toFixed(6)}
          </span>
        </div>
        {deliveryLocation.accuracy && (
          <div className="flex justify-between items-center mt-1">
            <span>🎯 Accuracy:</span>
            <span className="text-xs">±{Math.round(deliveryLocation.accuracy)}m</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Get Directions */}
        <button
          onClick={handleGetDirections}
          className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FiNavigation className="w-4 h-4 mr-2" />
          Navigate
        </button>

        {/* Open in Google Maps */}
        <button
          onClick={handleOpenGoogleMaps}
          className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <FiExternalLink className="w-4 h-4 mr-2" />
          Open Maps
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLocation}
          className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          <FiCopy className="w-4 h-4 mr-2" />
          Copy Link
        </button>
      </div>

      {/* Alternative Links */}
      <div className="mt-3 pt-3 border-t border-emerald-200">
        <p className="text-xs text-emerald-600 mb-2">Alternative navigation options:</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://waze.com/ul?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            🚗 Waze
          </a>
          <a
            href={`https://maps.apple.com/?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-900 transition-colors"
          >
            🍎 Apple Maps
          </a>
          <a
            href={deliveryLocation.googleMapsAddressLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
          >
            📍 Search Address
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 <strong>For Delivery:</strong> Click "Navigate" for turn-by-turn directions, or "Open Maps" to view the location. 
          The customer's exact GPS coordinates will guide you to their door.
        </p>
      </div>
    </div>
  );
};

export default DeliveryLocationCard; 