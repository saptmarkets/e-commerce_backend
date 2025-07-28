import requests from "./httpService";

const ProductServices = {
  getAllProducts: async ({
    body,
    headers,
    page = 1,
    limit = 8,
    category = "",
    title = "",
    price = "",
    searchType = "all",
  }) => {
    const searchTitle = title !== null ? title : "";
    const searchPrice = price !== null ? price : "";
    const categoryId = category !== null ? category : "";

    const searchQuery = searchTitle !== "" ? `title=${searchTitle}&` : "";
    const categoryQuery = categoryId !== "" ? `category=${categoryId}&` : "";
    const priceQuery = searchPrice !== "" ? `price=${searchPrice}&` : "";
    const limitQuery = limit !== "" ? `limit=${limit}&` : "limit=8&";
    const searchTypeQuery = searchType !== "all" ? `searchType=${searchType}&` : "";

    return requests.get(
      `/products?${searchQuery}${categoryQuery}${priceQuery}${limitQuery}${searchTypeQuery}page=${page}`,
      body,
      headers
    );
  },

  // Get all products for promotions (simplified search)
  getProductsForPromotions: async (page = 1, limit = 50, search = '') => {
    const queryParams = { 
      page, 
      limit 
    };
    
    // Add search parameter if provided
    if (search && search.trim()) {
      queryParams.title = search.trim();
    }
    
    const query = new URLSearchParams(queryParams).toString();
    console.log('getProductsForPromotions request URL:', `/products?${query}`);
    return requests.get(`/products?${query}`);
  },

  // Search products by barcode
  getProductsByBarcode: async (barcode) => {
    try {
      // Try different barcode search formats
      const searchQueries = [
        `barcode=${barcode}`,
        `search=${barcode}`,
        `sku=${barcode}`,
        `q=${barcode}`
      ];
      
      for (const query of searchQueries) {
        try {
          console.log(`Trying barcode search: /products?${query}&limit=10`);
          const response = await requests.get(`/products?${query}&limit=10`);
          const products = response?.products || response?.data || response || [];
          
          if (products.length > 0) {
            console.log(`Found ${products.length} products with query: ${query}`);
            return { products };
          }
        } catch (queryError) {
          console.warn(`Barcode search failed for query ${query}:`, queryError.message);
        }
      }
      
      console.log('No products found with barcode searches');
      return { products: [] };
    } catch (error) {
      console.error('Error searching by barcode:', error);
      return { products: [] };
    }
  },

  // Enhanced product search for imports
  searchProducts: async (searchTerm, limit = 10) => {
    try {
      console.log(`ProductServices.searchProducts: Searching for "${searchTerm}" with limit ${limit}`);
      
      // Try multiple search strategies
      let searchResults = null;
      
      // Strategy 1: Search using title parameter
      try {
        console.log('Strategy 1: Searching with title parameter');
        searchResults = await ProductServices.getProductsForPromotions(1, limit, searchTerm);
        const products = searchResults?.products || searchResults || [];
        if (products.length > 0) {
          console.log(`Strategy 1 found ${products.length} products`);
          return searchResults;
        }
      } catch (error) {
        console.warn('Strategy 1 failed:', error.message);
      }
      
      // Strategy 2: Try with search parameter instead of title
      try {
        console.log('Strategy 2: Searching with search parameter');
        const searchQuery = `search=${encodeURIComponent(searchTerm)}&limit=${limit}`;
        searchResults = await requests.get(`/products?${searchQuery}`);
        const products = searchResults?.products || searchResults || [];
        if (products.length > 0) {
          console.log(`Strategy 2 found ${products.length} products`);
          return searchResults;
        }
      } catch (error) {
        console.warn('Strategy 2 failed:', error.message);
      }
      
      // Strategy 3: Try with name parameter
      try {
        console.log('Strategy 3: Searching with name parameter');
        const nameQuery = `name=${encodeURIComponent(searchTerm)}&limit=${limit}`;
        searchResults = await requests.get(`/products?${nameQuery}`);
        const products = searchResults?.products || searchResults || [];
        if (products.length > 0) {
          console.log(`Strategy 3 found ${products.length} products`);
          return searchResults;
        }
      } catch (error) {
        console.warn('Strategy 3 failed:', error.message);
      }
      
      // Strategy 4: Get all products and filter locally if search term is specific enough
      if (searchTerm.length >= 3) {
        try {
          console.log('Strategy 4: Getting all products for local filtering');
          const allProductsResult = await ProductServices.getAllProducts({ limit: 1000 });
          const allProducts = allProductsResult?.products || allProductsResult || [];
          
          const filteredProducts = allProducts.filter(product => {
            const productName = (product.name || product.title || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return productName.includes(searchLower);
          });
          
          console.log(`Strategy 4 found ${filteredProducts.length} products locally`);
          return { products: filteredProducts.slice(0, limit) };
        } catch (error) {
          console.warn('Strategy 4 failed:', error.message);
        }
      }
      
      console.log('All search strategies failed, returning empty result');
      return { products: [] };
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return { products: [] };
    }
  },

  // Get product by barcode or ID
  getProductByIdentifier: async (identifier) => {
    try {
      // Skip if identifier is invalid
      if (!identifier || identifier === 'No Product Selected') {
        return null;
      }

      // Try to get by ID first
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        const product = await ProductServices.getProductById(identifier);
        return product;
      }
      
      // Helper function to safely get text
      const getSafeText = (text) => {
        if (typeof text === 'object' && text) {
          return text.en || text.ar || Object.values(text)[0] || '';
        }
        return text || '';
      };
      
      // Try searching by barcode first (if it looks like a barcode)
      if (identifier.match(/^[A-Z0-9\-]{5,}$/)) {
        console.log('Trying barcode search for:', identifier);
        const barcodeResults = await ProductServices.getProductsByBarcode(identifier);
        const barcodeProducts = barcodeResults?.products || barcodeResults || [];
        
        if (barcodeProducts.length > 0) {
          const barcodeMatch = barcodeProducts.find(p => p.barcode === identifier);
          if (barcodeMatch) {
            console.log('Found product by barcode:', barcodeMatch._id);
            return barcodeMatch;
          }
        }
      }
      
      // Try to search by title/name
      console.log('Trying title search for:', identifier);
      const searchResults = await ProductServices.searchProducts(identifier, 10);
      const products = searchResults?.products || searchResults || [];
      
      console.log(`Found ${products.length} products in title search`);
      
      // Find exact matches
      const exactMatch = products.find(p => {
        const productTitle = getSafeText(p.title);
        const productName = getSafeText(p.name);
        
        return p.barcode === identifier ||
               p._id === identifier ||
               productTitle.toLowerCase() === identifier.toLowerCase() ||
               productName.toLowerCase() === identifier.toLowerCase();
      });
      
      if (exactMatch) {
        console.log('Found exact match:', exactMatch._id);
        return exactMatch;
      }
      
      // If no exact match, try partial matching
      const partialMatch = products.find(p => {
        const productTitle = getSafeText(p.title);
        const productName = getSafeText(p.name);
        
        return productTitle.toLowerCase().includes(identifier.toLowerCase()) ||
               productName.toLowerCase().includes(identifier.toLowerCase());
      });
      
      if (partialMatch) {
        console.log('Found partial match:', partialMatch._id);
        return partialMatch;
      }
      
      console.log('No product found for identifier:', identifier);
      return null;
    } catch (error) {
      console.error('Error finding product by identifier:', error);
      return null;
    }
  },

  getProductById: async (id, body) => {
    return requests.get(`/products/${id}`, body);
  },

  addProduct: async (body) => {
    return requests.post("/products/add", body);
  },

  addAllProducts: async (body) => {
    return requests.post("/products/all", body);
  },

  updateProduct: async (id, body) => {
    return requests.patch(`/products/${id}`, body);
  },

  updateManyProducts: async (body) => {
    return requests.patch("/products/update/many", body);
  },

  updateStatus: async (id, body) => {
    return requests.put(`/products/status/${id}`, body);
  },

  deleteProduct: async (id, body) => {
    return requests.delete(`/products/${id}`, body);
  },

  deleteManyProducts: async (body) => {
    return requests.patch("/products/delete/many", body);
  },

  // ========== MULTI-UNIT PRODUCT SERVICES ==========

  // Get all units for a specific product
  getProductUnits: async (productId) => {
    try {
      console.log(`Fetching product units for product ID: ${productId}`);
      const response = await requests.get(`/product-units/product/${productId}`);
      console.log('Product units response:', response);
      return response;
    } catch (error) {
      console.error('Error in getProductUnits:', error);
      if (error.response?.status === 404) {
        // Return empty array if route not found - API might not be implemented yet
        console.log('Product units endpoint not found, returning empty array');
        return { data: [], success: false, message: 'API endpoint not available' };
      }
      throw error;
    }
  },

  // Create a new product unit
  createProductUnit: async (productId, unitData) => {
    try {
      console.log(`Creating product unit for product ID: ${productId}`, unitData);
      const response = await requests.post(`/product-units/product/${productId}`, unitData);
      console.log('Create product unit response:', response);
      return response;
    } catch (error) {
      console.error('Error in createProductUnit:', error);
      throw error;
    }
  },

  // Update a specific product unit
  updateProductUnit: async (productId, unitId, unitData) => {
    try {
      console.log(`Updating product unit: ${unitId} for product: ${productId}`, unitData);
      const response = await requests.put(`/product-units/product/${productId}/unit/${unitId}`, unitData);
      console.log('Update product unit response:', response);
      return response;
    } catch (error) {
      console.error('Error in updateProductUnit:', error);
      throw error;
    }
  },

  // Delete a specific product unit
  deleteProductUnit: async (productId, unitId) => {
    try {
      console.log(`Deleting product unit: ${unitId} for product: ${productId}`);
      const response = await requests.delete(`/product-units/product/${productId}/unit/${unitId}`);
      console.log('Delete product unit response:', response);
      return response;
    } catch (error) {
      console.error('Error in deleteProductUnit:', error);
      throw error;
    }
  },

  // Bulk operations for product units
  bulkUpdateUnits: async (productId, unitsArray) => {
    try {
      const response = await requests.post(`/product-units/product/${productId}/bulk`, {
        units: unitsArray,
        operation: "createOrUpdate"
      });
      return response;
    } catch (error) {
      console.error('Error in bulkUpdateUnits:', error);
      throw error;
    }
  },

  // Get filtered product units with advanced search
  getFilteredProductUnits: async (productId, filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return requests.get(`/product-units/product/${productId}/filter?${query}`);
  },

  // Get best value unit for a product
  getBestValueUnit: async (productId) => {
    return requests.get(`/product-units/product/${productId}/best-value`);
  },

  // Compare units for a product
  compareProductUnits: async (productId) => {
    return requests.get(`/product-units/product/${productId}/compare`);
  },

  // Validate product unit data
  validateProductUnit: async (unitData) => {
    return requests.post(`/product-units/validate`, unitData);
  },

  // Get all product units for admin overview (with pagination and search)
  getAllProductUnits: async (page = 1, limit = 50, filters = {}, search = '') => {
    const queryParams = { 
      page, 
      limit, 
      ...filters 
    };
    
    // Add search parameter if provided
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }
    
    const query = new URLSearchParams(queryParams).toString();
    console.log('getAllProductUnits request URL:', `/product-units/all?${query}`);
    return requests.get(`/product-units/all?${query}`);
  },

  // Product unit analytics
  getProductUnitAnalytics: async (productId) => {
    return requests.get(`/product-units/product/${productId}/analytics`);
  },

  // Stock management for specific units
  updateUnitStock: async (productId, unitId, stockData) => {
    return requests.patch(`/product-units/product/${productId}/unit/${unitId}/stock`, stockData);
  },

  // Pricing management for specific units
  updateUnitPricing: async (productId, unitId, pricingData) => {
    return requests.patch(`/product-units/product/${productId}/unit/${unitId}/pricing`, pricingData);
  },

  // Check unit availability
  checkUnitAvailability: async (productId, unitId) => {
    return requests.get(`/product-units/product/${productId}/unit/${unitId}/availability`);
  },

  // Generate SKU for unit
  generateUnitSKU: async (productId, unitData) => {
    return requests.post(`/product-units/product/${productId}/generate-sku`, unitData);
  },

  // ========== UTILITY FUNCTIONS ==========

  // Calculate unit value per base unit (for comparison)
  calculateUnitValue: (unitType, unitValue) => {
    const baseUnits = {
      'kg': 1000, // 1kg = 1000g
      'g': 1,     // base unit
      'l': 1000,  // 1l = 1000ml
      'ml': 1,    // base unit
      'pcs': 1,   // base unit
      'pack': 1,  // treated as base
      'box': 1,   // treated as base
      'bottle': 1 // treated as base
    };

    return (baseUnits[unitType] || 1) * (unitValue || 1);
  },

  // Calculate price per unit for comparison
  calculatePricePerUnit: (price, unitType, unitValue) => {
    const totalUnits = ProductServices.calculateUnitValue(unitType, unitValue);
    return totalUnits > 0 ? price / totalUnits : 0;
  },

  // Format unit display
  formatUnitDisplay: (unitType, unitValue) => {
    if (unitValue === 1) {
      return unitType;
    }
    return `${unitValue} ${unitType}`;
  },

  // Calculate discount percentage
  calculateDiscountPercentage: (originalPrice, salePrice) => {
    if (!originalPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  },

  // Check if product has multiple units
  hasMultipleUnits: (product) => {
    return product?.hasMultipleUnits || (product?.units && product.units.length > 1);
  },

  // Get default unit for product
  getDefaultUnit: (product) => {
    if (product?.hasMultipleUnits && product?.units?.length > 0) {
      return product.units.find(unit => unit.isDefault) || product.units[0];
    }
    return {
      unitType: product?.unit || 'pcs',
      unitValue: 1,
      price: product?.price || 0,
      originalPrice: product?.originalPrice || product?.price || 0,
      stock: product?.stock || 0,
      sku: product?.sku || '',
      barcode: product?.barcode || ''
    };
  },

  // Get single product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      console.log(`Searching for product with barcode: ${barcode}`);
      
      // First try the dedicated barcode search
      const barcodeResults = await ProductServices.getProductsByBarcode(barcode);
      const products = barcodeResults?.products || barcodeResults || [];
      
      console.log(`Barcode search returned ${products.length} products`);
      
      // Find exact barcode match
      const exactMatch = products.find(p => p.barcode === barcode);
      if (exactMatch) {
        console.log(`Found exact barcode match:`, exactMatch._id);
        return exactMatch;
      }
      
      // If no exact match from barcode search, try regular search
      if (products.length === 0) {
        console.log('No products found with barcode search, trying regular search');
        try {
          const regularSearchResults = await ProductServices.searchProducts(barcode, 10);
          const regularProducts = regularSearchResults?.products || regularSearchResults || [];
          
          console.log(`Regular search returned ${regularProducts.length} products`);
          
          // Look for barcode match in regular search results
          const regularExactMatch = regularProducts.find(p => p.barcode === barcode);
          if (regularExactMatch) {
            console.log(`Found exact barcode match in regular search:`, regularExactMatch._id);
            return regularExactMatch;
          }
          
          // Look for SKU match as fallback
          const skuMatch = regularProducts.find(p => p.sku === barcode);
          if (skuMatch) {
            console.log(`Found SKU match:`, skuMatch._id);
            return skuMatch;
          }
          
          // If still no exact match, return first result if available
          if (regularProducts.length > 0) {
            console.log(`No exact match, returning first result:`, regularProducts[0]._id);
            return regularProducts[0];
          }
        } catch (searchError) {
          console.error('Regular search failed:', searchError);
        }
      }
      
      // If no exact match, return first result from barcode search (if any)
      if (products.length > 0) {
        console.log(`No exact match, returning first barcode search result:`, products[0]._id);
        return products[0];
      }
      
      console.log(`No product found for barcode: ${barcode}`);
      return null;
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      return null;
    }
  }
};

export default ProductServices;
