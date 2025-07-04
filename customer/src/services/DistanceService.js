// Distance calculation service for shipping cost calculation
class DistanceService {
  
  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  // Convert degrees to radians
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calculate shipping cost based on distance and store settings
  static calculateShippingCost(distance, shippingSettings, orderTotal = 0) {
    if (!shippingSettings || !distance) {
      return { cost: 0, breakdown: null, error: 'Invalid parameters' };
    }

    const {
      baseCost = 0,
      costPerKm = 0,
      maxDeliveryDistance = null,
      freeDeliveryRadius = null,
      minOrderFreeDelivery = null,
      freeShippingEnabled = true // Default to true for backward compatibility
    } = shippingSettings;

    // Convert string values to numbers to prevent string concatenation
    const numericBaseCost = Number(baseCost) || 0;
    const numericCostPerKm = Number(costPerKm) || 0;
    const numericMaxDeliveryDistance = maxDeliveryDistance ? Number(maxDeliveryDistance) : null;
    const numericFreeDeliveryRadius = freeDeliveryRadius ? Number(freeDeliveryRadius) : null;
    const numericMinOrderFreeDelivery = minOrderFreeDelivery ? Number(minOrderFreeDelivery) : null;

    // Debug logging for calculation
    console.log('DistanceService - Input values:');
    console.log('- baseCost (original):', baseCost, 'type:', typeof baseCost);
    console.log('- costPerKm (original):', costPerKm, 'type:', typeof costPerKm);
    console.log('- numericBaseCost:', numericBaseCost, 'type:', typeof numericBaseCost);
    console.log('- numericCostPerKm:', numericCostPerKm, 'type:', typeof numericCostPerKm);
    console.log('- distance:', distance);

    // Check if delivery is possible
    if (numericMaxDeliveryDistance && distance > numericMaxDeliveryDistance) {
      return {
        cost: 0,
        breakdown: null,
        error: `Delivery not available. Maximum delivery distance is ${numericMaxDeliveryDistance}km. Your location is ${distance}km away.`
      };
    }

    // Check for free delivery conditions ONLY if free shipping is enabled
    if (freeShippingEnabled) {
      const isWithinFreeRadius = numericFreeDeliveryRadius && distance <= numericFreeDeliveryRadius;
      const meetsMinOrderForFree = numericMinOrderFreeDelivery && orderTotal >= numericMinOrderFreeDelivery;

      if (isWithinFreeRadius || meetsMinOrderForFree) {
        return {
          cost: 0,
          breakdown: {
            baseCost: numericBaseCost,
            distanceCost: distance * numericCostPerKm,
            totalBeforeDiscount: numericBaseCost + (distance * numericCostPerKm),
            discount: numericBaseCost + (distance * numericCostPerKm),
            finalCost: 0,
            freeReason: isWithinFreeRadius ? 'Within free delivery radius' : 'Minimum order amount reached'
          },
          distance: distance,
          error: null
        };
      }
    }

    // Calculate normal shipping cost (always charged if free shipping is disabled)
    const distanceCost = distance * numericCostPerKm;
    const totalCost = numericBaseCost + distanceCost;

    // Debug logging for final calculation
    console.log('DistanceService - Final calculation:');
    console.log('- distanceCost:', distance, '×', numericCostPerKm, '=', distanceCost);
    console.log('- totalCost:', numericBaseCost, '+', distanceCost, '=', totalCost);
    console.log('- totalCost type:', typeof totalCost);

    return {
      cost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      breakdown: {
        baseCost: numericBaseCost,
        distanceCost: distanceCost,
        totalCost: totalCost,
        distance: distance,
        freeShippingDisabled: !freeShippingEnabled
      },
      distance: distance,
      error: null
    };
  }

  // Format shipping cost breakdown for display
  static formatShippingBreakdown(breakdown, currency = '<span class=\"icon-saudi_riyal\">&#xE900;</span>') {
    if (!breakdown) return '';

    if (breakdown.freeReason) {
      return `🎁 Free Delivery - ${breakdown.freeReason}`;
    }

    return `Base: ${breakdown.baseCost} ${currency} + Distance (${breakdown.distance}km × ${breakdown.distanceCost/breakdown.distance} ${currency}/km) = ${breakdown.totalCost} ${currency}`;
  }

  // Get user-friendly distance text
  static formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  // Validate coordinates
  static isValidCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  // Get shipping estimate text for display
  static getShippingEstimateText(shippingResult, currency = '<span class=\"icon-saudi_riyal\">&#xE900;</span>') {
    if (shippingResult.error) {
      return `❌ ${shippingResult.error}`;
    }

    if (shippingResult.cost === 0) {
      return `🎁 Free Delivery (${this.formatDistance(shippingResult.distance)} away)`;
    }

    return `🚚 ${shippingResult.cost} ${currency} delivery (${this.formatDistance(shippingResult.distance)} away)`;
  }
}

export default DistanceService; 