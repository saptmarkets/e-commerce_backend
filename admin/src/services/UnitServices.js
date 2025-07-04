import requests from './httpService';

const UnitServices = {
  getAllUnits: async () => {
    try {
      console.log('Fetching all units');
      const response = await requests.get('/units');
      console.log('Units API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all units:', error);
      throw error;
    }
  },

  getUnitsGrouped: async () => {
    try {
      const response = await requests.get('/units/grouped');
      return response;
    } catch (error) {
      console.error('Error fetching grouped units:', error);
      throw error;
    }
  },

  getBasicUnits: async () => {
    try {
      console.log('Fetching basic units');
      const response = await requests.get('/units/basic');
      console.log('Basic units API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching basic units:', error);
      throw error;
    }
  },

  getUnitsByBasicType: async (basicType) => {
    try {
      const response = await requests.get(`/units/type/${basicType}`);
      return response;
    } catch (error) {
      console.error('Error fetching units by basic type:', error);
      throw error;
    }
  },

  getMultiUnits: async (parentUnitId) => {
    try {
      const response = await requests.get(`/units/multi/${parentUnitId}`);
      return response;
    } catch (error) {
      console.error('Error fetching multi units:', error);
      throw error;
    }
  },

  // Get compatible units for a given basic unit
  getCompatibleUnits: async (basicUnitId) => {
    try {
      if (!basicUnitId) {
        return requests.get('/units/basic');
      }
      return requests.get(`/units/compatible/${basicUnitId}`);
    } catch (error) {
      console.error('Error fetching compatible units:', error);
      throw error;
    }
  },

  getShowingUnits: async () => {
    try {
      console.log('Fetching showing units');
      const response = await requests.get('/units/show');
      console.log('Showing units API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching showing units:', error);
      throw error;
    }
  },

  getUnitById: async (id) => {
    try {
      const response = await requests.get(`/units/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching unit by ID:', error);
      throw error;
    }
  },

  addUnit: async (unit) => {
    try {
      console.log('Adding new unit:', unit);
      const response = await requests.post('/units', unit);
      return response;
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  },

  updateUnit: async (id, unit) => {
    try {
      console.log(`Updating unit ${id}:`, unit);
      const response = await requests.put(`/units/${id}`, unit);
      return response;
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await requests.put(`/units/status/${id}`, { status });
      return response;
    } catch (error) {
      console.error('Error updating unit status:', error);
      throw error;
    }
  },

  deleteUnit: async (id) => {
    try {
      const response = await requests.delete(`/units/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  },
};

export default UnitServices; 