// Distance calculation service for delivery pricing
const DistanceService = {
  // Calculate delivery cost based on distance and pricing settings
  calculateDeliveryCost: (distance, baseCost, costPerKm) => {
    try {
      // Ensure all inputs are valid numbers
      const numericBaseCost = parseFloat(baseCost) || 0;
      const numericCostPerKm = parseFloat(costPerKm) || 0;
      const numericDistance = parseFloat(distance) || 0;

      // Calculate distance cost
      const distanceCost = numericDistance * numericCostPerKm;
      
      // Calculate total cost
      const totalCost = numericBaseCost + distanceCost;
      
      return Math.max(0, totalCost); // Ensure cost is never negative
    } catch (error) {
      console.error('Error calculating delivery cost:', error);
      return 0; // Return 0 on error
    }
  },

  // Calculate shipping cost with advanced settings and breakdown
  calculateShippingCost: (distance, settings, cartTotal) => {
    try {
      const {
        baseCost = 10,
        costPerKm = 2,
        maxDeliveryDistance = 50,
        freeDeliveryRadius = 0.5,
        minOrderFreeDelivery = 100,
        freeShippingEnabled = true
      } = settings;

      // Validate inputs
      const numericDistance = parseFloat(distance) || 0;
      const numericBaseCost = parseFloat(baseCost) || 0;
      const numericCostPerKm = parseFloat(costPerKm) || 0;
      const numericCartTotal = parseFloat(cartTotal) || 0;
      const numericFreeDeliveryRadius = parseFloat(freeDeliveryRadius) || 0;
      const numericMinOrderFreeDelivery = parseFloat(minOrderFreeDelivery) || 0;

      // Check if delivery is within range
      if (maxDeliveryDistance && numericDistance > maxDeliveryDistance) {
        return {
          error: `Delivery not available beyond ${maxDeliveryDistance}km. You are ${numericDistance.toFixed(1)}km away.`,
          cost: 0,
          distance: numericDistance,
          breakdown: null
        };
      }

      // Check for free delivery conditions
      let freeReason = null;
      let isFreeDelivery = false;

      if (freeShippingEnabled) {
        // Free delivery within radius
        if (numericDistance <= numericFreeDeliveryRadius) {
          freeReason = `Free delivery within ${numericFreeDeliveryRadius}km radius`;
          isFreeDelivery = true;
        }
        // Free delivery for orders over minimum amount
        else if (numericCartTotal >= numericMinOrderFreeDelivery) {
          freeReason = `Free delivery for orders over ${numericMinOrderFreeDelivery} SAR`;
          isFreeDelivery = true;
        }
      }

      if (isFreeDelivery) {
        return {
          error: null,
          cost: 0,
          distance: numericDistance,
          breakdown: {
            baseCost: 0,
            distanceCost: 0,
            totalCost: 0,
            freeReason: freeReason
          }
        };
      }

      // Calculate regular shipping cost
      const distanceCost = numericDistance * numericCostPerKm;
      const totalCost = numericBaseCost + distanceCost;

      return {
        error: null,
        cost: Math.max(0, totalCost),
        distance: numericDistance,
        breakdown: {
          baseCost: numericBaseCost,
          distanceCost: distanceCost,
          totalCost: totalCost,
          freeReason: null
        }
      };

    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      return {
        error: 'Failed to calculate shipping cost. Please try again.',
        cost: 0,
        distance: 0,
        breakdown: null
      };
    }
  },

  // Calculate distance between two points using Haversine formula
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    try {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in kilometers
      
      return Math.round(distance * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  },

  // Format distance for display
  formatDistance: (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  },

  // Get delivery time estimate based on distance
  getDeliveryTimeEstimate: (distance) => {
    try {
      const baseTime = 30; // Base delivery time in minutes
      const timePerKm = 2; // Additional minutes per kilometer
      const totalMinutes = baseTime + (distance * timePerKm);
      
      // Convert to hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating delivery time:', error);
      return '30-45m'; // Default fallback
    }
  },

  // Validate coordinates
  validateCoordinates: (lat, lon) => {
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      return !isNaN(latitude) && 
             !isNaN(longitude) && 
             latitude >= -90 && latitude <= 90 && 
             longitude >= -180 && longitude <= 180;
    } catch (error) {
      console.error('Error validating coordinates:', error);
      return false;
    }
  }
};

export default DistanceService; 