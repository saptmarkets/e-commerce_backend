import requests from "./httpService";

const base = "/odoo-sync";

const OdooCatalogServices = {
  // List products with details
  listProducts: (params = {}) => {
    const clean = { include: 'details', ...params };
    Object.keys(clean).forEach(k => {
      if (clean[k] === undefined || clean[k] === null || clean[k] === '') delete clean[k];
    });
    const query = new URLSearchParams(clean).toString();
    return requests.get(`${base}/products?${query}`);
  },

  // Preview import
  previewImport: (payload) => {
    console.log('Preview import payload:', payload);
    return requests.post(`${base}/import/preview`, { importConfig: payload });
  },

  // Run import
  runImport: (payload) => {
    console.log('Run import payload:', payload);
    return requests.post(`${base}/import`, { importConfig: payload });
  },

  // Get sync logs for debugging
  getSyncLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requests.get(`${base}/logs?${query}`);
  },

  // Get import statistics
  getStatistics: () => {
    return requests.get(`${base}/statistics`);
  },

  // Test connection
  testConnection: () => {
    return requests.get(`${base}/test-connection`);
  },

  // Get categories
  getCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requests.get(`${base}/categories?${query}`);
  },

  // Get units of measure
  getUom: () => {
    return requests.get(`${base}/uom`);
  },

  // Get stock information
  getStock: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requests.get(`${base}/stock?${query}`);
  },

  // Get barcode units
  getBarcodeUnits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requests.get(`${base}/barcode-units?${query}`);
  },

  // Get pricelists
  getPricelists: () => {
    return requests.get(`${base}/pricelists`);
  },

  // Get pricelist items
  getPricelistItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requests.get(`${base}/pricelist-items?${query}`);
  }
};

export default OdooCatalogServices; 