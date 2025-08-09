// 📦 Inventory Analytics Controller - Task 3.1.2 Implementation  
// 🎸 RESTful API endpoints for comprehensive inventory analytics

const InventoryAnalyticsService = require('../services/InventoryAnalyticsService');

class InventoryAnalyticsController {
  constructor() {
    this.inventoryService = new InventoryAnalyticsService();
  }

  // 🎸 GET /api/reports/inventory/overview
  async getStockOverview(req, res) {
    try {
      const { 
        includeOutOfStock = 'true', 
        lowStockThreshold = 10, 
        category = null,
        page = 1,
        limit = 100
      } = req.query;

      console.log("🎸 Stock Overview Request:", {
        includeOutOfStock,
        lowStockThreshold: parseInt(lowStockThreshold),
        category,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const result = await this.inventoryService.getStockOverview({
        includeOutOfStock: includeOutOfStock === 'true',
        lowStockThreshold: parseInt(lowStockThreshold),
        category,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 Stock Overview Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stock overview",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/movement
  async getStockMovement(req, res) {
    try {
      const { 
        period = 30, 
        productId = null, 
        movementType = null,
        page = 1,
        limit = 100
      } = req.query;

      console.log("🎸 Stock Movement Request:", {
        period: parseInt(period),
        productId,
        movementType,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const result = await this.inventoryService.getStockMovement({
        period: parseInt(period),
        productId,
        movementType,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 Stock Movement Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stock movement",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/velocity
  async getProductVelocity(req, res) {
    try {
      const { 
        period = 90, 
        classification = null,
        limit = 50
      } = req.query;

      console.log("🎸 Product Velocity Request:", {
        period: parseInt(period),
        classification,
        limit: parseInt(limit)
      });

      const result = await this.inventoryService.getProductVelocity({
        period: parseInt(period),
        classification,
        limit: parseInt(limit)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 Product Velocity Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch product velocity analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/valuation
  async getInventoryValuation(req, res) {
    try {
      const { 
        method = 'fifo', 
        asOfDate = null,
        groupBy = 'category'
      } = req.query;

      console.log("🎸 Inventory Valuation Request:", {
        method,
        asOfDate,
        groupBy
      });

      const result = await this.inventoryService.getInventoryValuation({
        method,
        asOfDate,
        groupBy
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 Inventory Valuation Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inventory valuation",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/abc-analysis
  async getABCAnalysis(req, res) {
    try {
      const { period = 90 } = req.query;

      console.log("🎸 ABC Analysis Request:", {
        period: parseInt(period)
      });

      const result = await this.inventoryService.getABCAnalysis({
        period: parseInt(period)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 ABC Analysis Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch ABC analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/dashboard
  async getInventoryDashboard(req, res) {
    try {
      const { 
        lowStockThreshold = 10, 
        period = 30
      } = req.query;

      console.log("🎸 Inventory Dashboard Request:", {
        lowStockThreshold: parseInt(lowStockThreshold),
        period: parseInt(period)
      });

      const result = await this.inventoryService.getInventoryDashboard({
        lowStockThreshold: parseInt(lowStockThreshold),
        period: parseInt(period)
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error("🎸 Inventory Dashboard Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inventory dashboard",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/inventory/export
  async exportInventoryReport(req, res) {
    try {
      const { 
        format = 'csv',
        reportType = 'overview',
        includeOutOfStock = 'true',
        lowStockThreshold = 10,
        period = 30
      } = req.query;

      console.log("🎸 Export Inventory Report Request:", {
        format,
        reportType,
        includeOutOfStock,
        lowStockThreshold: parseInt(lowStockThreshold),
        period: parseInt(period)
      });

      let data;
      let filename;

      // Get data based on report type
      switch (reportType) {
        case 'overview':
          data = await this.inventoryService.getStockOverview({
            includeOutOfStock: includeOutOfStock === 'true',
            lowStockThreshold: parseInt(lowStockThreshold),
            limit: 10000 // Get all data for export
          });
          filename = `inventory_overview_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'movement':
          data = await this.inventoryService.getStockMovement({
            period: parseInt(period),
            limit: 10000
          });
          filename = `stock_movement_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'velocity':
          data = await this.inventoryService.getProductVelocity({
            period: parseInt(period),
            limit: 10000
          });
          filename = `product_velocity_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'valuation':
          data = await this.inventoryService.getInventoryValuation({
            groupBy: 'category'
          });
          filename = `inventory_valuation_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'abc':
          data = await this.inventoryService.getABCAnalysis({
            period: parseInt(period)
          });
          filename = `abc_analysis_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type"
          });
      }

      if (!data.success) {
        return res.status(400).json(data);
      }

      // Format data for export
      let exportData = [];
      
      switch (reportType) {
        case 'overview':
          exportData = data.data.stockItems.map(item => ({
            'Product Title': item.title?.en || item.title || 'Unknown',
            'SKU': item.sku || '',
            'Barcode': item.barcode || '',
            'Category': item.categoryName?.en || item.categoryName || 'Uncategorized',
            'Current Stock': item.stock || 0,
            'Stock Value': item.stockValue || 0,
            'Stock Status': item.stockStatus || 'unknown',
            'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
          }));
          break;
        case 'movement':
          exportData = data.data.movements.map(item => ({
            'Product Title': item.productTitle?.en || item.productTitle || 'Unknown',
            'SKU': item.sku || '',
            'Movement Type': item.movementType || 'out',
            'Quantity': item.quantity || 0,
            'Unit Price': item.unitPrice || 0,
            'Total Value': item.totalValue || 0,
            'Reason': item.reason || 'Sale',
            'Date': item.date ? new Date(item.date).toLocaleDateString() : '',
            'Order ID': item.orderId || ''
          }));
          break;
        case 'velocity':
          exportData = data.data.velocityAnalysis.map(item => ({
            'Product Title': item.productTitle?.en || item.productTitle || 'Unknown',
            'SKU': item.sku || '',
            'Current Stock': item.currentStock || 0,
            'Total Sold': item.totalSold || 0,
            'Total Revenue': item.totalRevenue || 0,
            'Velocity Score': item.velocityScore || 0,
            'Turnover Rate': item.turnoverRate || 0,
            'Classification': item.velocityClassification || 'slow',
            'Order Count': item.orderCount || 0
          }));
          break;
        case 'valuation':
          exportData = data.data.valuation.map(item => ({
            'Product Title': item.title?.en || item.title || 'Unknown',
            'SKU': item.sku || '',
            'Category': item.categoryName?.en || item.categoryName || 'Uncategorized',
            'Current Stock': item.stock || 0,
            'Cost Price': item.costPrice || 0,
            'Selling Price': item.sellingPrice || 0,
            'Stock Value': item.stockValue || 0,
            'Potential Revenue': item.potentialRevenue || 0,
            'Potential Profit': item.potentialProfit || 0
          }));
          break;
        case 'abc':
          exportData = data.data.abcAnalysis.map(item => ({
            'Product Title': item.productTitle?.en || item.productTitle || 'Unknown',
            'SKU': item.sku || '',
            'Classification': item.classification || 'C',
            'Rank': item.rank || 0,
            'Total Revenue': item.totalRevenue || 0,
            'Revenue %': item.revenuePercentage?.toFixed(2) || '0.00',
            'Cumulative %': item.cumulativePercentage?.toFixed(2) || '0.00',
            'Total Quantity': item.totalQuantity || 0,
            'Current Stock': item.currentStock || 0
          }));
          break;
      }

      // Return CSV format
      if (format === 'csv') {
        const csvContent = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvContent);
      }

      // Return JSON format
      res.json({
        success: true,
        data: exportData,
        filename: `${filename}.json`
      });

    } catch (error) {
      console.error("🎸 Export Inventory Report Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export inventory report",
        error: error.message
      });
    }
  }

  // 🎸 Helper method to convert data to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = InventoryAnalyticsController; 