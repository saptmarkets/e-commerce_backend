// Service for Odoo Pricelist Items (Promotions)
// Provides API wrappers for listing items and importing them as store promotions.

import httpService from './httpService';

const PREFIX = '/odoo-sync';

const OdooPricelistServices = {
  // Fetch paginated pricelist items
  listItems: (params = {}) => {
    return httpService.get(`${PREFIX}/pricelist-items`, { params });
  },

  // Import selected pricelist item IDs as promotions
  importPromotions: (itemIds = []) => {
    return httpService.post(`${PREFIX}/import-promotions`, { itemIds });
  },
};

export default OdooPricelistServices; 