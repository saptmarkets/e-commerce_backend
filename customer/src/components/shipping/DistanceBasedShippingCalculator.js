import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiInfo, FiTarget } from 'react-icons/fi';
import DistanceService from '@services/DistanceService';

const DistanceBasedShippingCalculator = ({ 
  userLocation, 
  cartTotal = 0, 
  onShippingCostChange, 
  currency = 'SAR',
  storeSettings = null 
}) => {
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(null);
  const [shippingBreakdown, setShippingBreakdown] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default shipping settings if not provided
  const defaultSettings = {
    storeLocation: {
      latitude: 24.7136, // Riyadh default
      longitude: 46.6753
    },
    pricing: {
      baseCost: 10,
      costPerKm: 2,
      maxDeliveryDistance: 50
    },
    freeDelivery: {
      radius: 5,
      minOrderAmount: 100
    }
  };

  const settings = storeSettings || defaultSettings;

  useEffect(() => {
    console.log('DistanceBasedShippingCalculator - useEffect triggered');
    console.log('userLocation:', userLocation);
    console.log('settings:', settings);
    console.log('cartTotal:', cartTotal);
    
    // Add detailed settings debugging
    console.log('Settings breakdown:');
    console.log('- baseCost:', settings.pricing.baseCost);
    console.log('- costPerKm:', settings.pricing.costPerKm);
    console.log('- freeDelivery.radius:', settings.freeDelivery.radius);
    console.log('- freeDelivery.enabled:', settings.freeDelivery.enabled);
    
    // Calculate shipping even if cart is empty (for display purposes)
    if (userLocation && settings.storeLocation.latitude && settings.storeLocation.longitude) {
      console.log('All conditions met, calculating shipping...');
      calculateShipping();
    } else {
      console.log('Conditions not met for shipping calculation');
      console.log('userLocation exists:', !!userLocation);
      console.log('userLocation type:', typeof userLocation);
      console.log('userLocation details:', userLocation);
      console.log('store latitude:', settings.storeLocation.latitude);
      console.log('store longitude:', settings.storeLocation.longitude);
    }
  }, [userLocation, cartTotal, settings]);

  const calculateShipping = () => {
    console.log('calculateShipping function called');
    setLoading(true);
    setError('');

    try {
      // Calculate distance from store to customer
      console.log('Calculating distance between:');
      console.log('Store:', settings.storeLocation.latitude, settings.storeLocation.longitude);
      console.log('User:', userLocation.latitude, userLocation.longitude);
      
      const calculatedDistance = DistanceService.calculateDistance(
        settings.storeLocation.latitude,
        settings.storeLocation.longitude,
        userLocation.latitude,
        userLocation.longitude
      );
      
      console.log('Calculated distance:', calculatedDistance, 'km');

      // Calculate shipping cost
      const shippingSettings = {
        baseCost: settings.pricing.baseCost,
        costPerKm: settings.pricing.costPerKm,
        maxDeliveryDistance: settings.pricing.maxDeliveryDistance,
        freeDeliveryRadius: settings.freeDelivery.radius,
        minOrderFreeDelivery: settings.freeDelivery.minOrderAmount,
        freeShippingEnabled: settings.freeDelivery.enabled !== false // Default to true if not specified
      };
      
      console.log('Shipping settings being passed to DistanceService:');
      console.log('- baseCost:', shippingSettings.baseCost, '(type:', typeof shippingSettings.baseCost, ')');
      console.log('- costPerKm:', shippingSettings.costPerKm, '(type:', typeof shippingSettings.costPerKm, ')');
      console.log('- freeDeliveryRadius:', shippingSettings.freeDeliveryRadius, '(type:', typeof shippingSettings.freeDeliveryRadius, ')');
      console.log('- cartTotal:', cartTotal, '(type:', typeof cartTotal, ')');
      
      const shippingResult = DistanceService.calculateShippingCost(
        calculatedDistance,
        shippingSettings,
        cartTotal
      );

      console.log('Shipping calculation result:', shippingResult);
      console.log('Breakdown details:', shippingResult.breakdown);

      if (shippingResult.error) {
        setError(shippingResult.error);
        setShippingCost(0);
        setDistance(null);
        setShippingBreakdown(null);
      } else {
        setShippingCost(shippingResult.cost);
        setDistance(shippingResult.distance);
        setShippingBreakdown(shippingResult.breakdown);
        
        // Notify parent component about shipping cost change
        if (onShippingCostChange) {
          onShippingCostChange(shippingResult.cost);
        }
      }
    } catch (err) {
      setError('Failed to calculate shipping cost. Please try again.');
      setShippingCost(0);
    } finally {
      setLoading(false);
    }
  };

  if (!userLocation) {
    return (
      <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
        <div className="flex items-center">
          <FiMapPin className="text-yellow-600 mr-2" />
          <span className="text-sm font-medium text-yellow-800">
            📍 Please enable location to calculate shipping cost
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          Click "Get My Location for Delivery" button above to enable location-based shipping calculation.
        </p>
                  <div className="mt-2 text-xs text-gray-600">
            <strong>Shipping rates:</strong> Base {settings.pricing.baseCost} {currency} + {settings.pricing.costPerKm} {currency}/km
            <br />
            {settings.freeDelivery.enabled !== false ? (
              <span><strong>Free delivery:</strong> Within {settings.freeDelivery.radius}km or orders over {settings.freeDelivery.minOrderAmount} {currency}</span>
            ) : (
              <span className="text-orange-600"><strong>Note:</strong> Free delivery is currently disabled. All orders will be charged shipping cost.</span>
            )}
          </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm font-medium text-blue-800">
            Calculating shipping cost based on your location...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md border border-red-200">
        <div className="flex items-center">
          <FiInfo className="text-red-600 mr-2" />
          <span className="text-sm font-medium text-red-800">
            {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Shipping Card */}
      <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiTruck className="text-emerald-600 text-xl mr-3" />
            <div>
              <h6 className="font-serif font-medium text-sm text-gray-800">
                🚚 Distance-Based Delivery
              </h6>
              <p className="text-xs text-gray-600">
                {distance && `📍 ${distance}km from store • ${settings.pricing.costPerKm} ${currency}/km`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600">
              {shippingCost === 0 && settings.freeDelivery.enabled !== false ? (
                <span className="text-green-600">FREE</span>
              ) : (
                `${shippingCost} ${currency}`
              )}
            </div>
            <div className="text-xs text-gray-500">
              {shippingCost === 0 && settings.freeDelivery.enabled !== false ? 'Free delivery' : 'Delivery charge'}
            </div>
          </div>
        </div>
      </div>

      {/* Distance & Location Info */}
      {distance && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-700">
              <FiTarget className="mr-2" />
              <span>Your location is <strong>{distance}km</strong> from our store</span>
            </div>
            <div className="text-blue-600 font-mono text-xs">
              📍 {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Details */}
      {shippingBreakdown && (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <h6 className="text-xs font-semibold text-gray-700 mb-2 block">
            📊 Shipping Cost Breakdown:
          </h6>
          
          {shippingBreakdown.freeReason ? (
            <div className="text-xs text-green-600">
              🎁 <strong>{shippingBreakdown.freeReason}</strong>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Base shipping cost:</span>
                <span className="font-mono">{shippingBreakdown.baseCost} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Distance cost ({distance}km × {(shippingBreakdown.distanceCost / distance).toFixed(2)} {currency}/km):</span>
                <span className="font-mono">{Number(shippingBreakdown.distanceCost).toFixed(2)} {currency}</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total shipping cost:</span>
                <span className="font-mono">{Number(shippingBreakdown.totalCost || shippingBreakdown.baseCost + shippingBreakdown.distanceCost).toFixed(2)} {currency}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Free Delivery Promotion - Only show if free shipping is enabled */}
      {settings.freeDelivery.enabled !== false && settings.freeDelivery.minOrderAmount && cartTotal < settings.freeDelivery.minOrderAmount && shippingCost > 0 && (
        <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
          <div className="text-xs text-purple-700">
            💡 <strong>Get Free Delivery!</strong> Add {currency}{(settings.freeDelivery.minOrderAmount - cartTotal).toFixed(2)} more to your order for free delivery!
          </div>
        </div>
      )}

      {/* Free Delivery Zone Info - Only show if free shipping is enabled */}
      {settings.freeDelivery.enabled !== false && settings.freeDelivery.radius && distance && distance <= settings.freeDelivery.radius && shippingCost === 0 && (
        <div className="p-3 bg-green-50 rounded-md border border-green-200">
          <div className="text-xs text-green-700">
            🎉 <strong>You're in our free delivery zone!</strong> Enjoy free delivery for being within {settings.freeDelivery.radius}km of our store.
          </div>
        </div>
      )}

      {/* Free Shipping Disabled Notice */}
      {settings.freeDelivery.enabled === false && shippingCost > 0 && (
        <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
          <div className="text-xs text-orange-700">
            ℹ️ <strong>Free delivery is currently unavailable.</strong> All orders will be charged the calculated shipping cost.
          </div>
        </div>
      )}

      {/* Delivery Range Info */}
      {settings.pricing.maxDeliveryDistance && distance && (
        <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            📦 We deliver up to {settings.pricing.maxDeliveryDistance}km from our store • You're {distance}km away
          </div>
        </div>
      )}
    </div>
  );
};

export default DistanceBasedShippingCalculator; 