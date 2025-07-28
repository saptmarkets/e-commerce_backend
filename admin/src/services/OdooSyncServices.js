import requests from "./httpService";

/**
 * OdooSyncServices
 * ---------------------------------------------------------
 * A simple service layer for interacting with the backend
 * Odoo Sync API endpoints. All methods return the raw API
 * response allowing callers to handle success/error cases.
 */

const OdooSyncServices = {
  /**
   * Test Odoo connection
   * GET /api/odoo-sync/connection/test
   */
  testConnection: () => requests.get("/odoo-sync/connection/test"),

  /**
   * Get current connection status
   * GET /api/odoo-sync/connection/status
   */
  getConnectionStatus: () => requests.get("/odoo-sync/connection/status"),

  /**
   * Fetch data from Odoo to temporary odoo_* collections.
   * @param {Array<string>} dataTypes - Optional list of data types, defaults to ['all']
   */
  fetchFromOdoo: (dataTypes = ["all"]) =>
    requests.post("/odoo-sync/fetch", { dataTypes }),

  /**
   * Retrieve high-level statistics about fetched data.
   */
  getStatistics: () => requests.get("/odoo-sync/statistics"),

  /**
   * Preview import from odoo_* collections into store collections.
   * @param {Array<string>} dataTypes
   */
  getImportPreview: (dataTypes = ["all"]) =>
    requests.post("/odoo-sync/import/preview", { dataTypes }),

  /**
   * Trigger actual import into store collections.
   * @param {Array<string>} dataTypes
   */
  importToStore: (dataTypes = ["all"]) =>
    requests.post("/odoo-sync/import", { dataTypes }),

  /**
   * Clear temporary odoo_* collections (dangerous!).
   */
  clearOdooData: () => requests.delete("/odoo-sync/clear"),

  /**
   * Sync store with selected fields
   * @param {Object} payload
   */
  syncToStore: (payload) => requests.post("/odoo-sync/sync", payload),

  /**
   * Get internal locations (branches) list
   */
  listBranches: () => requests.get("/odoo-sync/branches"),

  /**
   * Push accumulated stock back to Odoo.
   * If locationId omitted, backend will fall back to env var.
   */
  pushBackStock: (payload) => requests.post("/odoo-sync/push-back/stock", payload),
};

export default OdooSyncServices; 