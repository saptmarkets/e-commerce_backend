import requests from './httpService';

const ProductUnitServices = {
  // Get all product units for a product
  getProductUnits: async (productId) => {
    try {
      const response = await requests.get(`product-units/product/${productId}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching product units:', error);
      throw error;
    }
  },

  // Get a specific product unit
  getProductUnit: async (unitId) => {
    try {
      const response = await requests.get(`/product-units/${unitId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add a new product unit
  addProductUnit: async (unitData) => {
    try {
      // Ensure unitId is set (backend requires this field)
      if (!unitData.unitId && unitData.unit) {
        console.log('Setting unitId to match unit field');
        unitData.unitId = unitData.unit;
      }
      
      if (!unitData.unitId) {
        console.error('Missing required unitId field');
        throw new Error('Unit ID is required');
      }
      
      console.log('Adding product unit with data:', unitData);
      const response = await requests.post(`/product-units`, unitData);
      return response;
    } catch (error) {
      console.error('Error adding product unit:', error);
      throw error;
    }
  },

  // Create a new product unit
  createProductUnit: async (productId, unitData) => {
    try {
      console.log('Creating product unit for product ID:', productId);
      console.log('Unit data to send:', JSON.stringify(unitData, null, 2));
      
      // Clean the data - remove any undefined or null values
      const cleanData = Object.keys(unitData).reduce((acc, key) => {
        if (unitData[key] !== undefined && unitData[key] !== null && unitData[key] !== '') {
          acc[key] = unitData[key];
        }
        return acc;
      }, {});
      
      console.log('Cleaned unit data:', JSON.stringify(cleanData, null, 2));
      
      const response = await requests.post(`product-units/product/${productId}`, cleanData);
      console.log('Created product unit response:', response);
      return response;
    } catch (error) {
      console.error('Error creating product unit:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        sentData: error.config?.data
      });
      throw error;
    }
  },

  // Update an existing product unit
  updateProductUnit: async (productId, unitId, unitData) => {
    try {
      console.log('Updating product unit:', unitId, 'for product:', productId);
      console.log('Unit data:', unitData);
      
      const response = await requests.put(`product-units/product/${productId}/unit/${unitId}`, unitData);
      console.log('Updated product unit:', response);
      return response;
    } catch (error) {
      console.error('Error updating product unit:', error);
      throw error;
    }
  },

  // Delete a product unit
  deleteProductUnit: async (productId, unitId) => {
    try {
      console.log('Deleting product unit:', unitId, 'for product:', productId);
      
      const response = await requests.delete(`product-units/product/${productId}/unit/${unitId}`);
      console.log('Deleted product unit:', response);
      return response;
    } catch (error) {
      console.error('Error deleting product unit:', error);
      throw error;
    }
  },

  // Get product units with stock information
  getProductUnitsWithStock: async (productId) => {
    try {
      const response = await requests.get(`/product-units/product/${productId}/stock`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update stock for a product unit
  updateProductUnitStock: async (unitId, stockData) => {
    try {
      const response = await requests.put(`/product-units/${unitId}/stock`, stockData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Set default product unit
  setDefaultProductUnit: async (productId, unitId) => {
    try {
      const response = await requests.put(`/product-units/${unitId}/default`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get available units for a product (units that can be added)
  getAvailableUnitsForProduct: async (productId) => {
    try {
      const response = await requests.get(`/product-units/product/${productId}/available-units`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Bulk create product units
  bulkCreateProductUnits: async (productId, productUnitsData) => {
    try {
      const response = await requests.post(`/product-units/product/${productId}/bulk`, { productUnits: productUnitsData });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get best value unit for a product
  getBestValueUnit: async (productId) => {
    try {
      const response = await requests.get(`/product-units/product/${productId}/best-value`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Search product units by SKU or barcode
  searchProductUnits: async (query) => {
    try {
      const response = await requests.get(`/product-units/search?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get units requiring stock refill
  getUnitsRequiringRefill: async () => {
    try {
      const response = await requests.get('/product-units/low-stock');
      console.log("ProductUnitServices - Raw response from httpService.js:", response);
      return response;
    } catch (error) {
      console.error("ProductUnitServices - Error in getUnitsRequiringRefill:", error);
      throw error;
    }
  },

  // Update bulk pricing for a product unit
  updateBulkPricing: async (productId, productUnitId, bulkPricingData) => {
    try {
      const response = await requests.put(`/product-units/product/${productId}/unit/${productUnitId}/bulk-pricing`, bulkPricingData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Calculate stock requirement
  calculateStockRequirement: async (stockData) => {
    try {
      const response = await requests.post('/product-units/stock-requirement', stockData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Validate unit data
  validateUnitData: async (unitData) => {
    try {
      const response = await requests.post('/product-units/validate', unitData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Debug function to directly test API connectivity and format
  testApiConnection: async (productId) => {
    try {
      console.log('========== TESTING API CONNECTION ==========');
      
      // First test if we can get the product
      console.log('Testing GET product endpoint...');
      try {
        const productResponse = await requests.get(`api/products/${productId}`);
        console.log('Product GET test successful:', productResponse);
      } catch (getError) {
        console.error('Product GET test failed:', getError);
      }
      
      // First test a simple GET to the product-units endpoint
      console.log('Testing GET product-units endpoint...');
      try {
        const getResponse = await requests.get(`api/product-units/all`);
        console.log('GET product-units test successful:', getResponse);
      } catch (getError) {
        console.error('GET product-units test failed:', getError);
      }
      
      // Test product units by product ID
      console.log('Testing GET product units by product ID...');
      try {
        const getUnitsResponse = await requests.get(`api/product-units/product/${productId}`);
        console.log('GET product units test successful:', getUnitsResponse);
      } catch (getUnitsError) {
        console.error('GET product units test failed:', getUnitsError);
      }
      
      // Now try a minimal POST with only required fields
      if (!productId) {
        console.log('No product ID provided for POST test');
        return;
      }
      
      console.log('Testing POST to create product unit...');
      const testPayload = {
        product: productId,
        unit: "683f2ee7c77019398c96d290", // Use a known unit ID
        unitValue: 1,
        packQty: 1,
        price: 100
      };
      
      console.log('Test payload:', JSON.stringify(testPayload, null, 2));
      
      // Try different endpoint formats
      const endpoints = [
        `api/product-units/product/${productId}`,
        `product-units/product/${productId}`,
        `/api/product-units/product/${productId}`,
        `/product-units/product/${productId}`,
        // Try some alternative formats in case the API is set up differently
        `api/products/${productId}/units`,
        `/api/products/${productId}/units`,
        `api/productunits/product/${productId}`,
        `/api/productunits/product/${productId}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await requests.post(endpoint, testPayload);
          console.log(`Success with endpoint ${endpoint}:`, response);
          
          // Store the successful endpoint for future use
          console.log(`*** SUCCESSFUL ENDPOINT: ${endpoint} ***`);
          return { success: true, endpoint, response };
        } catch (error) {
          console.error(`Failed with endpoint ${endpoint}:`, error.message);
          if (error.response) {
            console.error('Error status:', error.response.status);
            if (error.response.data) {
              console.error('Error data:', JSON.stringify(error.response.data, null, 2));
            }
          }
        }
      }
      
      console.log('========== API CONNECTION TEST COMPLETE - NO SUCCESSFUL ENDPOINTS FOUND ==========');
      return { success: false, message: 'All endpoint tests failed' };
    } catch (error) {
      console.error('Test API connection failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a test product unit bypassing React state
  createTestProductUnit: async () => {
    try {
      console.log('--------- CREATING TEST PRODUCT UNIT ---------');
      
      // First, create a simple test product
      const testProduct = {
        title: { en: "Test Product " + Date.now() },
        description: { en: "Test product for debugging" },
        slug: "test-product-" + Date.now(),
        price: 100,
        stock: 100,
        category: "6839a74cb2ae73e7bc40f0a3", // Use a known category ID
        sku: "TEST-" + Date.now(),
        status: "show"
      };
      
      console.log('Creating test product:', JSON.stringify(testProduct, null, 2));
      
      try {
        const productResult = await requests.post('api/products', testProduct);
        console.log('Test product created:', productResult);
        
        if (!productResult || !productResult._id) {
          console.error('Failed to get product ID from response');
          return { success: false, error: 'No product ID returned' };
        }
        
        const productId = productResult._id;
        console.log('Test product ID:', productId);
        
        // Now create a test unit using the product ID
        const testUnit = {
          product: productId,
          unit: "683f2ee7c77019398c96d290", // Use a known unit ID
          unitValue: 1,
          packQty: 1,
          price: 100,
          sku: "TEST-UNIT-" + Date.now(),
          barcode: "",
          isDefault: true,
          title: "Test Unit"
        };
        
        console.log('Creating test unit:', JSON.stringify(testUnit, null, 2));
        
        // Try the POST request with all permutations
        const endpoints = [
          `api/product-units/product/${productId}`,
          `product-units/product/${productId}`,
          `/api/product-units/product/${productId}`,
          `/product-units/product/${productId}`,
          `api/products/${productId}/units`,
          `/api/products/${productId}/units`
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await requests.post(endpoint, testUnit);
            console.log(`Success with endpoint ${endpoint}:`, response);
            return { 
              success: true, 
              endpoint, 
              productId, 
              unitId: response._id,
              message: 'Test product and unit created successfully'
            };
          } catch (error) {
            console.error(`Failed with endpoint ${endpoint}:`, error.message);
          }
        }
        
        return { 
          success: false, 
          productId, 
          message: 'Test product created but failed to create test unit'
        };
        
      } catch (productError) {
        console.error('Failed to create test product:', productError);
        return { success: false, error: 'Failed to create test product' };
      }
    } catch (error) {
      console.error('Test creation failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all product units (admin only)
  getAllProductUnits: async () => {
    try {
      const response = await requests.get('product-units/all');
      console.log('All product units:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all product units:', error);
      throw error;
    }
  },

  // Get all product-unit combinations for promotion management
  getAllProductUnitCombinations: async () => {
    try {
      console.log('Fetching all product-unit combinations');
      const response = await requests.get('product-units/all?limit=1000');
      console.log('Product-unit combinations response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching product-unit combinations:', error);
      throw error;
    }
  }
};

export default ProductUnitServices; 