import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  IoReturnUpBackOutline,
  IoArrowForward,
  IoBagHandle,
  IoWalletSharp,
} from "react-icons/io5";
import { FiStar, FiInfo } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { ImCreditCard } from "react-icons/im";
import useTranslation from "next-translate/useTranslation";

//internal import

import Layout from "@layout/Layout";
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import CartItem from "@components/cart/CartItem";
import InputArea from "@components/form/InputArea";
import useGetSetting from "@hooks/useGetSetting";
import InputShipping from "@components/form/InputShipping";
import InputPayment from "@components/form/InputPayment";
import useCheckoutSubmit from "@hooks/useCheckoutSubmit";
import useUtilsFunction from "@hooks/useUtilsFunction";
import SettingServices from "@services/SettingServices";
import LoyaltyServices from "@services/LoyaltyServices";
import SwitchToggle from "@components/form/SwitchToggle";
import { getUserSession } from "@lib/auth";
import LocationService from "@components/location/LocationService";
import useLocation from "@hooks/useLocation";
import DistanceBasedShippingCalculator from "@components/shipping/DistanceBasedShippingCalculator";

const Checkout = () => {
  const { t } = useTranslation();
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();
  const userInfo = getUserSession();
  
  // Location hook for getting user coordinates
  const { 
    location: hookLocation, 
    address: detectedAddress, 
    loading: locationLoading, 
    getLocationWithAddress,
    setLocation: setHookLocation
  } = useLocation();
  
  // Local location state for shipping calculator
  const [userLocation, setUserLocation] = useState(null);
  
  // Manual location address data state
  const [manualLocationData, setManualLocationData] = useState(null);
  
  // Shipping calculation state
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [calculationStatus, setCalculationStatus] = useState('');
  
  // GPS location data state (separate from userLocation for shipping)
  const [gpsLocationData, setGpsLocationData] = useState(null);
  const [manualLocationCoords, setManualLocationCoords] = useState(null);
  
  // Loyalty points state
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);
  
  // Location selection state
  const [selectedLocationOption, setSelectedLocationOption] = useState('manual');
  const [locationStatus, setLocationStatus] = useState('');

  const { data: storeSetting } = useQuery({
    queryKey: ["storeSetting"],
    queryFn: async () => await SettingServices.getStoreSetting(),
    staleTime: 4 * 60 * 1000, // Api request after 4 minutes
  });

  // Fetch loyalty points
  const { data: loyaltySummary } = useQuery({
    queryKey: ["loyaltySummary"],
    queryFn: async () => {
      if (!userInfo?.id) return null;
      return await LoyaltyServices.getLoyaltySummary();
    },
    enabled: !!userInfo?.id,
    staleTime: 2 * 60 * 1000,
  });

  const {
    error,
    couponInfo,
    couponRef,
    total,
    isEmpty,
    items,
    cartTotal,
    currency,
    register,
    setValue,
    errors,
    showCard,
    setShowCard,
    handleSubmit,
    submitHandler,
    handleShippingCost,
    handleCouponCode,
    discountAmount,
    shippingCost,
    isCheckoutSubmit,
    useExistingAddress,
    hasShippingAddress,
    isCouponAvailable,
    handleDefaultShippingAddress,
    // Add loyalty functions
    handleLoyaltyPointsRedemption,
    loyaltyDiscountAmount,
    setLoyaltyDiscountAmount,
  } = useCheckoutSubmit(storeSetting, loyaltySummary);

  // Set loyalty points when data is available
  useEffect(() => {
    if (loyaltySummary?.customer?.loyaltyPoints?.current) {
      setLoyaltyPoints(loyaltySummary.customer.loyaltyPoints.current);
      // Calculate max redeemable points (up to 50% of order total)
      const maxPoints = Math.min(
        loyaltySummary.customer.loyaltyPoints.current,
        Math.floor((cartTotal + shippingCost) * 0.5 / 0.01) // 50% of total, considering 1 point = 0.01 <span className="font-saudi_riyal">{currency}</span>
      );
      setMaxRedeemablePoints(maxPoints);
    }
  }, [loyaltySummary, cartTotal, shippingCost]);

  // Clear location data and calculation status when switching between location methods
  useEffect(() => {
    // Clear previous calculation results
    setCalculationStatus('');
    setIsCalculatingShipping(false);
    
    // Clear location data based on what's NOT selected
    if (selectedLocationOption !== 'gps') {
      setGpsLocationData(null);
    }
    if (selectedLocationOption !== 'manual') {
      setManualLocationCoords(null);
      setManualLocationData(null);
    }
    
    // Reset userLocation for shipping calculator
    setUserLocation(null);
    
    console.log(`Switched to ${selectedLocationOption} - cleared other location data`);
  }, [selectedLocationOption]);

 

  // Handle loyalty points input change
  const handlePointsChange = (e) => {
    const points = parseInt(e.target.value) || 0;
    const maxPoints = Math.min(maxRedeemablePoints, loyaltyPoints);
    
    if (points <= maxPoints) {
      setPointsToRedeem(points);
      const discount = points * 0.01; // 1 point = 0.01 <span className="font-saudi_riyal">{currency}</span>
      setLoyaltyDiscount(discount);
      if (handleLoyaltyPointsRedemption) {
        handleLoyaltyPointsRedemption(points, discount);
      }
    }
  };

  // Apply maximum points
  const applyMaxPoints = () => {
    const maxPoints = Math.min(maxRedeemablePoints, loyaltyPoints);
    setPointsToRedeem(maxPoints);
    const discount = maxPoints * 0.01;
    setLoyaltyDiscount(discount);
    if (handleLoyaltyPointsRedemption) {
      handleLoyaltyPointsRedemption(maxPoints, discount);
    }
  };

  // Reverse geocoding function for manual coordinates
  const reverseGeocodeManualCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SaptMarkets-App'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const addressComponents = extractAddressComponents(data);
        const formattedAddress = formatAddress(data);
        
        return {
          formattedAddress,
          addressComponents,
          googleMapsLink: `https://maps.google.com?q=${lat},${lng}`,
          rawData: data
        };
      } else {
        throw new Error('Geocoding API request failed');
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
      return null;
    }
  };

  // Format address from Nominatim response
  const formatAddress = (data) => {
    const addr = data.address || {};
    const parts = [];
    
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road) parts.push(addr.road);
    if (addr.neighbourhood) parts.push(addr.neighbourhood);
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }
    if (addr.country) parts.push(addr.country);
    
    return parts.join(', ') || data.display_name || 'Unknown location';
  };

  // Extract specific address components for form fields
  const extractAddressComponents = (data) => {
    const addr = data.address || {};
    
    return {
      houseNumber: addr.house_number || '',
      street: addr.road || '',
      neighbourhood: addr.neighbourhood || addr.suburb || '',
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      country: addr.country || 'Saudi Arabia',
      postcode: addr.postcode || '',
      // Create detailed street address
      streetAddress: [
        addr.house_number,
        addr.road,
        addr.neighbourhood || addr.suburb
      ].filter(Boolean).join(', ') || addr.road || 'Address not found',
    };
  };

  // Fill checkout form fields with manual location data
  const fillFormWithManualLocation = () => {
    if (!manualLocationData || !setValue) return;
    
    const components = manualLocationData.addressComponents;
    
    // Fill street address
    setValue('address', components.streetAddress, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    
    // Fill city
    setValue('city', components.city, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    
    // Fill country
    setValue('country', components.country, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    
    // Fill zip code if available
    if (components.postcode) {
      setValue('zipCode', components.postcode, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      });
    }
    
    alert('✅ Address fields filled successfully! Please review and modify if needed.');
  };

  // Manual shipping calculation based on selected location type
  const calculateShippingCost = () => {
    setIsCalculatingShipping(true);
    setCalculationStatus('Checking selected location and calculating...');
    
    let locationToUse = null;
    let locationSource = '';
    
    // Check which location method is selected and get coordinates
    switch (selectedLocationOption) {
      case 'profile':
        // Check multiple possible coordinate fields in user profile
        const profileLat = userInfo?.latitude || userInfo?.lat || userInfo?.coords?.latitude;
        const profileLng = userInfo?.longitude || userInfo?.lng || userInfo?.coords?.longitude;
        
        if (profileLat && profileLng) {
          locationToUse = {
            latitude: parseFloat(profileLat),
            longitude: parseFloat(profileLng),
            accuracy: 100
          };
          locationSource = 'Saved Address';
          console.log('Using profile coordinates:', { lat: profileLat, lng: profileLng });
        } else {
          setIsCalculatingShipping(false);
          setCalculationStatus('❌ No coordinates found in saved address. Please update your profile with location details or use GPS/Manual entry.');
          console.log('Profile data:', userInfo);
          return;
        }
        break;
        
      case 'gps':
        if (gpsLocationData?.latitude && gpsLocationData?.longitude) {
          locationToUse = {
            latitude: gpsLocationData.latitude,
            longitude: gpsLocationData.longitude,
            accuracy: gpsLocationData.accuracy || 10
          };
          locationSource = 'GPS Location';
          console.log('Using GPS coordinates:', gpsLocationData);
        } else {
          setIsCalculatingShipping(false);
          setCalculationStatus('❌ GPS location not detected. Please click "Get My Location" first.');
          return;
        }
        break;
        
      case 'manual':
        if (manualLocationCoords?.latitude && manualLocationCoords?.longitude) {
          locationToUse = {
            latitude: manualLocationCoords.latitude,
            longitude: manualLocationCoords.longitude,
            accuracy: 0
          };
          locationSource = 'Manual Coordinates';
          console.log('Using manual coordinates:', manualLocationCoords);
        } else {
          setIsCalculatingShipping(false);
          setCalculationStatus('❌ No manual coordinates set. Please enter coordinates and click "Get Location Info" first.');
          return;
        }
        break;
        
      default:
        setIsCalculatingShipping(false);
        setCalculationStatus('❌ Please select a location method first.');
        return;
    }
    
    if (locationToUse) {
      console.log(`Calculating shipping for ${locationSource}:`, locationToUse);
      
      // Set the location for shipping calculator
      setUserLocation({
        latitude: locationToUse.latitude,
        longitude: locationToUse.longitude,
        accuracy: locationToUse.accuracy,
        timestamp: Date.now()
      });
      
      // Show completion status after calculation
      setTimeout(() => {
        setIsCalculatingShipping(false);
        setCalculationStatus(`✅ Delivery cost calculated using ${locationSource} (${locationToUse.latitude.toFixed(4)}, ${locationToUse.longitude.toFixed(4)})`);
      }, 2000);
    }
  };

  // Handle location update from LocationService
  const handleLocationUpdate = (locationData) => {
    console.log('Location updated:', locationData);
    
    // Automatically select GPS option when location is detected
    setSelectedLocationOption('gps');
    setLocationStatus('GPS location detected and applied');
    
    // Store GPS location data separately
    if (locationData.latitude && locationData.longitude) {
      const gpsLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: Date.now()
      };
      
      console.log('Storing GPS location data:', gpsLocation);
      setGpsLocationData(gpsLocation);
      
      // Store coordinates globally for order submission
      window.userLocationCoords = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        googleMapsLink: locationData.googleMapsLink,
        googleMapsAddressLink: locationData.googleMapsAddressLink,
        address: locationData.address,
        addressComponents: locationData.addressComponents
      };
      
      // Also update the hook location if the function exists
      if (setHookLocation) {
        setHookLocation(gpsLocation);
      }
    }
    
    // Auto-fill address fields with detailed components
    if (locationData.addressComponents && setValue) {
      const components = locationData.addressComponents;
      
      // Fill street address with house number + street + neighbourhood
      if (components.streetAddress) {
        setValue('address', components.streetAddress, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      } else if (locationData.address) {
        setValue('address', locationData.address, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      
      // Fill city with exact city name
      if (components.city) {
        setValue('city', components.city, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      
      // Fill country (default to Saudi Arabia)
      setValue('country', components.country || 'Saudi Arabia', { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      });
      
      // Fill zip code if available
      if (components.postcode) {
        setValue('zipCode', components.postcode, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      
      console.log('✅ Location fields updated successfully');
    }
  };

  // Handle using profile default location
  const handleUseProfileLocation = () => {
    console.log('🔍 handleUseProfileLocation called');
    console.log('userInfo:', userInfo);
    console.log('setValue function:', setValue);
    console.log('setValue type:', typeof setValue);
    
    if (!userInfo) {
      console.warn('No user info available for profile location');
      return;
    }
    
    // Check if setValue is available
    if (!setValue) {
      console.error('setValue function not available');
      return;
    }
    
    try {
      // Set form values from user profile
      if (userInfo.address) {
        setValue('address', userInfo.address, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      if (userInfo.city) {
        setValue('city', userInfo.city, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      if (userInfo.country) {
        setValue('country', userInfo.country, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
      
      // If user has GPS coordinates saved, use them for shipping calculation
      if (userInfo.latitude && userInfo.longitude) {
        const profileLocation = {
          latitude: parseFloat(userInfo.latitude),
          longitude: parseFloat(userInfo.longitude),
          accuracy: 100, // Assumed accuracy for saved profile location
          timestamp: Date.now()
        };
        
        setUserLocation(profileLocation);
        
        // Store coordinates globally for order submission
        window.userLocationCoords = {
          latitude: profileLocation.latitude,
          longitude: profileLocation.longitude,
          accuracy: profileLocation.accuracy,
          googleMapsLink: `https://www.google.com/maps?q=${profileLocation.latitude},${profileLocation.longitude}`,
          googleMapsAddressLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userInfo.address)}`,
          address: userInfo.address,
          addressComponents: {
            city: userInfo.city,
            country: userInfo.country || 'Saudi Arabia'
          }
        };
        
        console.log('✅ Profile location with GPS coordinates applied');
      } else {
        console.log('✅ Profile location applied (address only, no GPS coordinates)');
      }
      
    } catch (error) {
      console.error('Error applying profile location:', error);
    }
  };

  return (
    <>
      <Layout title="Checkout" description="this is checkout page">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
          <div className="py-10 lg:py-12 px-0 2xl:max-w-screen-2xl w-full xl:max-w-screen-xl flex flex-col md:flex-row lg:flex-row">
            <div className="md:w-full lg:w-3/5 flex h-full flex-col order-2 sm:order-1 lg:order-1">
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit(submitHandler)}>
                  {hasShippingAddress && (
                    <div className="flex justify-end my-2">
                      <SwitchToggle
                        id="shipping-address"
                        title="Use Default Shipping Address"
                        processOption={useExistingAddress}
                        handleProcess={handleDefaultShippingAddress}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <h2 className="font-semibold font-serif text-base text-gray-700 pb-3">
                      01.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.personal_details
                      )}
                    </h2>

                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.first_name
                          )}
                          name="firstName"
                          type="text"
                          placeholder="John"
                          required={true}
                        />
                        <Error errorName={errors.firstName} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.last_name
                          )} (Optional)`}
                          name="lastName"
                          type="text"
                          placeholder="Doe"
                          required={false}
                        />
                        <Error errorName={errors.lastName} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.checkout_phone
                          )}
                          name="contact"
                          type="tel"
                          placeholder="+966-5xxxxxxxx"
                          defaultValue={userInfo?.phone || ""}
                          required={true}
                        />
                        <Error errorName={errors.contact} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.email_address
                          )} (Optional)`}
                          name="email"
                          type="email"
                          readOnly={false}
                          defaultValue={userInfo?.email || ""}
                          placeholder="youremail@gmail.com"
                          required={false}
                        />
                        <Error errorName={errors.email} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mt-12">
                    <h2 className="font-semibold font-serif text-base text-gray-700 pb-3">
                      02.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.shipping_details
                      )}
                    </h2>

                    {/* Horizontal Location Selection System */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        📍 Choose Your Delivery Location
                      </h3>
                      
                      {/* Horizontal Selection Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Saved Address Option */}
                        {userInfo?.address && (
                          <button
                            type="button"
                            onClick={() => {
                                  setSelectedLocationOption('profile');
                                  setLocationStatus('Using saved profile address');
                                  handleUseProfileLocation();
                                }}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              selectedLocationOption === 'profile'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <div className="text-3xl mb-2">🏠</div>
                            <div className="font-semibold text-sm">Saved Address</div>
                            <div className="text-xs mt-1 opacity-75">Use my profile location</div>
                          </button>
                        )}
                        
                        {/* GPS Location Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocationOption('gps');
                            setLocationStatus('GPS location detection mode');
                          }}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            selectedLocationOption === 'gps'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="text-3xl mb-2">📱</div>
                          <div className="font-semibold text-sm">Get My Location</div>
                          <div className="text-xs mt-1 opacity-75">Auto-detect GPS</div>
                        </button>
                        
                        {/* Manual Entry Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocationOption('manual');
                            setLocationStatus('Manual address entry mode');
                          }}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            selectedLocationOption === 'manual'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="text-3xl mb-2">🗺️</div>
                          <div className="font-semibold text-sm">Manual Entry</div>
                          <div className="text-xs mt-1 opacity-75">Enter coordinates</div>
                        </button>
                                </div>
                      
                      {/* Dynamic Information Container */}
                      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        {/* Saved Address Information */}
                        {selectedLocationOption === 'profile' && userInfo?.address && (
                          <div>
                            <div className="flex items-center mb-4">
                              <span className="text-2xl mr-3">🏠</span>
                              <h4 className="text-lg font-semibold text-gray-800">Your Saved Address</h4>
                              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-start">
                                  <span className="text-gray-500 text-sm w-20 mt-1">Address:</span>
                                  <span className="text-gray-800 font-medium flex-1">{userInfo.address}</span>
                                </div>
                                {userInfo.city && (
                                  <div className="flex items-start">
                                    <span className="text-gray-500 text-sm w-20 mt-1">City:</span>
                                    <span className="text-gray-800">{userInfo.city}</span>
                                  </div>
                                )}
                                {userInfo.country && (
                                  <div className="flex items-start">
                                    <span className="text-gray-500 text-sm w-20 mt-1">Country:</span>
                                    <span className="text-gray-800">{userInfo.country}</span>
                                  </div>
                                )}
                                {userInfo.zipCode && (
                                  <div className="flex items-start">
                                    <span className="text-gray-500 text-sm w-20 mt-1">ZIP:</span>
                                    <span className="text-gray-800">{userInfo.zipCode}</span>
                                  </div>
                                )}
                              </div>
                              <div className="bg-white p-4 rounded-lg border">
                                <div className="text-sm font-medium text-gray-700 mb-2">Delivery Information</div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>✅ Address verified from profile</div>
                                  <div>📦 Ready for delivery calculation</div>
                                  <div>🚚 Standard delivery rates apply</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* GPS Location Information */}
                        {selectedLocationOption === 'gps' && (
                          <div>
                            <div className="flex items-center mb-4">
                              <span className="text-2xl mr-3">📱</span>
                              <h4 className="text-lg font-semibold text-gray-800">GPS Location Detection</h4>
                              {userLocation && (
                                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Location Found</span>
                              )}
                                </div>
                            
                                                         {!gpsLocationData ? (
                               <div className="space-y-4">
                                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                   <div className="text-sm font-medium text-blue-800 mb-2">📍 Detect Your Current Location</div>
                                   <div className="text-xs text-blue-600 mb-4">
                                     • Most accurate delivery cost calculation<br/>
                                     • Automatic address field filling<br/>
                                     • Precise GPS coordinates for delivery driver<br/>
                                     • Works best with location services enabled
                                </div>
                                   <div className="flex flex-col gap-3">
                                     <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <LocationService 
                                  onLocationUpdate={handleLocationUpdate}
                                  className="w-full"
                                />
                              </div>
                                     <div className="text-xs text-blue-500 italic">
                                       💡 Allow location access when prompted by your browser for best results
                                  </div>
                                  </div>
                                 </div>
                               </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                 <div className="space-y-3">
                                   <div className="flex items-start">
                                     <span className="text-gray-500 text-sm w-24 mt-1">Coordinates:</span>
                                     <span className="text-gray-800 font-mono text-sm">{gpsLocationData.latitude?.toFixed(6)}, {gpsLocationData.longitude?.toFixed(6)}</span>
                                   </div>
                                   <div className="flex items-start">
                                     <span className="text-gray-500 text-sm w-24 mt-1">Accuracy:</span>
                                     <span className="text-gray-800">±{gpsLocationData.accuracy?.toFixed(0)} meters</span>
                                   </div>
                                  {window.userLocationCoords?.address && (
                                    <div className="flex items-start">
                                      <span className="text-gray-500 text-sm w-24 mt-1">Address:</span>
                                      <span className="text-gray-800 flex-1">{window.userLocationCoords.address}</span>
                                </div>
                              )}
                                  <div className="flex gap-2 mt-3">
                                    <a
                                      href={window.userLocationCoords?.googleMapsLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                                    >
                                      🗺️ View on Maps
                                    </a>
                                                                         <button
                                       type="button"
                                       onClick={() => {
                                         navigator.clipboard.writeText(`${gpsLocationData.latitude}, ${gpsLocationData.longitude}`);
                                         alert('📋 Coordinates copied to clipboard!');
                                       }}
                                       className="text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                                     >
                                       📋 Copy Coordinates
                                     </button>
                            </div>
                          </div>
                                <div className="bg-white p-4 rounded-lg border">
                                  <div className="text-sm font-medium text-green-700 mb-2">✅ GPS Location Active</div>
                                  <div className="text-xs text-green-600 space-y-1">
                                    <div>📍 Precise location detected</div>
                                    <div>🎯 Most accurate delivery cost</div>
                                    <div>🚚 Shared with delivery driver</div>
                                    <div>⚡ Address fields auto-filled</div>
                        </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Manual Entry Information */}
                        {selectedLocationOption === 'manual' && (
                          <div>
                            <div className="flex items-center mb-4">
                              <span className="text-2xl mr-3">🗺️</span>
                              <h4 className="text-lg font-semibold text-gray-800">Manual Location Entry</h4>
                              <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Manual Mode</span>
                              </div>
                            
                            <div className="space-y-4">
                              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="text-sm font-medium text-orange-800 mb-2">📍 How to get your exact coordinates:</div>
                                <div className="text-xs text-orange-700 space-y-2">
                                  <div className="flex items-start">
                                    <span className="mr-2">1.</span>
                                    <div>
                                      <strong>Open Google Maps</strong> on your phone or computer<br/>
                                      <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                        🔗 maps.google.com
                                      </a>
                              </div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">2.</span>
                                    <div><strong>Find your delivery location</strong> on the map</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">3.</span>
                                    <div><strong>Right-click</strong> (or press and hold on mobile) on the exact spot</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">4.</span>
                                    <div><strong>Copy the coordinates</strong> that appear (e.g., 24.7136, 46.6753)</div>
                                  </div>
                                  <div className="flex items-start">
                                    <span className="mr-2">5.</span>
                                    <div><strong>Paste them below</strong> and click "Get Location Info"</div>
                                  </div>
                                </div>
                              </div>
                              
                                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-3">
                                   <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                       Enter Coordinates (Latitude, Longitude)
                            </label>
                                     <div className="flex gap-2">
                                       <input
                                         type="text"
                                         id="manualCoordinates"
                                         placeholder="24.7136, 46.6753"
                                         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                       />
                                       <button
                                         type="button"
                                         onClick={async () => {
                                           const input = document.getElementById('manualCoordinates');
                                           const value = input.value.trim();
                                           
                                           if (!value) {
                                             alert('❌ Please enter coordinates first!');
                                             return;
                                           }
                                           
                                           const coords = value.split(',').map(coord => parseFloat(coord.trim()));
                                           if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                                             // Validate coordinate ranges
                                             if (coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180) {
                                               alert('❌ Invalid coordinates! Latitude must be between -90 and 90, Longitude between -180 and 180');
                                               return;
                                             }
                                             
                                             // Show loading state
                                             const button = document.querySelector('[data-manual-location-btn]');
                                             const originalText = button.textContent;
                                             button.textContent = '🔄 Getting Address...';
                                             button.disabled = true;
                                             
                                             try {
                                               // Fetch address details from coordinates
                                               const addressData = await reverseGeocodeManualCoords(coords[0], coords[1]);
                                               
                                               const locationData = {
                                                 latitude: coords[0],
                                                 longitude: coords[1],
                                                 accuracy: 0,
                                                 timestamp: Date.now()
                                               };
                                               
                                               // Store manual coordinates separately
                                               setManualLocationCoords(locationData);
                                               console.log('Storing manual coordinates:', locationData);
                                               
                                               if (addressData) {
                                                 // Store detailed address data
                                                 setManualLocationData(addressData);
                                                 
                                                 // Store coordinates globally for order submission
                                                 window.userLocationCoords = {
                                                   latitude: coords[0],
                                                   longitude: coords[1],
                                                   accuracy: 0,
                                                   googleMapsLink: addressData.googleMapsLink,
                                                   googleMapsAddressLink: addressData.googleMapsLink,
                                                   address: addressData.formattedAddress,
                                                   addressComponents: addressData.addressComponents
                                                 };
                                                 
                                                 setLocationStatus('Manual coordinates with address details loaded successfully');
                                               } else {
                                                 // Fallback if geocoding fails - still trigger calculation
                                                 window.userLocationCoords = {
                                                   latitude: coords[0],
                                                   longitude: coords[1],
                                                   accuracy: 0,
                                                   googleMapsLink: `https://maps.google.com?q=${coords[0]},${coords[1]}`,
                                                   googleMapsAddressLink: `https://maps.google.com/maps?q=${coords[0]},${coords[1]}`,
                                                   address: `Coordinates: ${coords[0]}, ${coords[1]}`,
                                                   addressComponents: null
                                                 };
                                                 setLocationStatus('Manual coordinates set (address lookup failed)');
                                               }
                                             } catch (error) {
                                               console.error('Error getting address:', error);
                                               alert('⚠️ Location set but failed to get address details. You can still use the coordinates.');
                                             } finally {
                                               // Restore button state
                                               button.textContent = originalText;
                                               button.disabled = false;
                                             }
                                           } else {
                                             alert('❌ Please enter valid coordinates in format: latitude, longitude (e.g., 24.7136, 46.6753)');
                                           }
                                         }}
                                         data-manual-location-btn
                                         className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors whitespace-nowrap disabled:opacity-50"
                                       >
                                         📍 Get Location Info
                                       </button>
                          </div>
                        </div>
                                  
                                                                     {manualLocationCoords && selectedLocationOption === 'manual' && (
                                     <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                       <div className="text-sm font-medium text-green-800 mb-2">✅ Location Found</div>
                                                                               <div className="text-xs text-green-600 mb-2">
                                          <strong>Coordinates:</strong> {manualLocationCoords.latitude?.toFixed(6)}, {manualLocationCoords.longitude?.toFixed(6)}
                      </div>

                                       {manualLocationData && (
                                         <div className="mb-3">
                                           <div className="text-xs font-medium text-green-800 mb-1">📍 Address Details:</div>
                                           <div className="text-xs text-green-700 space-y-1">
                                             {manualLocationData.addressComponents.streetAddress && (
                                               <div><strong>Street:</strong> {manualLocationData.addressComponents.streetAddress}</div>
                                             )}
                                             {manualLocationData.addressComponents.city && (
                                               <div><strong>City:</strong> {manualLocationData.addressComponents.city}</div>
                                             )}
                                             {manualLocationData.addressComponents.state && (
                                               <div><strong>State:</strong> {manualLocationData.addressComponents.state}</div>
                                             )}
                                             {manualLocationData.addressComponents.country && (
                                               <div><strong>Country:</strong> {manualLocationData.addressComponents.country}</div>
                                             )}
                                             {manualLocationData.addressComponents.postcode && (
                                               <div><strong>ZIP:</strong> {manualLocationData.addressComponents.postcode}</div>
                                             )}
                            </div>
                                         </div>
                                       )}
                                       
                                       <div className="flex flex-wrap gap-2">
                              <a
                                           href={`https://maps.google.com?q=${manualLocationCoords.latitude},${manualLocationCoords.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                           className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                              >
                                           🗺️ Verify on Maps
                              </a>
                                         
                                         {manualLocationData && (
                              <button
                                type="button"
                                             onClick={fillFormWithManualLocation}
                                             className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                           >
                                             📝 Fill Form Fields
                              </button>
                                         )}
                            </div>
                          </div>
                                   )}
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg border">
                                  <div className="text-sm font-medium text-gray-700 mb-2">⚠️ Important Notes</div>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div>📍 Use exact coordinates for accuracy</div>
                                    <div>🎯 Double-check location on map</div>
                                    <div>📱 GPS location is more accurate</div>
                                    <div>🚚 Delivery cost may be estimated</div>
                                  </div>
                                </div>
                              </div>
                          </div>
                        </div>
                      )}
                      </div>
                      
                      {/* Delivery Cost Information */}
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-2">💰 Delivery Cost Calculation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-xs text-emerald-700 space-y-1">
                            <div><strong>Base Cost:</strong> {storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost || 10} <span className="font-saudi_riyal">{currency}</span></div>
                            <div><strong>Per KM:</strong> {storeCustomizationSetting?.distanceBasedShipping?.cost_per_km || 2} <span className="font-saudi_riyal">{currency}</span></div>
                          {storeCustomizationSetting?.distanceBasedShipping?.enable_free_shipping !== false && (
                              <>
                                <div><strong>Free over:</strong> {storeCustomizationSetting?.distanceBasedShipping?.min_order_free_delivery || 100} <span className="font-saudi_riyal">{currency}</span></div>
                              </>
                          )}
                          </div>
                          <div className="text-xs text-emerald-600">
                            <div className="font-medium mb-1">Formula: Base + (Distance × Rate)</div>
                            <div>Example: {storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost || 10} <span className="font-saudi_riyal">{currency}</span> + (5 × {storeCustomizationSetting?.distanceBasedShipping?.cost_per_km || 2} <span className="font-saudi_riyal">{currency}</span>) = <span className="font-saudi_riyal">{currency}</span>{(storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost || 10) + (5 * (storeCustomizationSetting?.distanceBasedShipping?.cost_per_km || 2))}</div>
                        </div>
                      </div>
                      </div>
                      
                      {/* Calculate Shipping Button */}
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={calculateShippingCost}
                          disabled={isCalculatingShipping}
                          className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                            isCalculatingShipping
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
                          }`}
                        >
                          {isCalculatingShipping ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Calculating...
                            </>
                          ) : (
                            <>
                              🚚 Calculate Delivery Cost
                            </>
                          )}
                        </button>
                        <div className="text-xs text-gray-600 mt-2">
                          Click to calculate shipping cost based on your selected location method
                        </div>
                      </div>
                      
                      {/* Calculation Status */}
                      {calculationStatus && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          calculationStatus.includes('❌') 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-start">
                            <span className={`text-sm font-medium ${
                              calculationStatus.includes('❌') 
                                ? 'text-red-800' 
                                : 'text-green-800'
                            }`}>
                              {calculationStatus}
                            </span>
                          </div>
                          {!calculationStatus.includes('❌') && calculationStatus.includes('✅') && (
                            <div className="text-xs text-green-600 mt-1">
                              Check the "Distance-Based Shipping Calculator" section below for your exact delivery cost.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Address Form Fields */}
                    <div className="grid grid-cols-6 gap-6 mb-8">
                      <div className="col-span-6">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.street_address
                          )} *`}
                          name="address"
                          type="text"
                          placeholder="House No, Street Name, Area (e.g., Building 123, King Fahd Road, Al Malaz)"
                          required={true}
                        />
                        <Error errorName={errors.address} />
                      </div>

                      <div className="col-span-6 sm:col-span-6 lg:col-span-2">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.city
                          )} *`}
                          name="city"
                          type="text"
                          placeholder="Riyadh"
                          required={true}
                        />
                        <Error errorName={errors.city} />
                      </div>

                      <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.country
                          )}`}
                          name="country"
                          type="text"
                          placeholder="Saudi Arabia"
                          defaultValue="Saudi Arabia"
                          required={false}
                        />
                        <Error errorName={errors.country} />
                      </div>

                      <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                        <InputArea
                          register={register}
                          label={`${showingTranslateValue(
                            storeCustomizationSetting?.checkout?.zip_code
                          )} (Optional)`}
                          name="zipCode"
                          type="text"
                          placeholder="12345"
                          required={false}
                        />
                        <Error errorName={errors.zipCode} />
                      </div>
                    </div>

                    <Label
                      label={showingTranslateValue(
                        storeCustomizationSetting?.checkout?.shipping_cost
                      )}
                    />
                    
                    {/* Distance-Based Shipping Calculator */}
                    <div className="mb-6">
                      {/* Debug: Log the actual values being passed */}
                      {console.log('DEBUG: storeCustomizationSetting.distanceBasedShipping:', storeCustomizationSetting?.distanceBasedShipping)}
                      {console.log('DEBUG: base_shipping_cost:', storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost, 'type:', typeof storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost)}
                      {console.log('DEBUG: cost_per_km:', storeCustomizationSetting?.distanceBasedShipping?.cost_per_km, 'type:', typeof storeCustomizationSetting?.distanceBasedShipping?.cost_per_km)}
                      
                      <DistanceBasedShippingCalculator
                        userLocation={userLocation}
                        cartTotal={cartTotal}
                        onShippingCostChange={handleShippingCost}
                        currency={currency}
                        storeSettings={{
                          storeLocation: {
                            // Get from admin settings or use default coordinates
                            latitude: storeCustomizationSetting?.distanceBasedShipping?.store_latitude || 26.417740,
                            longitude: storeCustomizationSetting?.distanceBasedShipping?.store_longitude || 43.900413
                          },
                          pricing: {
                            baseCost: storeCustomizationSetting?.distanceBasedShipping?.base_shipping_cost || 10,
                            costPerKm: storeCustomizationSetting?.distanceBasedShipping?.cost_per_km || 2,
                            maxDeliveryDistance: storeCustomizationSetting?.distanceBasedShipping?.max_delivery_distance || 50
                          },
                          freeDelivery: {
                            enabled: storeCustomizationSetting?.distanceBasedShipping?.enable_free_shipping !== false, // Default to true if not set
                            radius: storeCustomizationSetting?.distanceBasedShipping?.free_delivery_radius || 0.5,
                            minOrderAmount: storeCustomizationSetting?.distanceBasedShipping?.min_order_free_delivery || 100
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group mt-12">
                    <h2 className="font-semibold text-base text-gray-700 pb-3">
                      03.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.payment_method
                      )}
                    </h2>

                    <div className="grid sm:grid-cols-1 grid-cols-1 gap-4">
                      <div className="">
                        <InputPayment
                          setShowCard={setShowCard}
                          register={register}
                          name={t("common:cashOnDelivery")}
                          value="Cash"
                          Icon={IoWalletSharp}
                          defaultChecked={true}
                        />
                        <Error errorMessage={errors.paymentMethod} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-4 lg:gap-6 mt-10">
                    <div className="col-span-6 sm:col-span-3">
                      <Link
                        href="/"
                        className="bg-indigo-50 border border-indigo-100 rounded py-3 text-center text-sm font-medium text-gray-700 hover:text-gray-800 hover:border-gray-300 transition-all flex justify-center font-serif w-full"
                      >
                        <span className="text-xl mr-2">
                          <IoReturnUpBackOutline />
                        </span>
                        {showingTranslateValue(
                          storeCustomizationSetting?.checkout?.continue_button
                        )}
                      </Link>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <button
                        type="submit"
                        disabled={isEmpty || isCheckoutSubmit}
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 transition-all rounded py-3 text-center text-sm font-serif font-medium text-white flex justify-center w-full"
                      >
                        {isCheckoutSubmit ? (
                          <span className="flex justify-center text-center">
                            {" "}
                            <img
                              src="/loader/spinner.gif"
                              alt="Loading"
                              width={20}
                              height={10}
                            />{" "}
                            <span className="ml-2">
                              {t("common:processing")}
                            </span>
                          </span>
                        ) : (
                          <span className="flex justify-center text-center">
                            {showingTranslateValue(
                              storeCustomizationSetting?.checkout
                                ?.confirm_button
                            )}
                            <span className="text-xl ml-2">
                              {" "}
                              <IoArrowForward />
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:w-full lg:w-2/5 lg:ml-10 xl:ml-14 md:ml-6 flex flex-col h-full md:sticky lg:sticky top-28 md:order-2 lg:order-2">
              <div className="border p-5 lg:px-8 lg:py-8 rounded-lg bg-white order-1 sm:order-2">
                <h2 className="font-semibold font-serif text-lg pb-4">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.order_summary
                  )}
                </h2>

                <div className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-64 bg-gray-50 block">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} currency={currency} />
                  ))}

                  {isEmpty && (
                    <div className="text-center py-10">
                      <span className="flex justify-center my-auto text-gray-500 font-semibold text-4xl">
                        <IoBagHandle />
                      </span>
                      <h2 className="font-medium font-serif text-sm pt-2 text-gray-600">
                        No Item Added Yet!
                      </h2>
                    </div>
                  )}
                </div>

                <div className="flex items-center mt-4 py-4 lg:py-4 text-sm w-full font-semibold text-heading last:border-b-0 last:text-base last:pb-0">
                  <form className="w-full">
                    {couponInfo.couponCode ? (
                      <span className="bg-emerald-50 px-4 py-3 leading-tight w-full rounded-md flex justify-between">
                        {" "}
                        <p className="text-emerald-600">{t("common:applyCoupon")} </p>{" "}
                        <span className="text-red-500 text-right">
                          {couponInfo.couponCode}
                        </span>
                      </span>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start justify-end">
                        <input
                          ref={couponRef}
                          type="text"
                          placeholder={t("common:couponCode")}
                          className="form-input py-2 px-3 md:px-4 w-full appearance-none transition ease-in-out border text-input text-sm rounded-md h-12 duration-200 bg-white border-gray-200 focus:ring-0 focus:outline-none focus:border-emerald-500 placeholder-gray-500 placeholder-opacity-75"
                        />
                        {isCouponAvailable ? (
                          <button
                            disabled={isCouponAvailable}
                            type="submit"
                            className="md:text-sm leading-4 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center border border-gray-200 rounded-md placeholder-white focus-visible:outline-none focus:outline-none px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-3 mt-3 sm:mt-0 sm:ml-3 md:mt-0 md:ml-3 lg:mt-0 lg:ml-3 hover:text-white hover:bg-emerald-500 h-12 text-sm lg:text-base w-full sm:w-auto"
                          >
                            <img
                              src="/loader/spinner.gif"
                              alt="Loading"
                              width={20}
                              height={10}
                            />
                            <span className=" ml-2 font-light">{t("common:loading")}</span>
                          </button>
                        ) : (
                          <button
                            disabled={isCouponAvailable}
                            onClick={handleCouponCode}
                            className="md:text-sm leading-4 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center border border-gray-200 rounded-md placeholder-white focus-visible:outline-none focus:outline-none px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-3 mt-3 sm:mt-0 sm:ml-3 md:mt-0 md:ml-3 lg:mt-0 lg:ml-3 hover:text-white hover:bg-emerald-500 h-12 text-sm lg:text-base w-full sm:w-auto"
                          >
                            {showingTranslateValue(
                              storeCustomizationSetting?.checkout?.apply_button
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                </div>

                {/* Loyalty Points Redemption */}
                {loyaltyPoints > 0 && (
                  <div className="flex items-center mt-4 py-4 lg:py-4 text-sm w-full font-semibold text-heading border-t">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <FiStar className="text-purple-600 mr-2" />
                          <span className="text-gray-700 font-semibold">{t("common:loyaltyPoints")}</span>
                        </div>
                        <div className="text-purple-600 font-bold">
                          {loyaltyPoints} {t("common:availablePoints")}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start justify-end">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(maxRedeemablePoints, loyaltyPoints)}
                          value={pointsToRedeem}
                          onChange={handlePointsChange}
                          placeholder={t("common:pointsToRedeem")}
                          className="form-input py-2 px-3 md:px-4 w-full appearance-none transition ease-in-out border text-input text-sm rounded-md h-12 duration-200 bg-white border-gray-200 focus:ring-0 focus:outline-none focus:border-purple-500 placeholder-gray-500 placeholder-opacity-75"
                        />
                        <button
                          type="button"
                          onClick={applyMaxPoints}
                          className="md:text-sm leading-4 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center border border-purple-200 rounded-md placeholder-white focus-visible:outline-none focus:outline-none px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-3 mt-3 sm:mt-0 sm:ml-3 md:mt-0 md:ml-3 lg:mt-0 lg:ml-3 hover:text-white hover:bg-purple-500 bg-purple-50 text-purple-600 h-12 text-sm lg:text-base w-full sm:w-auto"
                        >
                          {t("common:applyMaxPoints")}
                        </button>
                      </div>
                      
                      {pointsToRedeem > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-700">
                              <FiInfo className="inline mr-1" />
                              {t("common:redeemPoints")} {pointsToRedeem} {t("common:loyaltyPoints")}
                            </span>
                            <span className="text-purple-700 font-bold">
                              -<span className="font-saudi_riyal">{currency}</span>{loyaltyDiscount.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {t("common:remaining")}: {loyaltyPoints - pointsToRedeem} {t("common:loyaltyPoints")}
                          </div>
                        </div>
                      )}
                      
                      {maxRedeemablePoints < loyaltyPoints && (
                        <div className="mt-2 text-xs text-gray-500">
                          <FiInfo className="inline mr-1" />
                          {t("common:maxRedeemable")}: {maxRedeemablePoints} {t("common:loyaltyPoints")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.sub_total
                  )}
                  <span className="ml-auto flex-shrink-0 text-gray-800 font-bold">
                    <span className="font-saudi_riyal">{currency}</span>
                    {(cartTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.shipping_cost
                  )}
                  <span className="ml-auto flex-shrink-0 text-gray-800 font-bold">
                    <span className="font-saudi_riyal">{currency}</span>
                    {(shippingCost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.discount
                  )}
                  <span className="ml-auto flex-shrink-0 font-bold text-orange-400">
                    <span className="font-saudi_riyal">{currency}</span>
                    {(discountAmount || 0).toFixed(2)}
                  </span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                    <span className="flex items-center">
                      <FiStar className="text-purple-600 mr-2" />
                      {t("common:loyaltyDiscount")}
                    </span>
                    <span className="ml-auto flex-shrink-0 font-bold text-purple-600">
                      <span className="font-saudi_riyal">{currency}</span>
                      {loyaltyDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t mt-4">
                  <div className="flex items-center font-bold font-serif justify-between pt-5 text-sm uppercase">
                    {showingTranslateValue(
                      storeCustomizationSetting?.checkout?.total_cost
                    )}
                    <span className="font-serif font-extrabold text-lg">
                      <span className="font-saudi_riyal">{currency}</span>
                      {Math.max(0, parseFloat(total) - loyaltyDiscount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default dynamic(() => Promise.resolve(Checkout), { ssr: false });
