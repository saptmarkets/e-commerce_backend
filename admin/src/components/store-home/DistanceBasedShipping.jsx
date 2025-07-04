import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from "@windmill/react-ui";
import { FiSettings, FiMapPin, FiTarget } from "react-icons/fi";

//internal import
import Error from "@/components/form/others/Error";
import InputAreaTwo from "@/components/form/input/InputAreaTwo";
import spinnerLoadingImage from "@/assets/img/spinner.gif";

const DistanceBasedShipping = ({ register, errors, isSave, isSubmitting, setValue }) => {
  const { t } = useTranslation();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [detectedLocation, setDetectedLocation] = useState(null);

  // Get current location and auto-fill coordinates
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setDetectedLocation(coords);
        
        // Auto-fill the form fields
        if (setValue) {
          setValue('store_latitude', coords.latitude.toFixed(6));
          setValue('store_longitude', coords.longitude.toFixed(6));
        }

        // Try to get address for confirmation
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SaptMarkets-Admin-Panel'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Detected store location:', data.display_name);
          }
        } catch (error) {
          console.warn('Address lookup failed:', error);
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Unknown location error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        setLocationError(errorMessage);
      },
      options
    );
  };

  return (
    <>
      {/* Save Button */}
      <div className="sticky top-0 z-20 flex justify-end mb-4">
        {isSubmitting ? (
          <Button disabled={true} type="button" className="h-10 px-6">
            <img
              src={spinnerLoadingImage}
              alt="Loading"
              width={20}
              height={10}
            />
            <span className="font-serif ml-2 font-light">
              {t("Processing")}
            </span>
          </Button>
        ) : (
          <Button type="submit" className="h-10 px-6">
            {isSave ? t("SaveBtn") : t("UpdateBtn")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 font-sans">
        <div className="col-span-12">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 rounded-md">
            
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex md:text-lg text-base text-gray-800 font-semibold dark:text-gray-400 mb-3">
                <FiSettings className="mt-1 mr-2" />
                🚚 Distance-Based Shipping Configuration
              </div>
              <hr className="md:mb-6 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set up automatic shipping cost calculation based on distance from your store location.
              </p>
            </div>

            {/* Store Location Section */}
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-blue-800 dark:text-blue-300">
                  📍 Store Location (GPS Coordinates)
                </h3>
                
                {/* Auto-detect Location Button */}
                <Button
                  type="button"
                  size="small"
                  layout="outline"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center text-xs"
                >
                  {locationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                      Detecting...
                    </>
                  ) : (
                    <>
                      <FiTarget className="mr-1" />
                      Auto-Detect Location
                    </>
                  )}
                </Button>
              </div>

              {/* Location Status Messages */}
              {locationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center text-red-700 text-sm">
                    <FiMapPin className="mr-2" />
                    {locationError}
                  </div>
                </div>
              )}

              {detectedLocation && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-700 text-sm">
                    <FiMapPin className="mr-2" />
                    ✅ Location detected and filled automatically! 
                    <span className="ml-2 font-mono text-xs">
                      ({detectedLocation.latitude.toFixed(6)}, {detectedLocation.longitude.toFixed(6)})
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6">
                <div className="col-span-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Store Latitude *
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Store Latitude"
                    name="store_latitude"
                    type="number"
                    step="any"
                    placeholder="24.7136 (e.g., Riyadh)"
                    required={true}
                    min="-90"
                    max="90"
                  />
                  <Error errorName={errors.store_latitude} />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Click "Auto-Detect Location" above to fill automatically
                  </p>
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Store Longitude *
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Store Longitude"
                    name="store_longitude"
                    type="number"
                    step="any"
                    placeholder="46.6753 (e.g., Riyadh)"
                    required={true}
                    min="-180"
                    max="180"
                  />
                  <Error errorName={errors.store_longitude} />
                  <p className="text-xs text-gray-500 mt-1">
                    📍 Or use Google Maps → Right-click → "What's here?" for manual entry
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Cost Configuration */}
            <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h3 className="text-md font-semibold text-emerald-800 dark:text-emerald-300 mb-4">
                💰 Shipping Cost Structure
              </h3>
              <div className="grid grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6">
                <div className="col-span-4">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Base Shipping Cost (SAR) *
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Base Shipping Cost"
                    name="base_shipping_cost"
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    required={true}
                  />
                  <Error errorName={errors.base_shipping_cost} />
                  <p className="text-xs text-gray-500 mt-1">
                    Fixed cost added to every delivery
                  </p>
                </div>
                <div className="col-span-4">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Cost per Kilometer (SAR) *
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Cost per Kilometer"
                    name="cost_per_km"
                    type="number"
                    step="0.01"
                    placeholder="2.00"
                    required={true}
                  />
                  <Error errorName={errors.cost_per_km} />
                  <p className="text-xs text-gray-500 mt-1">
                    Additional cost per kilometer distance
                  </p>
                </div>
                <div className="col-span-4">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Maximum Delivery Distance (KM)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Maximum Delivery Distance"
                    name="max_delivery_distance"
                    type="number"
                    step="0.1"
                    placeholder="50"
                    required={false}
                  />
                  <Error errorName={errors.max_delivery_distance} />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for unlimited range
                  </p>
                </div>
              </div>
            </div>

            {/* Free Delivery Zone */}
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-yellow-800 dark:text-yellow-300">
                  🎁 Free Delivery Zone (Optional)
                </h3>
                
                {/* Free Shipping Toggle */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Enable Free Shipping
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("enable_free_shipping")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6">
                <div className="col-span-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Free Delivery Radius (KM)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Free Delivery Radius"
                    name="free_delivery_radius"
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    required={false}
                  />
                  <Error errorName={errors.free_delivery_radius} />
                  <p className="text-xs text-gray-500 mt-1">
                    Customers within this radius get free delivery
                  </p>
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Minimum Order for Free Delivery (SAR)
                  </label>
                  <InputAreaTwo
                    register={register}
                    label="Minimum Order for Free Delivery"
                    name="min_order_free_delivery"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    required={false}
                  />
                  <Error errorName={errors.min_order_free_delivery} />
                  <p className="text-xs text-gray-500 mt-1">
                    Free delivery for orders above this amount
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  💡 <strong>Toggle OFF</strong> to disable all free shipping options. Customers will always pay the calculated shipping cost regardless of distance or order amount.
                </p>
              </div>
            </div>

            {/* Calculation Example */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🧮 Shipping Calculation Example
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Base Cost:</span>
                  <span className="font-mono">10.00 SAR</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance (example):</span>
                  <span className="font-mono">15 KM</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance Cost (15 × 2.00):</span>
                  <span className="font-mono">30.00 SAR</span>
                </div>
                <hr className="border-gray-300 dark:border-gray-600" />
                <div className="flex justify-between font-semibold">
                  <span>Total Shipping:</span>
                  <span className="font-mono">40.00 SAR</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default DistanceBasedShipping; 