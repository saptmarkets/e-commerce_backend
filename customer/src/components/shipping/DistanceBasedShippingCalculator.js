
import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiInfo, FiTarget } from 'react-icons/fi';
import useTranslation from 'next-translate/useTranslation';
import DistanceService from '@services/DistanceService';

const DistanceBasedShippingCalculator = ({ 
  userLocation, 
  cartTotal = 0, 
  onShippingCostChange, 
  currency = 'SAR',
  storeSettings = null 
}) => {
  const { t, lang } = useTranslation();
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(null);
  const [shippingBreakdown, setShippingBreakdown] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Translation function
  const tr = (en, ar) => {
    const key = 'common:' + en.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    const translated = t(key);
    // If translation missing, next-translate returns the key itself.
    if (translated === key) {
      // Fallback based on current locale (ar vs others)
      return lang === 'ar' ? (ar || en) : en;
    }
    return translated;
  };

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
    // Calculate shipping even if cart is empty (for display purposes)
    if (userLocation && settings.storeLocation.latitude && settings.storeLocation.longitude) {
      calculateShipping();
    }
  }, [userLocation, cartTotal, settings]);

  const calculateShipping = () => {
    setLoading(true);
    setError('');

    try {
      // Calculate distance from store to customer
      const calculatedDistance = DistanceService.calculateDistance(
        settings.storeLocation.latitude,
        settings.storeLocation.longitude,
        userLocation.latitude,
        userLocation.longitude
      );

      // Calculate shipping cost
      const shippingSettings = {
        baseCost: settings.pricing.baseCost,
        costPerKm: settings.pricing.costPerKm,
        maxDeliveryDistance: settings.pricing.maxDeliveryDistance,
        freeDeliveryRadius: settings.freeDelivery.radius,
        minOrderFreeDelivery: settings.freeDelivery.minOrderAmount,
        freeShippingEnabled: settings.freeDelivery.enabled !== false // Default to true if not specified
      };
      
      const shippingResult = DistanceService.calculateShippingCost(
        calculatedDistance,
        shippingSettings,
        cartTotal
      );

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
      setError(tr('Failed to calculate shipping cost. Please try again.', 'فشل في حساب تكلفة الشحن. يرجى المحاولة مرة أخرى.'));
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
            📍 {tr('Please enable location to calculate shipping cost', 'يرجى تفعيل الموقع لحساب تكلفة الشحن')}
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          {tr('Click the "Get My Location for Delivery" button above to enable location-based shipping', 'انقر على زر "الحصول على موقعي للتوصيل" أعلاه لتفعيل حساب الشحن حسب الموقع')}
        </p>
                  <div className="mt-2 text-xs text-gray-600">
            <strong>{tr('Shipping rates:', 'أسعار الشحن:')}</strong> {tr('Base', 'قاعدة')} {settings.pricing.baseCost} {currency} + {settings.pricing.costPerKm} {currency}/{tr('km', 'كم')}
            <br />
            {settings.freeDelivery.enabled !== false ? (
              <span><strong>{tr('Free Delivery:', 'توصيل مجاني:')}</strong> {tr('Within', 'ضمن')} {settings.freeDelivery.radius}{tr('km or orders over', 'كم أو طلبات أكثر من')} {settings.freeDelivery.minOrderAmount} {currency}</span>
            ) : (
                              <span className="text-orange-600"><strong>{tr('Note:', 'ملاحظة:')}</strong> {tr('Free delivery is currently disabled. All orders will incur a shipping charge.', 'التوصيل المجاني معطل حالياً. جميع الطلبات سيتم تحصيل تكلفة شحن منها.')}</span>
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
            {tr('Calculating shipping cost based on your location...', 'جاري حساب تكلفة الشحن بناءً على موقعك...')}
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
                🚚 {tr('Distance-Based Delivery', 'التوصيل حسب المسافة')}
              </h6>
              <p className="text-xs text-gray-600">
                {distance && `📍 ${distance}${tr('km from store', 'كم من المتجر')} • ${settings.pricing.costPerKm} ${currency}/${tr('km', 'كم')}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600">
              {shippingCost === 0 && settings.freeDelivery.enabled !== false ? (
                <span className="text-green-600">{tr('FREE', 'مجاني')}</span>
              ) : (
                `${shippingCost} ${currency}`
              )}
            </div>
            <div className="text-xs text-gray-500">
              {shippingCost === 0 && settings.freeDelivery.enabled !== false ? tr('Free delivery', 'توصيل مجاني') : tr('Delivery charge', 'رسوم التوصيل')}
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
              <span>{tr('Your location is', 'موقعك على بعد')} <strong>{distance}{tr('km', 'كم')}</strong> {tr('from our store', 'من متجرنا')}</span>
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
            📊 {tr('Shipping Cost Breakdown:', 'تفصيل تكلفة الشحن:')}
          </h6>
          
          {shippingBreakdown.freeReason ? (
            <div className="text-xs text-green-600">
              🎁 <strong>{shippingBreakdown.freeReason}</strong>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>{tr('Base shipping cost:', 'تكلفة الشحن الأساسية:')}</span>
                <span className="font-mono">{shippingBreakdown.baseCost} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span>{tr('Distance cost', 'تكلفة المسافة')} ({distance}{tr('km', 'كم')} × {(shippingBreakdown.distanceCost / distance).toFixed(2)} {currency}/{tr('km', 'كم')}):</span>
                <span className="font-mono">{Number(shippingBreakdown.distanceCost).toFixed(2)} {currency}</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between font-semibold text-gray-800">
                <span>{tr('Total shipping cost:', 'إجمالي تكلفة الشحن:')}</span>
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
            💡 <strong>{tr('Get Free Delivery!', 'احصل على توصيل مجاني!')}</strong> {tr('Add', 'أضف')} {currency}{(settings.freeDelivery.minOrderAmount - cartTotal).toFixed(2)} {tr('more to your order for free delivery!', 'أكثر لطلبك للحصول على توصيل مجاني!')}
          </div>
        </div>
      )}

      {/* Free Delivery Zone Info - Only show if free shipping is enabled */}
      {settings.freeDelivery.enabled !== false && settings.freeDelivery.radius && distance && distance <= settings.freeDelivery.radius && shippingCost === 0 && (
        <div className="p-3 bg-green-50 rounded-md border border-green-200">
          <div className="text-xs text-green-700">
            🎉 <strong>{tr("You're in our free delivery zone!", 'أنت في منطقة التوصيل المجاني!')}</strong> {tr('Enjoy free delivery for being within', 'استمتع بالتوصيل المجاني لكونك ضمن')} {settings.freeDelivery.radius}{tr('km of our store.', 'كم من متجرنا.')}
          </div>
        </div>
      )}

      {/* Free Shipping Disabled Notice */}
      {settings.freeDelivery.enabled === false && shippingCost > 0 && (
        <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
          <div className="text-xs text-orange-700">
            ℹ️ <strong>{tr('Free delivery is currently unavailable.', 'التوصيل المجاني غير متوفر حالياً.')}</strong> {tr('All orders will be charged the calculated shipping cost.', 'جميع الطلبات سيتم تحصيل تكلفة الشحن المحسوبة منها.')}
          </div>
        </div>
      )}

      {/* Delivery Range Info */}
      {settings.pricing.maxDeliveryDistance && distance && (
        <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            📦 {tr('We deliver up to', 'نوصل حتى')} {settings.pricing.maxDeliveryDistance}{tr('km from our store', 'كم من متجرنا')} • {tr("You're", 'أنت على بعد')} {distance}{tr('km away', 'كم')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DistanceBasedShippingCalculator; 