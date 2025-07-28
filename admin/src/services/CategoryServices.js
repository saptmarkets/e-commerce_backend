import requests from "./httpService";

const CategoryServices = {
  getAllCategory: async () => {
    try {
      console.log('Fetching all categories (active)');
      const response = await requests.get("/category");
      console.log('Categories API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getAllCategories: async () => {
    try {
      console.log('Fetching all categories (including inactive)');
      const response = await requests.get("/category/all");
      console.log('All categories API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  },

  getShowingCategory: async () => {
    try {
      console.log('Fetching showing categories (nested structure)');
      const response = await requests.get("/category/show");
      console.log('Showing categories API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching showing categories:', error);
      throw error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await requests.get(`/category/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  addCategory: async (body) => {
    try {
      console.log('Adding new category:', body);
      const response = await requests.post("/category/add", body);
      return response;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  addAllCategory: async (body) => {
    try {
      const response = await requests.post("/category/add/all", body);
      return response;
    } catch (error) {
      console.error('Error adding all categories:', error);
      throw error;
    }
  },

  updateCategory: async (id, body) => {
    try {
      console.log(`Updating category ${id}:`, body);
      const response = await requests.put(`/category/${id}`, body);
      return response;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id, body) => {
    try {
      const response = await requests.put(`/category/status/${id}`, body);
      return response;
    } catch (error) {
      console.error(`Error updating category status ${id}:`, error);
      throw error;
    }
  },

  deleteCategory: async (id, body) => {
    try {
      const response = await requests.delete(`/category/${id}`, body);
      return response;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },

  updateManyCategory: async (body) => {
    try {
      const response = await requests.patch("/category/update/many", body);
      return response;
    } catch (error) {
      console.error('Error updating many categories:', error);
      throw error;
    }
  },

  deleteManyCategory: async (body) => {
    try {
      const response = await requests.patch("/category/delete/many", body);
      return response;
    } catch (error) {
      console.error('Error deleting many categories:', error);
      throw error;
    }
  },

  // Import all Odoo categories to store categories
  importAllOdooCategories: async () => {
    try {
      console.log('Importing all Odoo categories to store...');
      const response = await requests.post("/odoo-sync/import-categories");
      console.log('Odoo categories import response:', response);
      return response;
    } catch (error) {
      console.error('Error importing Odoo categories:', error);
      throw error;
    }
  },
};

export default CategoryServices;
