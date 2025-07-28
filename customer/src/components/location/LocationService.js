import React, { useState, useEffect } from 'react';
import { FiMapPin, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const LocationService = ({ onLocationUpdate, className = '', initialLocation = null }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Enhanced geolocation options for better accuracy
  const options = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds timeout
    maximumAge: 30000, // 30 seconds cache (reduce for real-time updates)
  };

  // Get current location with improved accuracy
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError('');
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(coords);
        setLoading(false);
        
        // Store coordinates globally for checkout
        if (typeof window !== 'undefined') {
          window.userLocationCoords = coords;
        }
        
        // Reverse geocoding using a free service (OpenStreetMap Nominatim)
        reverseGeocode(coords.latitude, coords.longitude);
        
        // Note: onLocationUpdate is now called from reverseGeocode with full address data
      },
      (error) => {
        setLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied by user. Please enable location access in your browser settings.");
            setPermissionDenied(true);
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable. Please try again.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred. Please try again.");
            break;
        }
      },
      options
    );
  };

  // Free reverse geocoding using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    try {
      // Use a CORS proxy to avoid CORS issues
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(
        `${corsProxy}${nominatimUrl}`,
        {
          headers: {
            'User-Agent': 'SaptMarkets-App',
            'Origin': window.location.origin
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedAddress = formatAddress(data);
        const addressComponents = extractAddressComponents(data);
        setAddress(formattedAddress);
        
        // Store coordinates globally for checkout
        if (typeof window !== 'undefined') {
          window.userLocationCoords = {
            latitude: lat,
            longitude: lng,
            address: formattedAddress,
            addressComponents: addressComponents,
            googleMapsLink: addressComponents.googleMapsLink,
            googleMapsAddressLink: addressComponents.googleMapsAddressLink,
            accuracy: location?.accuracy || null
          };
        }
        
        // Update parent with detailed address info
        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: lat,
            longitude: lng,
            address: formattedAddress,
            city: addressComponents.city,
            addressComponents: addressComponents,
            googleMapsLink: addressComponents.googleMapsLink,
            googleMapsAddressLink: addressComponents.googleMapsAddressLink
          });
        }
      } else {
        throw new Error('Geocoding API request failed');
      }
    } catch (error) {
      // Set basic address if reverse geocoding fails
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      
      // Still call onLocationUpdate with basic coordinates and fallback address
      if (onLocationUpdate) {
        onLocationUpdate({
          latitude: lat,
          longitude: lng,
          address: fallbackAddress,
          city: '',
          addressComponents: {
            streetAddress: fallbackAddress,
            city: '',
            country: 'Saudi Arabia',
            googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
            googleMapsAddressLink: `https://www.google.com/maps?q=${lat},${lng}`
          },
          googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
          googleMapsAddressLink: `https://www.google.com/maps?q=${lat},${lng}`
        });
      }
    }
  };

  // Format address from Nominatim response with detailed components
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
      ].filter(Boolean).join(', '),
      // Create Google Maps link for delivery driver
      googleMapsLink: `https://www.google.com/maps?q=${data.lat},${data.lon}`,
      // Alternative Google Maps link with address
      googleMapsAddressLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.display_name)}`
    };
  };

  // Auto-detect location on component mount if no initial location is provided
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      // Also trigger reverse geocoding to display the address
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else if (navigator.permissions) {
      navigator.permissions.query({name: 'geolocation'}).then((result) => {
        if (result.state === 'granted') {
          getCurrentLocation();
        }
      });
    }
  }, [initialLocation]); // Re-run if initialLocation changes or is set

  return (
    <div className={`location-service ${className}`}>
      {/* Get Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        className={`w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          loading ? 'cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Detecting Location...
          </>
        ) : (
          <>
            <FiMapPin className="w-4 h-4 mr-2" />
            🎯 Get My Location for Delivery
          </>
        )}
      </button>

      {/* Location Display */}
      {location && (
        <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 mb-2">
          <div className="text-sm text-emerald-800">
            <strong>📍 Location Detected:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
          {address && (
            <div className="text-sm text-emerald-700 mt-1">
              <strong>Address:</strong> {address}
            </div>
          )}
          
          {/* Google Maps Links for Delivery */}
          {window.userLocationCoords?.googleMapsLink && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={window.userLocationCoords.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
              >
                📍 View on Google Maps
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(window.userLocationCoords.googleMapsLink)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                📋 Copy Location Link
              </button>
            </div>
          )}
          
          <div className="text-xs text-emerald-600 mt-1">
            Accuracy: ±{Math.round(location.accuracy)}m
            <span className="text-emerald-700 ml-2">✅ Ready for distance calculation</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-2">
          <div className="flex items-center">
            <FiAlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          {permissionDenied && (
            <div className="text-xs text-red-600 mt-2">
              💡 Tip: Try using Firefox browser for better location accuracy, or enable location permissions in your browser settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationService; 