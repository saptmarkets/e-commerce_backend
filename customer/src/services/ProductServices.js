import requests from "./httpServices";

const ProductServices = {
  // Get all products for store display
  getShowingStoreProducts: async ({ category = '', title = '', slug = '', limit = 20, page = 1 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (title) params.append('title', title);
      if (slug) params.append('slug', slug);
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);

      const endpoint = `/products/store?${params.toString()}`;
      return await requests.get(endpoint);
    } catch (error) {
      console.error('Error fetching store products:', error);
      throw error;
    }
  },

  // Get all products (admin)
  getAllProducts: async ({ limit = 20, page = 1 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);

      return await requests.get(`/products?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (productId) => {
    try {
      return await requests.get(`/products/${productId}`);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  // Get product by slug
  getProductBySlug: async (slug) => {
    try {
      return await requests.get(`/products/slug/${slug}`);
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (query, { limit = 20, page = 1 } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);

      return await requests.get(`/products/search?${params.toString()}`);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId, { limit = 20, page = 1 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);

      return await requests.get(`/products/category/${categoryId}?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async ({ limit = 10 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);

      return await requests.get(`/products/featured?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  // Get discounted products
  getDiscountedProducts: async ({ limit = 10 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);

      return await requests.get(`/products/discounted?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching discounted products:', error);
      throw error;
    }
  },

  // Get related products
  getRelatedProducts: async (productId, { limit = 5 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);

      return await requests.get(`/products/${productId}/related?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  },

  // Check if a category has products
  checkCategoryHasProducts: async (categoryId) => {
    try {
      const response = await requests.get(`/products/category/${categoryId}/has-products`);
      return response.hasProducts;
    } catch (error) {
      console.error('Error checking if category has products:', error);
      return false; // Default to false if there's an error
    }
  }
};

export default ProductServices;
