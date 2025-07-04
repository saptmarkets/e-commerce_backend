import requests from "./httpServices";

const PromotionServices = {
  // Get all active promotions
  getActivePromotions: async () => {
    try {
      console.log('Fetching active promotions');
      return await requests.get('/promotions/active');
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      return []; // Return empty array on error to prevent crashes
    }
  },

  // Get promotions for a specific product unit
  getPromotionsByProductUnit: async (productUnitId) => {
    try {
      // Skip fallback, default, and system-generated units
      if (productUnitId?.startsWith('fallback-') || productUnitId?.startsWith('default-')) {
        console.log(`PromotionServices: Skipping promotion fetch for system unit: ${productUnitId}`);
        return [];
      }
      
      console.log(`Fetching promotions for product unit: ${productUnitId}`);
      return await requests.get(`/promotions/product-unit/${productUnitId}`);
    } catch (error) {
      console.error('Error fetching promotions for product unit:', error);
      return [];
    }
  },

  // Get promotions for a specific product (all units)
  getPromotionsByProduct: async (productId) => {
    try {
      console.log(`Fetching promotions for product: ${productId}`);
      return await requests.get(`/promotions/product/${productId}`);
    } catch (error) {
      console.error('Error fetching promotions for product:', error);
      return [];
    }
  },

  // Get fixed price promotions
  getFixedPricePromotions: async () => {
    try {
      console.log('Fetching fixed price promotions');
      const allPromotions = await requests.get('/promotions/active');
      // Filter for fixed price promotions
      return allPromotions.filter(promotion => promotion.type === 'fixed_price');
    } catch (error) {
      console.error('Error fetching fixed price promotions:', error);
      return [];
    }
  },

  // Get products with fixed price promotions
  getProductsWithFixedPricePromotions: async () => {
    try {
      console.log('Fetching products with fixed price promotions');
      const allPromotions = await requests.get('/promotions/active');
      console.log('All promotions received:', allPromotions);
      
      const fixedPricePromotions = allPromotions.filter(promotion => promotion.type === 'fixed_price');
      console.log('Fixed price promotions:', fixedPricePromotions);
      
      // Transform promotions to include product information
      const productsWithPromotions = [];
      
      for (const promotion of fixedPricePromotions) {
        console.log('Processing promotion:', promotion);
        console.log('ProductUnit:', promotion.productUnit);
        
        if (promotion.productUnit && promotion.productUnit.product) {
          const product = promotion.productUnit.product;
          const productUnit = promotion.productUnit;
          
          console.log('Product found:', product);
          console.log('ProductUnit details:', productUnit);
          
          productsWithPromotions.push({
            ...product,
            // Override base price so components that read product.price get the deal price
            price: promotion.value,
            promotion: {
              ...promotion,
              originalPrice: productUnit.price,
              offerPrice: promotion.value,      // alias consumed by many components
              promotionalPrice: promotion.value,
              savings: productUnit.price - promotion.value,
              savingsPercent: ((productUnit.price - promotion.value) / productUnit.price) * 100,
              unit: productUnit
            }
          });
        } else {
          console.log('Promotion missing productUnit or product:', promotion);
        }
      }
      
      console.log('Final products with promotions:', productsWithPromotions);
      return productsWithPromotions;
    } catch (error) {
      console.error('Error fetching products with fixed price promotions:', error);
      return [];
    }
  },

  // Get assorted items promotions
  getAssortedPromotions: async () => {
    try {
      console.log('Fetching assorted items promotions');
      const allPromotions = await requests.get('/promotions/active');
      // Filter for assorted items promotions
      return allPromotions.filter(promotion => promotion.type === 'assorted_items');
    } catch (error) {
      console.error('Error fetching assorted promotions:', error);
      return [];
    }
  },

  // Get assorted items promotions with products
  getAssortedPromotionsWithProducts: async () => {
    try {
      const allPromotions = await requests.get('/promotions/active');
      
      const assortedPromotions = allPromotions.filter(promotion => promotion.type === 'assorted_items');
      
      // Transform promotions to include detailed product information
      const promotionsWithProducts = [];
      
      for (const promotion of assortedPromotions) {
        
        if (promotion.productUnits && promotion.productUnits.length > 0) {
          // Use requiredItemCount for price calculation, not productUnits.length
          const requiredItems = promotion.requiredItemCount || promotion.productUnits.length;
          const pricePerItem = promotion.value / requiredItems;
          
          const products = promotion.productUnits.map(productUnit => ({
            ...productUnit.product,
            unit: productUnit,
            promotionalPrice: pricePerItem,
          }));
          

          
          promotionsWithProducts.push({
            ...promotion,
            products: products,
            totalItems: promotion.productUnits.length,
            requiredItemCount: requiredItems,
            pricePerItem: pricePerItem
          });
        } else {
          console.log('Assorted promotion missing productUnits:', promotion);
          console.log('Promotion details:', {
            id: promotion._id,
            name: promotion.name,
            type: promotion.type,
            value: promotion.value,
            requiredItemCount: promotion.requiredItemCount,
            productUnits: promotion.productUnits,
            isActive: promotion.isActive,
            startDate: promotion.startDate,
            endDate: promotion.endDate
          });
        }
      }
      
      return promotionsWithProducts;
    } catch (error) {
      console.error('Error fetching assorted promotions with products:', error);
      return [];
    }
  },

  // Get bulk promotions
  getBulkPromotions: async () => {
    try {
      console.log('Fetching bulk promotions');
      const allPromotions = await requests.get('/promotions/active');
      // Filter for bulk purchase promotions
      return allPromotions.filter(promotion => promotion.type === 'bulk_purchase');
    } catch (error) {
      console.error('Error fetching bulk promotions:', error);
      return [];
    }
  },

  // Get promotion details by ID
  getPromotionById: async (promotionId) => {
    try {
      console.log(`Fetching promotion: ${promotionId}`);
      return await requests.get(`/promotions/${promotionId}`);
    } catch (error) {
      console.error('Error fetching promotion:', error);
      throw error;
    }
  },

  // Legacy function name for backward compatibility
  getPromotionsForProduct: async (productId) => {
    try {
      console.log(`Fetching promotions for product: ${productId}`);
      return await requests.get(`/promotions/product/${productId}`);
    } catch (error) {
      console.error('Error fetching promotions for product:', error);
      return [];
    }
  },

  // Calculate promotional price based on quantity
  calculatePromotionalPrice: (promotion, quantity) => {
    if (!promotion || quantity < promotion.minQty) {
      return null;
    }
    
    // If quantity is between min and max, apply the promotion directly
    if (quantity <= promotion.maxQty) {
      return promotion.offerPrice;
    }
    
    // For quantities above maxQty, calculate the per-unit price from the offer
    // and apply it to the total quantity
    const unitPrice = promotion.offerPrice / promotion.minQty;
    return unitPrice * quantity;
  },

  // Validate promotion applicability
  validatePromotion: async (promotionId, cartItems) => {
    try {
      const promotion = await this.getPromotionById(promotionId);
      if (!promotion) return { valid: false, message: 'Promotion not found' };
      
      // Check if promotion is active
      if (!promotion.isActive) {
        return { valid: false, message: 'Promotion is not active' };
      }
      
      // Check date validity
      const now = new Date();
      if (promotion.startDate && new Date(promotion.startDate) > now) {
        return { valid: false, message: 'Promotion has not started yet' };
      }
      
      if (promotion.endDate && new Date(promotion.endDate) < now) {
        return { valid: false, message: 'Promotion has expired' };
      }
      
      return { valid: true, promotion };
    } catch (error) {
      console.error('Error validating promotion:', error);
      return { valid: false, message: 'Error validating promotion' };
    }
  },

  // Calculate discount for cart items
  calculatePromotionDiscount: (cartItems) => {
    let totalDiscount = 0;
    
    cartItems.forEach(item => {
      if (item.promotion && item.promotionPrice) {
        const regularPrice = item.basePrice || item.price;
        const promotionalPrice = item.promotionPrice;
        const discount = (regularPrice - promotionalPrice) * item.quantity;
        totalDiscount += discount;
      }
    });
    
    return totalDiscount;
  }
};

export default PromotionServices; 