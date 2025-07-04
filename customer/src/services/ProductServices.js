import requests from "./httpServices";

const ProductServices = {
  getShowingProducts: async () => {
    return requests.get("/products/show");
  },

  getShowingStoreProducts: async ({ category = "", title = "", slug = "" }) => {
    console.log("Calling getShowingStoreProducts with params:", { category, title, slug });
    
    // Build query string manually to ensure proper formatting
    let endpoint = "/products/store";
    const params = [];
    
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (title) params.push(`title=${encodeURIComponent(title)}`);
    if (slug) params.push(`slug=${encodeURIComponent(slug)}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    
    console.log("API endpoint:", endpoint);
    return requests.get(endpoint);
  },

  getDiscountedProducts: async () => {
    return requests.get("/products/discount");
  },

  getProductBySlug: async (slug) => {
    return requests.get(`/products/${slug}`);
  },

  getAllProducts: async () => {
    return requests.get("/products");
  },
};

export default ProductServices;
