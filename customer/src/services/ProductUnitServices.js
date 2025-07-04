import requests from "./httpServices";

const ProductUnitServices = {
  // Get all units for a specific product
  getProductUnits: async (productId) => {
    try {
      console.log(`Fetching units for product: ${productId}`);
      const response = await requests.get(`/product-units/product/${productId}`);
      console.log(`API call completed for product ${productId}:`, {
        success: response?.success,
        dataLength: response?.data?.length,
        hasData: !!response?.data
      });
      return response;
    } catch (error) {
      console.error('Error fetching product units:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  },

  // Get a specific product unit by ID
  getProductUnitById: async (unitId) => {
    try {
      console.log(`Fetching product unit: ${unitId}`);
      return await requests.get(`/product-units/${unitId}`);
    } catch (error) {
      console.error('Error fetching product unit:', error);
      throw error;
    }
  },

  // Get product with specific unit information
  getProductWithUnit: async (productId, unitId) => {
    try {
      console.log(`Fetching product ${productId} with unit ${unitId}`);
      return await requests.get(`/products/${productId}/units/${unitId}`);
    } catch (error) {
      console.error('Error fetching product with unit:', error);
      throw error;
    }
  },

  // Get product by barcode (for promotions)
  getProductByBarcode: async (barcode) => {
    try {
      console.log(`Fetching product by barcode: ${barcode}`);
      return await requests.get(`/products/barcode/${barcode}`);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw error;
    }
  },

  // Get all active product units (for promotions display)
  getAllActiveProductUnits: async () => {
    try {
      console.log('Fetching all active product units');
      return await requests.get('/product-units/active');
    } catch (error) {
      console.error('Error fetching active product units:', error);
      throw error;
    }
  },

  // Calculate pricing for a product unit with quantity
  calculateUnitPricing: async (unitId, quantity) => {
    try {
      console.log(`Calculating pricing for unit ${unitId} with quantity ${quantity}`);
      return await requests.post('/product-units/calculate-pricing', {
        unitId,
        quantity
      });
    } catch (error) {
      console.error('Error calculating unit pricing:', error);
      throw error;
    }
  }
};

export default ProductUnitServices; 