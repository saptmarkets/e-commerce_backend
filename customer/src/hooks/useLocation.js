import { useState, useCallback } from 'react';

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError('');

      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser.';
        setError(error);
        setLoading(false);
        reject(new Error(error));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (error) => {
          setLoading(false);
          let errorMessage = 'Unknown location error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, []);

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SaptMarkets-Customer-App'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          formattedAddress: formatAddress(data),
          components: data.address,
          raw: data
        };
      }
      throw new Error('Geocoding failed');
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: {},
        raw: null
      };
    }
  }, []);

  // Format address from geocoding response
  const formatAddress = (data) => {
    const addr = data.address || {};
    const parts = [];
    
    // Add house number and street
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road) parts.push(addr.road);
    
    // Add area/neighborhood
    if (addr.neighbourhood || addr.suburb) {
      parts.push(addr.neighbourhood || addr.suburb);
    }
    
    // Add city
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }
    
    // Add state/province
    if (addr.state) parts.push(addr.state);
    
    // Add country
    if (addr.country) parts.push(addr.country);
    
    return parts.join(', ') || data.display_name || 'Unknown location';
  };

  // Get location with address
  const getLocationWithAddress = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      const addressData = await reverseGeocode(coords.latitude, coords.longitude);
      
      setAddress(addressData.formattedAddress);
      
      return {
        ...coords,
        address: addressData.formattedAddress,
        addressComponents: addressData.components
      };
    } catch (error) {
      throw error;
    }
  }, [getCurrentLocation, reverseGeocode]);

  // Calculate distance between two points (in kilometers)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Check if location is available
  const isLocationAvailable = useCallback(() => {
    return 'geolocation' in navigator;
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setLocation(null);
    setAddress('');
    setError('');
  }, []);

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    reverseGeocode,
    getLocationWithAddress,
    calculateDistance,
    isLocationAvailable,
    clearLocation,
    setLocation,
    setAddress
  };
};

export default useLocation; 