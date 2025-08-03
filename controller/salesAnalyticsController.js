const SalesAnalyticsService = require("../services/SalesAnalyticsService");

/**
 * 📊 SalesAnalyticsController - Task 2.1.2 Implementation
 * RESTful API controller for sales analytics and reporting
 * Orchestrates the SalesAnalyticsService with proper error handling
 */
class SalesAnalyticsController {
  constructor() {
    this.salesService = new SalesAnalyticsService();
  }

  /**
   * 🔥 GET /api/reports/sales/overview
   * Get comprehensive sales overview with period comparison
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getSalesOverview = async (req, res) => {
    try {
      const {
        period = 'daily',
        startDate,
        endDate,
        compare = 'true'
      } = req.query;

      console.log(`📊 Sales Overview Request: ${period} period from ${req.user?.name || 'Admin'}`);

      // Validate period parameter
      const validPeriods = ['daily', 'weekly', 'monthly'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
        });
      }

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;
      
      // Validate dates
      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get sales overview from service
      const overview = await this.salesService.getSalesOverview({
        period,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        comparePrevious: compare === 'true'
      });

      res.status(200).json({
        success: true,
        message: 'Sales overview retrieved successfully',
        ...overview
      });

    } catch (error) {
      console.error("❌ Sales Overview Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sales overview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 🏆 GET /api/reports/sales/products
   * Get detailed product performance analysis
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getProductPerformance = async (req, res) => {
    try {
      const {
        limit = '20',
        sortBy = 'revenue',
        categoryId,
        startDate,
        endDate
      } = req.query;

      console.log(`🏆 Product Performance Request: ${sortBy} sort, limit ${limit}`);

      // Validate limit
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 100'
        });
      }

      // Validate sortBy
      const validSortOptions = ['revenue', 'quantity', 'orders', 'profit'];
      if (!validSortOptions.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}`
        });
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get product performance from service
      const productPerformance = await this.salesService.getProductPerformance({
        limit: parsedLimit,
        sortBy,
        categoryId,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });

      res.status(200).json({
        success: true,
        message: 'Product performance retrieved successfully',
        ...productPerformance
      });

    } catch (error) {
      console.error("❌ Product Performance Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product performance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 👥 GET /api/reports/sales/customers
   * Get customer segmentation and behavior analysis
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getCustomerAnalytics = async (req, res) => {
    try {
      const {
        segment,
        startDate,
        endDate,
        minOrderValue
      } = req.query;

      console.log(`👥 Customer Analytics Request: ${segment ? `${segment} segment` : 'all segments'}`);

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;
      const parsedMinOrderValue = minOrderValue ? parseFloat(minOrderValue) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      if (minOrderValue && isNaN(parsedMinOrderValue)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid minOrderValue. Must be a number'
        });
      }

      // Get customer segmentation from service
      const customerAnalytics = await this.salesService.getCustomerSegmentation({
        segment,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        minOrderValue: parsedMinOrderValue
      });

      res.status(200).json({
        success: true,
        message: 'Customer analytics retrieved successfully',
        ...customerAnalytics
      });

    } catch (error) {
      console.error("❌ Customer Analytics Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 📈 GET /api/reports/sales/trends
   * Get sales trends and forecasting data
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getSalesTrends = async (req, res) => {
    try {
      const {
        granularity = 'daily',
        startDate,
        endDate,
        includeForecasting = 'false'
      } = req.query;

      console.log(`📈 Sales Trends Request: ${granularity} granularity`);

      // Validate granularity
      const validGranularities = ['daily', 'weekly', 'monthly'];
      if (!validGranularities.includes(granularity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}`
        });
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get sales trends from service
      const salesTrends = await this.salesService.getSalesTrends({
        granularity,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        includeForecasting: includeForecasting === 'true'
      });

      res.status(200).json({
        success: true,
        message: 'Sales trends retrieved successfully',
        ...salesTrends
      });

    } catch (error) {
      console.error("❌ Sales Trends Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sales trends',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 🌍 GET /api/reports/sales/geographic
   * Get geographic sales analysis by delivery zones
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getGeographicAnalysis = async (req, res) => {
    try {
      const {
        groupBy = 'city',
        startDate,
        endDate,
        limit = '20'
      } = req.query;

      console.log(`🌍 Geographic Analysis Request: grouped by ${groupBy}`);

      // Validate groupBy
      const validGroupOptions = ['zone', 'city', 'area', 'country'];
      if (!validGroupOptions.includes(groupBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid groupBy. Must be one of: ${validGroupOptions.join(', ')}`
        });
      }

      // Validate limit
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 100'
        });
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get geographic analysis from service
      const geographicAnalysis = await this.salesService.getGeographicAnalysis({
        groupBy,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        limit: parsedLimit
      });

      res.status(200).json({
        success: true,
        message: 'Geographic analysis retrieved successfully',
        ...geographicAnalysis
      });

    } catch (error) {
      console.error("❌ Geographic Analysis Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve geographic analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 💳 GET /api/reports/sales/payment-methods
   * Get payment method analysis and trends
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getPaymentMethodAnalysis = async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        includeMetrics = 'true'
      } = req.query;

      console.log(`💳 Payment Method Analysis Request`);

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get payment method analysis from service
      const paymentAnalysis = await this.salesService.getPaymentMethodAnalysis({
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        includeMetrics: includeMetrics === 'true'
      });

      res.status(200).json({
        success: true,
        message: 'Payment method analysis retrieved successfully',
        ...paymentAnalysis
      });

    } catch (error) {
      console.error("❌ Payment Method Analysis Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment method analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 🎯 GET /api/reports/sales/top-products
   * Get top performing products with detailed metrics
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getTopProducts = async (req, res) => {
    try {
      const {
        limit = '10',
        sortBy = 'revenue',
        startDate,
        endDate
      } = req.query;

      console.log(`🎯 Top Products Request: top ${limit} by ${sortBy}`);

      // Validate limit
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 50'
        });
      }

      // Validate sortBy
      const validSortOptions = ['revenue', 'quantity', 'orders'];
      if (!validSortOptions.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}`
        });
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // Get top products from service
      const topProducts = await this.salesService.getTopPerformingProducts({
        limit: parsedLimit,
        sortBy,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });

      res.status(200).json({
        success: true,
        message: 'Top products retrieved successfully',
        ...topProducts
      });

    } catch (error) {
      console.error("❌ Top Products Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve top products',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 📦 GET /api/reports/sales/categories
   * Get sales performance analysis by product categories
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getCategorySales = async (req, res) => {
    try {
      const {
        limit = '20',
        sortBy = 'revenue',
        startDate,
        endDate,
        includeSubcategories = 'true'
      } = req.query;

      console.log(`📦 Category Sales Request: ${sortBy} sort, limit ${limit}`);

      // Validate limit
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 100'
        });
      }

      // Validate sortBy
      const validSortOptions = ['revenue', 'quantity', 'orders', 'products'];
      if (!validSortOptions.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortBy. Must be one of: ${validSortOptions.join(', ')}`
        });
      }

      // Parse and validate dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD'
        });
      }
      
      if (endDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD'
        });
      }

      // 🎸 Debug: Let's check some sample order data first
      const Order = require('../models/Order');
      const Category = require('../models/Category');
      
      console.log("🎸 DEBUG: Checking sample order data...");
      const sampleOrder = await Order.findOne({}).limit(1);
      if (sampleOrder && sampleOrder.cart && sampleOrder.cart.length > 0) {
        console.log("🎸 Sample cart item:", {
          category: sampleOrder.cart[0].category,
          categoryType: typeof sampleOrder.cart[0].category,
          title: sampleOrder.cart[0].title
        });
      }
      
      console.log("🎸 DEBUG: Checking sample category data...");
      const sampleCategory = await Category.findOne({}).limit(1);
      if (sampleCategory) {
        console.log("🎸 Sample category:", {
          _id: sampleCategory._id,
          name: sampleCategory.name,
          nameType: typeof sampleCategory.name
        });
      }

      // Get category sales from service
      const categorySales = await this.salesService.getCategorySales({
        limit: parsedLimit,
        sortBy,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        includeSubcategories: includeSubcategories === 'true'
      });

      res.status(200).json({
        success: true,
        message: 'Category sales retrieved successfully',
        ...categorySales
      });

    } catch (error) {
      console.error("❌ Category Sales Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category sales',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 📄 GET/POST /api/reports/sales/export
   * Export sales report in various formats (PDF, Excel, CSV)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  exportSalesReport = async (req, res) => {
    try {
      const {
        format = 'pdf',
        reportType = 'overview',
        startDate,
        endDate,
        ...otherParams
      } = req.method === 'GET' ? req.query : req.body;

      console.log(`📄 Sales Export Request: ${reportType} as ${format}`);

      // Validate format
      const validFormats = ['pdf', 'excel', 'csv', 'json'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
        });
      }

      // Validate report type
      const validReportTypes = ['overview', 'products', 'customers', 'trends', 'geographic'];
      if (!validReportTypes.includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid reportType. Must be one of: ${validReportTypes.join(', ')}`
        });
      }

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      // Get data based on report type
      let reportData;
      switch (reportType) {
        case 'overview':
          reportData = await this.salesService.getSalesOverview({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ...otherParams
          });
          break;
        case 'products':
          reportData = await this.salesService.getProductPerformance({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ...otherParams
          });
          break;
        case 'customers':
          reportData = await this.salesService.getCustomerSegmentation({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ...otherParams
          });
          break;
        case 'trends':
          reportData = await this.salesService.getSalesTrends({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ...otherParams
          });
          break;
        case 'geographic':
          reportData = await this.salesService.getGeographicAnalysis({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            ...otherParams
          });
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      // For now, return JSON data with export metadata
      // In production, this would generate actual PDF/Excel files
      res.status(200).json({
        success: true,
        message: `Sales ${reportType} report exported successfully`,
        export: {
          format,
          reportType,
          generatedAt: new Date().toISOString(),
          filename: `sales_${reportType}_${Date.now()}.${format}`,
          // TODO: Implement actual file generation in Phase 3
          downloadUrl: null
        },
        data: reportData.data
      });

    } catch (error) {
      console.error("❌ Sales Export Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to export sales report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * 📊 GET /api/reports/sales/dashboard
   * Get combined data for sales dashboard with all key metrics
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getSalesDashboard = async (req, res) => {
    try {
      const {
        period = 'daily',
        startDate,
        endDate
      } = req.query;

      console.log(`📊 Sales Dashboard Request: ${period} period`);

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      // Get all dashboard data in parallel for better performance
      const [overview, topProducts, trends, paymentMethods] = await Promise.all([
        this.salesService.getSalesOverview({
          period,
          startDate: parsedStartDate,
          endDate: parsedEndDate
        }),
        this.salesService.getTopPerformingProducts({
          limit: 5,
          startDate: parsedStartDate,
          endDate: parsedEndDate
        }),
        this.salesService.getSalesTrends({
          granularity: period,
          startDate: parsedStartDate,
          endDate: parsedEndDate
        }),
        this.salesService.getPaymentMethodAnalysis({
          startDate: parsedStartDate,
          endDate: parsedEndDate
        })
      ]);

      res.status(200).json({
        success: true,
        message: 'Sales dashboard data retrieved successfully',
        data: {
          overview: overview.data.overview,
          trends: trends.data.trends,
          topProducts: topProducts.data,
          paymentMethods: paymentMethods.data.paymentMethods,
          comparison: overview.data.comparison,
          period,
          dateRange: overview.data.dateRange
        }
      });

    } catch (error) {
      console.error("❌ Sales Dashboard Controller Error:", error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sales dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

// Export controller instance methods
const salesController = new SalesAnalyticsController();

module.exports = {
  getSalesOverview: salesController.getSalesOverview,
  getProductPerformance: salesController.getProductPerformance,
  getCustomerAnalytics: salesController.getCustomerAnalytics,
  getSalesTrends: salesController.getSalesTrends,
  getGeographicAnalysis: salesController.getGeographicAnalysis,
  getPaymentMethodAnalysis: salesController.getPaymentMethodAnalysis,
  getTopProducts: salesController.getTopProducts,
  getCategorySales: salesController.getCategorySales,
  exportSalesReport: salesController.exportSalesReport,
  getSalesDashboard: salesController.getSalesDashboard
}; 