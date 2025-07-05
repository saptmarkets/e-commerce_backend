const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

// Import required models
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

/**
 * 📊 SalesAnalyticsService - Task 2.1.1 Implementation
 * Comprehensive sales data aggregation and analysis service
 * Following project patterns with proper error handling and optimization
 */
class SalesAnalyticsService {
  constructor() {
    this.defaultTimeZone = 'UTC';
    this.cacheTTL = 300; // 5 minutes cache for heavy queries
  }

  /**
   * 🔥 Get comprehensive sales overview with period comparison
   * @param {Object} options - Query options
   * @param {string} options.period - daily|weekly|monthly 
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @param {boolean} options.comparePrevious - Include previous period comparison
   * @returns {Object} Complete sales overview with trends and comparisons
   */
  async getSalesOverview(options = {}) {
    try {
      const {
        period = 'daily',
        startDate,
        endDate,
        comparePrevious = true
      } = options;

      // Calculate date ranges
      const dateRange = this._calculateDateRange(startDate, endDate, period);
      
      console.log(`📊 Generating sales overview for ${period} period: ${dateRange.start} to ${dateRange.end}`);

      // Main period sales data
      const currentPeriodData = await this._getSalesByPeriod(dateRange.start, dateRange.end, period);
      
      // Previous period comparison if requested
      let comparisonData = null;
      if (comparePrevious) {
        const prevRange = this._calculatePreviousPeriod(dateRange.start, dateRange.end);
        comparisonData = await this._getSalesByPeriod(prevRange.start, prevRange.end, period);
      }

      // Calculate growth metrics
      const growthMetrics = this._calculateGrowthMetrics(currentPeriodData.summary, comparisonData?.summary);

      // Get additional insights
      const [topProducts, customerSegments, paymentMethods] = await Promise.all([
        this.getTopPerformingProducts({ startDate: dateRange.start, endDate: dateRange.end, limit: 10 }),
        this.getCustomerSegmentation({ startDate: dateRange.start, endDate: dateRange.end }),
        this.getPaymentMethodAnalysis({ startDate: dateRange.start, endDate: dateRange.end })
      ]);

      return {
        success: true,
        data: {
          period,
          dateRange,
          overview: {
            ...currentPeriodData.summary,
            ...growthMetrics
          },
          trends: currentPeriodData.trends,
          comparison: comparisonData ? {
            current: currentPeriodData.summary,
            previous: comparisonData.summary,
            growth: growthMetrics
          } : null,
          insights: {
            topProducts: topProducts.data,
            customerSegments: customerSegments.data,
            paymentMethods: paymentMethods.data
          }
        }
      };

    } catch (error) {
      console.error("❌ Sales Overview Error:", error);
      throw new Error(`Failed to generate sales overview: ${error.message}`);
    }
  }

  /**
   * 🏆 Get detailed product performance analysis
   * @param {Object} options - Analysis options
   * @param {number} options.limit - Number of products to return
   * @param {string} options.sortBy - revenue|quantity|profit|growth
   * @param {string} options.categoryId - Filter by category
   * @param {Date} options.startDate - Analysis start date
   * @param {Date} options.endDate - Analysis end date
   * @returns {Object} Detailed product performance data
   */
  async getProductPerformance(options = {}) {
    try {
      const {
        limit = 50,
        sortBy = 'revenue',
        categoryId,
        startDate,
        endDate
      } = options;

      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`🏆 Analyzing product performance: ${sortBy} (${limit} products)`);

      // Build aggregation pipeline
      const matchQuery = {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        },
        status: { $ne: "Cancel" }
      };

      // Product performance aggregation
      const pipeline = [
        { $match: matchQuery },
        { $unwind: "$cart" },
        ...(categoryId ? [{ $match: { "cart.category": categoryId } }] : []),
        {
          $group: {
            _id: {
              productId: "$cart.productId",
              title: "$cart.title",
              category: "$cart.category",
              image: "$cart.image"
            },
            totalRevenue: { 
              $sum: { $multiply: ["$cart.price", "$cart.quantity"] } 
            },
            totalQuantity: { $sum: "$cart.quantity" },
            totalOrders: { $addToSet: "$_id" },
            avgPrice: { $avg: "$cart.price" },
            minPrice: { $min: "$cart.price" },
            maxPrice: { $max: "$cart.price" }
          }
        },
        {
          $project: {
            productId: "$_id.productId",
            title: "$_id.title",
            category: "$_id.category",
            image: "$_id.image",
            totalRevenue: 1,
            totalQuantity: 1,
            totalOrders: { $size: "$totalOrders" },
            avgPrice: { $round: ["$avgPrice", 2] },
            minPrice: 1,
            maxPrice: 1,
            revenuePerOrder: { 
              $round: [{ $divide: ["$totalRevenue", { $size: "$totalOrders" }] }, 2] 
            }
          }
        },
        { $sort: this._getSortCriteria(sortBy) },
        { $limit: limit }
      ];

      const productData = await Order.aggregate(pipeline);

      // Calculate performance metrics
      const totalRevenue = productData.reduce((sum, product) => sum + product.totalRevenue, 0);
      const totalQuantity = productData.reduce((sum, product) => sum + product.totalQuantity, 0);

      return {
        success: true,
        data: {
          products: productData.map(product => ({
            ...product,
            revenuePercentage: ((product.totalRevenue / totalRevenue) * 100).toFixed(2),
            quantityPercentage: ((product.totalQuantity / totalQuantity) * 100).toFixed(2)
          })),
          summary: {
            totalProducts: productData.length,
            totalRevenue,
            totalQuantity,
            avgRevenuePerProduct: totalRevenue / productData.length
          },
          filters: { limit, sortBy, categoryId },
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Product Performance Error:", error);
      throw new Error(`Failed to analyze product performance: ${error.message}`);
    }
  }

  /**
   * 👥 Get customer segmentation analysis with RFM methodology
   * @param {Object} options - Segmentation options
   * @param {Date} options.startDate - Analysis start date
   * @param {Date} options.endDate - Analysis end date
   * @returns {Object} Customer segmentation data with RFM analysis
   */
  async getCustomerSegmentation(options = {}) {
    try {
      const { startDate, endDate } = options;
      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`👥 Analyzing customer segmentation for period: ${dateRange.start} to ${dateRange.end}`);

      // RFM Analysis (Recency, Frequency, Monetary)
      const rfmAnalysis = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            status: { $ne: "Cancel" }
          }
        },
        {
          $group: {
            _id: "$user",
            frequency: { $count: {} },
            monetary: { $sum: "$total" },
            recency: { $max: "$createdAt" },
            firstOrder: { $min: "$createdAt" },
            avgOrderValue: { $avg: "$total" }
          }
        },
        {
          $addFields: {
            daysSinceLastOrder: {
              $divide: [
                { $subtract: [new Date(), "$recency"] },
                1000 * 60 * 60 * 24
              ]
            },
            customerLifetimeDays: {
              $divide: [
                { $subtract: ["$recency", "$firstOrder"] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      ]);

      // Segment customers based on RFM scores
      const segments = this._categorizeCustomers(rfmAnalysis);

      // Geographic distribution
      const geographicData = await this._getGeographicDistribution(dateRange);

      // New vs returning customers
      const customerTypes = await this._getCustomerTypes(dateRange);

      return {
        success: true,
        data: {
          rfmAnalysis: {
            totalCustomers: rfmAnalysis.length,
            avgFrequency: this._calculateAverage(rfmAnalysis, 'frequency'),
            avgMonetary: this._calculateAverage(rfmAnalysis, 'monetary'),
            avgRecency: this._calculateAverage(rfmAnalysis, 'daysSinceLastOrder')
          },
          segments,
          geographic: geographicData,
          customerTypes,
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Customer Segmentation Error:", error);
      throw new Error(`Failed to analyze customer segmentation: ${error.message}`);
    }
  }

  /**
   * 🌍 Get geographic sales analysis by delivery zones
   * @param {Object} options - Geographic analysis options
   * @param {Date} options.startDate - Analysis start date
   * @param {Date} options.endDate - Analysis end date
   * @param {string} options.groupBy - zone|city|area
   * @returns {Object} Geographic sales distribution data
   */
  async getGeographicAnalysis(options = {}) {
    try {
      const { startDate, endDate, groupBy = 'city' } = options;
      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`🌍 Analyzing geographic sales by ${groupBy}`);

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            status: { $ne: "Cancel" }
          }
        },
        {
          $group: {
            _id: `$user_info.${groupBy}`,
            totalRevenue: { $sum: "$total" },
            totalOrders: { $count: {} },
            uniqueCustomers: { $addToSet: "$user" },
            avgOrderValue: { $avg: "$total" }
          }
        },
        {
          $project: {
            location: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
            uniqueCustomers: { $size: "$uniqueCustomers" },
            avgOrderValue: { $round: ["$avgOrderValue", 2] }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ];

      const geographicData = await Order.aggregate(pipeline);

      // Calculate percentages and rankings
      const totalRevenue = geographicData.reduce((sum, item) => sum + item.totalRevenue, 0);
      const enrichedData = geographicData.map((item, index) => ({
        ...item,
        rank: index + 1,
        revenuePercentage: ((item.totalRevenue / totalRevenue) * 100).toFixed(2),
        revenuePerCustomer: (item.totalRevenue / item.uniqueCustomers).toFixed(2)
      }));

      return {
        success: true,
        data: {
          locations: enrichedData,
          summary: {
            totalLocations: geographicData.length,
            totalRevenue,
            avgRevenuePerLocation: totalRevenue / geographicData.length
          },
          groupBy,
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Geographic Analysis Error:", error);
      throw new Error(`Failed to analyze geographic sales: ${error.message}`);
    }
  }

  /**
   * 💳 Get payment method analysis and trends
   * @param {Object} options - Payment analysis options
   * @returns {Object} Payment method distribution and trends
   */
  async getPaymentMethodAnalysis(options = {}) {
    try {
      const { startDate, endDate } = options;
      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`💳 Analyzing payment methods for period: ${dateRange.start} to ${dateRange.end}`);

      const paymentData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            status: { $ne: "Cancel" }
          }
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$total" },
            totalOrders: { $count: {} },
            avgOrderValue: { $avg: "$total" },
            uniqueCustomers: { $addToSet: "$user" }
          }
        },
        {
          $project: {
            paymentMethod: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
            avgOrderValue: { $round: ["$avgOrderValue", 2] },
            uniqueCustomers: { $size: "$uniqueCustomers" }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      // Calculate percentages and insights
      const totalRevenue = paymentData.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalOrders = paymentData.reduce((sum, item) => sum + item.totalOrders, 0);

      const enrichedData = paymentData.map(item => ({
        ...item,
        revenuePercentage: ((item.totalRevenue / totalRevenue) * 100).toFixed(2),
        orderPercentage: ((item.totalOrders / totalOrders) * 100).toFixed(2)
      }));

      return {
        success: true,
        data: {
          paymentMethods: enrichedData,
          summary: {
            totalMethods: paymentData.length,
            totalRevenue,
            totalOrders,
            mostPopularMethod: enrichedData[0]?.paymentMethod,
            highestRevenueMethod: enrichedData[0]?.paymentMethod
          },
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Payment Method Analysis Error:", error);
      throw new Error(`Failed to analyze payment methods: ${error.message}`);
    }
  }

  /**
   * 📈 Get sales trends with forecasting capabilities
   * @param {Object} options - Trend analysis options
   * @returns {Object} Sales trends and forecasting data
   */
  async getSalesTrends(options = {}) {
    try {
      const { startDate, endDate, granularity = 'daily' } = options;
      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`📈 Analyzing sales trends with ${granularity} granularity`);

      // Get time-series sales data
      const trendsData = await this._getTimeSeriesData(dateRange, granularity);
      
      // Calculate moving averages and growth rates
      const enrichedTrends = this._enrichTrendsWithAnalytics(trendsData);
      
      // Seasonal analysis
      const seasonalPatterns = this._analyzeSeasonalPatterns(enrichedTrends);

      return {
        success: true,
        data: {
          trends: enrichedTrends,
          seasonal: seasonalPatterns,
          summary: {
            totalDataPoints: enrichedTrends.length,
            avgDailyRevenue: this._calculateAverage(enrichedTrends, 'revenue'),
            avgDailyOrders: this._calculateAverage(enrichedTrends, 'orders'),
            peakDay: this._findPeakPerformance(enrichedTrends, 'revenue'),
            growthRate: this._calculateOverallGrowthRate(enrichedTrends)
          },
          granularity,
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Sales Trends Error:", error);
      throw new Error(`Failed to analyze sales trends: ${error.message}`);
    }
  }

  /**
   * 🎯 Get top performing products with detailed metrics
   * @param {Object} options - Top products options
   * @returns {Object} Top performing products data
   */
  async getTopPerformingProducts(options = {}) {
    try {
      const { limit = 20, sortBy = 'revenue', startDate, endDate } = options;
      const dateRange = this._calculateDateRange(startDate, endDate);
      
      const productPerformance = await this.getProductPerformance({
        limit,
        sortBy,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      return {
        success: true,
        data: productPerformance.data.products.slice(0, limit)
      };

    } catch (error) {
      console.error("❌ Top Products Error:", error);
      throw new Error(`Failed to get top performing products: ${error.message}`);
    }
  }

  /**
   * 📦 Get sales performance analysis by product categories
   * @param {Object} options - Analysis options
   * @param {number} options.limit - Number of categories to return
   * @param {string} options.sortBy - revenue|quantity|orders|products
   * @param {Date} options.startDate - Analysis start date
   * @param {Date} options.endDate - Analysis end date
   * @param {boolean} options.includeSubcategories - Include subcategory breakdown
   * @returns {Object} Category sales performance data
   */
  async getCategorySales(options = {}) {
    try {
      const {
        limit = 20,
        sortBy = 'revenue',
        startDate,
        endDate,
        includeSubcategories = true
      } = options;

      const dateRange = this._calculateDateRange(startDate, endDate);
      
      console.log(`📦 Analyzing category sales performance: ${sortBy} (${limit} categories)`);

      // Build aggregation pipeline for category analysis
      const matchQuery = {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        },
        status: { $ne: "Cancel" }
      };

      // Category performance aggregation
      const pipeline = [
        { $match: matchQuery },
        { $unwind: "$cart" },
        {
          $addFields: {
            "cart.categoryObjectId": {
              $cond: {
                if: { $eq: [{ $type: "$cart.category" }, "string"] },
                then: { $toObjectId: "$cart.category" },
                else: "$cart.category"
              }
            }
          }
        },
        {
          $lookup: {
            from: "categories",
            localField: "cart.categoryObjectId",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $group: {
            _id: {
              categoryId: "$cart.category",
              categoryName: { 
                $ifNull: [
                  { $ifNull: [
                    { $arrayElemAt: ["$categoryInfo.name.en", 0] },
                    { $arrayElemAt: ["$categoryInfo.name.ar", 0] }
                  ]},
                  "Unknown Category"
                ]
              },
              completeName: { 
                $ifNull: [
                  { $ifNull: [
                    { $arrayElemAt: ["$categoryInfo.name.en", 0] },
                    { $arrayElemAt: ["$categoryInfo.name.ar", 0] }
                  ]},
                  "Unknown"
                ]
              }
            },
            totalRevenue: { 
              $sum: { $multiply: ["$cart.price", "$cart.quantity"] } 
            },
            totalQuantity: { $sum: "$cart.quantity" },
            totalOrders: { $addToSet: "$_id" },
            uniqueProducts: { $addToSet: "$cart.productId" },
            avgPrice: { $avg: "$cart.price" },
            minPrice: { $min: "$cart.price" },
            maxPrice: { $max: "$cart.price" }
          }
        },
        {
          $project: {
            categoryId: "$_id.categoryId",
            categoryName: "$_id.categoryName",
            completeName: "$_id.completeName",
            totalRevenue: 1,
            totalQuantity: 1,
            totalOrders: { $size: "$totalOrders" },
            uniqueProducts: { $size: "$uniqueProducts" },
            avgPrice: { $round: ["$avgPrice", 2] },
            minPrice: 1,
            maxPrice: 1,
            revenuePerOrder: { 
              $round: [{ $divide: ["$totalRevenue", { $size: "$totalOrders" }] }, 2] 
            },
            avgQuantityPerOrder: {
              $round: [{ $divide: ["$totalQuantity", { $size: "$totalOrders" }] }, 2]
            }
          }
        },
        { $sort: this._getCategorySortCriteria(sortBy) },
        { $limit: limit }
      ];

      const categoryData = await Order.aggregate(pipeline);

      // 🎸 Debug: Log the results
      console.log("🎸 Category Sales Debug - Pipeline result count:", categoryData.length);
      if (categoryData.length > 0) {
        console.log("🎸 First category sample:", {
          categoryId: categoryData[0].categoryId,
          categoryName: categoryData[0].categoryName,
          completeName: categoryData[0].completeName,
          totalRevenue: categoryData[0].totalRevenue
        });
      }

      // Calculate performance metrics
      const totalRevenue = categoryData.reduce((sum, category) => sum + category.totalRevenue, 0);
      const totalQuantity = categoryData.reduce((sum, category) => sum + category.totalQuantity, 0);
      const totalOrders = categoryData.reduce((sum, category) => sum + category.totalOrders, 0);
      const totalProducts = categoryData.reduce((sum, category) => sum + category.uniqueProducts, 0);

      // Get top performing category
      const topCategory = categoryData.length > 0 ? categoryData[0] : null;

      // Get category trends if requested
      let categoryTrends = [];
      if (includeSubcategories && categoryData.length > 0) {
        categoryTrends = await this._getCategoryTrends(categoryData.slice(0, 5), dateRange);
      }

      return {
        success: true,
        data: {
          categories: categoryData.map(category => ({
            ...category,
            revenuePercentage: ((category.totalRevenue / totalRevenue) * 100).toFixed(2),
            quantityPercentage: ((category.totalQuantity / totalQuantity) * 100).toFixed(2),
            orderPercentage: ((category.totalOrders / totalOrders) * 100).toFixed(2),
            productPercentage: ((category.uniqueProducts / totalProducts) * 100).toFixed(2)
          })),
          trends: categoryTrends,
          summary: {
            totalCategories: categoryData.length,
            totalRevenue,
            totalQuantity,
            totalOrders,
            totalProducts,
            avgRevenuePerCategory: totalRevenue / categoryData.length || 0,
            topPerformingCategory: topCategory ? {
              name: topCategory.categoryName,
              revenue: topCategory.totalRevenue,
              share: ((topCategory.totalRevenue / totalRevenue) * 100).toFixed(2)
            } : null
          },
          filters: { limit, sortBy, includeSubcategories },
          dateRange
        }
      };

    } catch (error) {
      console.error("❌ Category Sales Error:", error);
      throw new Error(`Failed to analyze category sales: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate date range with proper defaults
   */
  _calculateDateRange(startDate, endDate, period = 'daily') {
    const now = dayjs();
    
    if (startDate && endDate) {
      return {
        start: dayjs(startDate).startOf('day').toDate(),
        end: dayjs(endDate).endOf('day').toDate()
      };
    }

    // Default ranges based on period
    const periodDefaults = {
      daily: 30,
      weekly: 12 * 7,
      monthly: 365
    };

    const daysBack = periodDefaults[period] || 30;
    
    return {
      start: now.subtract(daysBack, 'day').startOf('day').toDate(),
      end: now.endOf('day').toDate()
    };
  }

  /**
   * Calculate previous period for comparison
   */
  _calculatePreviousPeriod(startDate, endDate) {
    const duration = dayjs(endDate).diff(dayjs(startDate), 'day');
    return {
      start: dayjs(startDate).subtract(duration + 1, 'day').toDate(),
      end: dayjs(startDate).subtract(1, 'day').toDate()
    };
  }

  /**
   * Get sales data by period with aggregation
   */
  async _getSalesByPeriod(startDate, endDate, period) {
    const dateFormat = period === 'monthly' ? '%Y-%m' : 
                      period === 'weekly' ? '%Y-W%U' : '%Y-%m-%d';

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "Cancel" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $count: {} },
          customers: { $addToSet: "$user" },
          avgOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const trendsData = await Order.aggregate(pipeline);
    
    // Calculate summary
    const summary = {
      totalRevenue: trendsData.reduce((sum, day) => sum + day.revenue, 0),
      totalOrders: trendsData.reduce((sum, day) => sum + day.orders, 0),
      uniqueCustomers: new Set(trendsData.flatMap(day => day.customers)).size,
      avgOrderValue: trendsData.reduce((sum, day) => sum + day.avgOrderValue, 0) / trendsData.length || 0
    };

    return {
      summary,
      trends: trendsData.map(item => ({
        period: item._id,
        revenue: item.revenue,
        orders: item.orders,
        customers: item.customers.length,
        avgOrderValue: Math.round(item.avgOrderValue * 100) / 100
      }))
    };
  }

  /**
   * Calculate growth metrics between current and previous periods
   */
  _calculateGrowthMetrics(current, previous) {
    if (!previous) return {};

    const calculateGrowth = (curr, prev) => 
      prev > 0 ? ((curr - prev) / prev * 100).toFixed(2) : 0;

    return {
      revenueGrowth: calculateGrowth(current.totalRevenue, previous.totalRevenue),
      orderGrowth: calculateGrowth(current.totalOrders, previous.totalOrders),
      customerGrowth: calculateGrowth(current.uniqueCustomers, previous.uniqueCustomers),
      aovGrowth: calculateGrowth(current.avgOrderValue, previous.avgOrderValue)
    };
  }

  /**
   * Get sort criteria for different metrics
   */
  _getSortCriteria(sortBy) {
    const sortOptions = {
      revenue: { totalRevenue: -1 },
      quantity: { totalQuantity: -1 },
      orders: { totalOrders: -1 },
      profit: { totalRevenue: -1 }, // Simplified - would need cost data for actual profit
      growth: { totalRevenue: -1 }
    };
    
    return sortOptions[sortBy] || sortOptions.revenue;
  }

  /**
   * Get sort criteria for category sales
   */
  _getCategorySortCriteria(sortBy) {
    const sortOptions = {
      revenue: { totalRevenue: -1 },
      quantity: { totalQuantity: -1 },
      orders: { totalOrders: -1 },
      products: { uniqueProducts: -1 },
      growth: { totalRevenue: -1 }
    };
    
    return sortOptions[sortBy] || sortOptions.revenue;
  }

  /**
   * Calculate average of array property
   */
  _calculateAverage(array, property) {
    if (!array.length) return 0;
    return array.reduce((sum, item) => sum + (item[property] || 0), 0) / array.length;
  }

  /**
   * Categorize customers based on RFM analysis
   */
  _categorizeCustomers(rfmData) {
    // Simplified segmentation - in production would use proper RFM scoring
    const segments = {
      champions: [],
      loyalCustomers: [],
      potentialLoyalists: [],
      newCustomers: [],
      atRisk: [],
      cantLoseThem: [],
      hibernating: []
    };

    rfmData.forEach(customer => {
      if (customer.frequency >= 5 && customer.monetary >= 500 && customer.daysSinceLastOrder <= 30) {
        segments.champions.push(customer);
      } else if (customer.frequency >= 3 && customer.monetary >= 200) {
        segments.loyalCustomers.push(customer);
      } else if (customer.frequency <= 2 && customer.daysSinceLastOrder <= 30) {
        segments.newCustomers.push(customer);
      } else if (customer.daysSinceLastOrder > 90) {
        segments.hibernating.push(customer);
      } else {
        segments.potentialLoyalists.push(customer);
      }
    });

    // Return segment summary
    return Object.entries(segments).map(([name, customers]) => ({
      segment: name,
      count: customers.length,
      totalRevenue: customers.reduce((sum, c) => sum + c.monetary, 0),
      avgOrderValue: customers.length > 0 ? 
        customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / customers.length : 0
    }));
  }

  /**
   * Get geographic distribution of customers
   */
  async _getGeographicDistribution(dateRange) {
    return await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: "Cancel" }
        }
      },
      {
        $group: {
          _id: "$user_info.city",
          customers: { $addToSet: "$user" },
          revenue: { $sum: "$total" },
          orders: { $count: {} }
        }
      },
      {
        $project: {
          city: "$_id",
          customerCount: { $size: "$customers" },
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
  }

  /**
   * Get new vs returning customer analysis
   */
  async _getCustomerTypes(dateRange) {
    const customerFirstOrders = await Order.aggregate([
      { $match: { status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: "$user",
          firstOrder: { $min: "$createdAt" }
        }
      }
    ]);

    const customerMap = new Map(
      customerFirstOrders.map(c => [c._id.toString(), c.firstOrder])
    );

    const periodOrders = await Order.find({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $ne: "Cancel" }
    });

    let newCustomers = 0;
    let returningCustomers = 0;

    periodOrders.forEach(order => {
      const customerId = order.user.toString();
      const firstOrderDate = customerMap.get(customerId);
      
      if (firstOrderDate && firstOrderDate >= dateRange.start) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    });

    return {
      new: newCustomers,
      returning: returningCustomers,
      total: newCustomers + returningCustomers
    };
  }

  /**
   * Get time series data for trends analysis
   */
  async _getTimeSeriesData(dateRange, granularity) {
    const format = granularity === 'monthly' ? '%Y-%m' : 
                   granularity === 'weekly' ? '%Y-W%U' : '%Y-%m-%d';

    return await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: "Cancel" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $count: {} },
          avgOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  /**
   * Enrich trends data with analytics
   */
  _enrichTrendsWithAnalytics(trendsData) {
    return trendsData.map((trend, index) => {
      const enriched = {
        date: trend._id,
        revenue: trend.revenue,
        orders: trend.orders,
        avgOrderValue: Math.round(trend.avgOrderValue * 100) / 100
      };

      // Calculate day-over-day growth
      if (index > 0) {
        const prevRevenue = trendsData[index - 1].revenue;
        enriched.revenueGrowth = prevRevenue > 0 ? 
          ((trend.revenue - prevRevenue) / prevRevenue * 100).toFixed(2) : 0;
      }

      // Calculate 7-day moving average
      if (index >= 6) {
        const window = trendsData.slice(Math.max(0, index - 6), index + 1);
        enriched.movingAvg7Day = Math.round(
          window.reduce((sum, item) => sum + item.revenue, 0) / window.length
        );
      }

      return enriched;
    });
  }

  /**
   * Analyze seasonal patterns in sales data
   */
  _analyzeSeasonalPatterns(trendsData) {
    // Group by day of week
    const dayOfWeekPattern = {};
    
    trendsData.forEach(trend => {
      const dayOfWeek = dayjs(trend.date).format('dddd');
      if (!dayOfWeekPattern[dayOfWeek]) {
        dayOfWeekPattern[dayOfWeek] = { revenue: 0, orders: 0, count: 0 };
      }
      
      dayOfWeekPattern[dayOfWeek].revenue += trend.revenue;
      dayOfWeekPattern[dayOfWeek].orders += trend.orders;
      dayOfWeekPattern[dayOfWeek].count++;
    });

    // Calculate averages
    Object.keys(dayOfWeekPattern).forEach(day => {
      const data = dayOfWeekPattern[day];
      data.avgRevenue = Math.round(data.revenue / data.count);
      data.avgOrders = Math.round(data.orders / data.count);
    });

    return {
      dayOfWeek: dayOfWeekPattern,
      bestDay: Object.entries(dayOfWeekPattern)
        .sort(([,a], [,b]) => b.avgRevenue - a.avgRevenue)[0]?.[0],
      worstDay: Object.entries(dayOfWeekPattern)
        .sort(([,a], [,b]) => a.avgRevenue - b.avgRevenue)[0]?.[0]
    };
  }

  /**
   * Find peak performance day in trends
   */
  _findPeakPerformance(trendsData, metric) {
    return trendsData.reduce((peak, current) => 
      current[metric] > peak[metric] ? current : peak
    );
  }

  /**
   * Calculate overall growth rate across trends
   */
  _calculateOverallGrowthRate(trendsData) {
    if (trendsData.length < 2) return 0;
    
    const firstRevenue = trendsData[0].revenue;
    const lastRevenue = trendsData[trendsData.length - 1].revenue;
    
    return firstRevenue > 0 ? 
      ((lastRevenue - firstRevenue) / firstRevenue * 100).toFixed(2) : 0;
  }

  /**
   * Get category trends for a specific category
   */
  async _getCategoryTrends(categoryData, dateRange) {
    const format = '%Y-%m-%d';
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $ne: "Cancel" }
        }
      },
      {
        $unwind: "$cart"
      },
      {
        $match: {
          "cart.category": categoryData[0]._id.categoryId
        }
      },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          revenue: { $sum: "$cart.price" },
          orders: { $count: {} },
          avgOrderValue: { $avg: "$cart.price" }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const trends = await Order.aggregate(pipeline);

    return trends.map(trend => ({
      date: trend._id,
      revenue: trend.revenue,
      orders: trend.orders,
      avgOrderValue: Math.round(trend.avgOrderValue * 100) / 100
    }));
  }
}

module.exports = SalesAnalyticsService; 