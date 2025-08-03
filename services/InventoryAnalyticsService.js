// 📦 Inventory Analytics Service - Task 3.1.1 Implementation
// 🎸 Comprehensive inventory analytics with stock levels, movement tracking, and valuation

const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

class InventoryAnalyticsService {
  
  // 🎸 Stock Level Analysis with Low Stock Alerts
  async getStockOverview(options = {}) {
    try {
      const { 
        includeOutOfStock = true, 
        lowStockThreshold = 10, 
        category = null,
        page = 1,
        limit = 100
      } = options;

      let matchQuery = {};
      
      // Filter by category if provided
      if (category) {
        // Convert category string to ObjectId if needed
        const categoryId = typeof category === 'string' ? category : category.toString();
        matchQuery.category = categoryId;
      }

      // Stock level aggregation pipeline
      const pipeline = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $project: {
            title: {
              $cond: {
                if: "$title.en",
                then: "$title.en",
                else: {
                  $cond: {
                    if: "$title.ar",
                    then: "$title.ar",
                    else: "$title"
                  }
                }
              }
            },
            sku: 1,
            barcode: 1,
            stock: 1,
            prices: 1,
            image: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            categoryName: { 
              $cond: {
                if: { $gt: [{ $size: "$categoryInfo" }, 0] },
                then: { $arrayElemAt: ["$categoryInfo.name", 0] },
                else: "Uncategorized"
              }
            },
            categoryId: "$category",
            stockValue: { $multiply: ["$stock", "$prices.originalPrice"] },
            stockStatus: {
              $cond: {
                if: { $eq: ["$stock", 0] },
                then: "out_of_stock",
                else: {
                  $cond: {
                    if: { $lte: ["$stock", lowStockThreshold] },
                    then: "low_stock",
                    else: "in_stock"
                  }
                }
              }
            }
          }
        },
        { $sort: { stock: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ];

      const stockData = await Product.aggregate(pipeline);

      // Calculate summary statistics
      const summaryPipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockValue: { $sum: { $multiply: ["$stock", "$prices.originalPrice"] } },
            totalStockQuantity: { $sum: "$stock" },
            outOfStockCount: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
            lowStockCount: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", lowStockThreshold] }] }, 1, 0] } },
            inStockCount: { $sum: { $cond: [{ $gt: ["$stock", lowStockThreshold] }, 1, 0] } }
          }
        }
      ];

      const summary = await Product.aggregate(summaryPipeline);

      // Get category breakdown
      const categoryBreakdown = await Product.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $group: {
            _id: "$category",
            categoryName: { $first: { $arrayElemAt: ["$categoryInfo.name", 0] } },
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$stock", "$prices.originalPrice"] } },
            avgStock: { $avg: "$stock" },
            outOfStockCount: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
            lowStockCount: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", lowStockThreshold] }] }, 1, 0] } }
          }
        },
        { $sort: { totalValue: -1 } }
      ]);

      return {
        success: true,
        data: {
          overview: summary[0] || {
            totalProducts: 0,
            totalStockValue: 0,
            totalStockQuantity: 0,
            outOfStockCount: 0,
            lowStockCount: 0,
            inStockCount: 0
          },
          stockItems: stockData,
          categoryBreakdown,
          filters: {
            includeOutOfStock,
            lowStockThreshold,
            category,
            page,
            limit
          }
        }
      };

    } catch (error) {
      console.error("🎸 Stock Overview Error:", error);
      return {
        success: false,
        message: "Failed to fetch stock overview",
        error: error.message
      };
    }
  }

  // 🎸 Stock Movement Tracking
  async getStockMovement(options = {}) {
    try {
      const { 
        period = 30, 
        productId = null, 
        movementType = null,
        page = 1,
        limit = 100
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // For now, we'll simulate stock movement from order data
      // In a real system, you'd have a separate StockMovement collection
      let matchQuery = {
        createdAt: { $gte: startDate },
        status: { $ne: "Cancel" }
      };

      const movements = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: "$cart" },
        {
          $addFields: {
            productObjectId: { $toObjectId: "$cart.id" }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productObjectId",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        {
          $project: {
            orderId: "$_id",
            productId: "$cart.id",
            productTitle: {
              $cond: {
                if: { $arrayElemAt: ["$productInfo.title.en", 0] },
                then: { $arrayElemAt: ["$productInfo.title.en", 0] },
                else: {
                  $cond: {
                    if: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    then: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    else: { $arrayElemAt: ["$productInfo.title", 0] }
                  }
                }
              }
            },
            sku: { $arrayElemAt: ["$productInfo.sku", 0] },
            quantity: "$cart.quantity",
            unitPrice: "$cart.price",
            totalValue: { $multiply: ["$cart.quantity", "$cart.price"] },
            movementType: "out", // Orders reduce stock
            reason: "Sale",
            date: "$createdAt",
            orderStatus: "$status"
          }
        },
        { $sort: { date: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]);

      // Calculate movement summary
      const movementSummary = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: "$cart" },
        {
          $group: {
            _id: null,
            totalMovements: { $sum: 1 },
            totalQuantityOut: { $sum: "$cart.quantity" },
            totalValueOut: { $sum: { $multiply: ["$cart.quantity", "$cart.price"] } },
            avgMovementValue: { $avg: { $multiply: ["$cart.quantity", "$cart.price"] } }
          }
        }
      ]);

      return {
        success: true,
        data: {
          movements,
          summary: movementSummary[0] || {
            totalMovements: 0,
            totalQuantityOut: 0,
            totalValueOut: 0,
            avgMovementValue: 0
          },
          filters: {
            period,
            productId,
            movementType,
            page,
            limit
          }
        }
      };

    } catch (error) {
      console.error("🎸 Stock Movement Error:", error);
      return {
        success: false,
        message: "Failed to fetch stock movement",
        error: error.message
      };
    }
  }

  // 🎸 Product Velocity Analysis (Fast/Slow Moving)
  async getProductVelocity(options = {}) {
    try {
      const { 
        period = 90, 
        classification = null,
        limit = 50
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Calculate product velocity based on sales
      const velocityData = await Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate }, 
            status: { $ne: "Cancel" } 
          } 
        },
        { $unwind: "$cart" },
        {
          $group: {
            _id: "$cart.id",
            productTitle: { $first: "$cart.title" },
            totalSold: { $sum: "$cart.quantity" },
            totalRevenue: { $sum: { $multiply: ["$cart.quantity", "$cart.price"] } },
            averagePrice: { $avg: "$cart.price" },
            orderCount: { $sum: 1 },
            salesFrequency: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        {
          $project: {
            productId: "$_id",
            productTitle: {
              $cond: {
                if: { $arrayElemAt: ["$productInfo.title.en", 0] },
                then: { $arrayElemAt: ["$productInfo.title.en", 0] },
                else: {
                  $cond: {
                    if: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    then: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    else: "$productTitle"
                  }
                }
              }
            },
            currentStock: { $arrayElemAt: ["$productInfo.stock", 0] },
            sku: { $arrayElemAt: ["$productInfo.sku", 0] },
            category: { $arrayElemAt: ["$productInfo.category", 0] },
            totalSold: 1,
            totalRevenue: 1,
            averagePrice: 1,
            orderCount: 1,
            salesFrequency: 1,
            velocityScore: {
              $divide: ["$totalSold", period] // Units sold per day
            },
            turnoverRate: {
              $cond: {
                if: { $gt: [{ $arrayElemAt: ["$productInfo.stock", 0] }, 0] },
                then: {
                  $divide: ["$totalSold", { $arrayElemAt: ["$productInfo.stock", 0] }]
                },
                else: 0
              }
            }
          }
        },
        {
          $addFields: {
            velocityClassification: {
              $cond: {
                if: { $gte: ["$velocityScore", 1] },
                then: "fast",
                else: {
                  $cond: {
                    if: { $gte: ["$velocityScore", 0.1] },
                    then: "medium",
                    else: "slow"
                  }
                }
              }
            }
          }
        },
        { $sort: { velocityScore: -1 } },
        { $limit: limit }
      ]);

      // Filter by classification if provided
      const filteredData = classification 
        ? velocityData.filter(item => item.velocityClassification === classification)
        : velocityData;

      // Calculate velocity summary
      const velocitySummary = {
        totalProducts: velocityData.length,
        fastMoving: velocityData.filter(item => item.velocityClassification === "fast").length,
        mediumMoving: velocityData.filter(item => item.velocityClassification === "medium").length,
        slowMoving: velocityData.filter(item => item.velocityClassification === "slow").length,
        averageVelocity: velocityData.reduce((sum, item) => sum + item.velocityScore, 0) / velocityData.length,
        totalRevenue: velocityData.reduce((sum, item) => sum + item.totalRevenue, 0)
      };

      return {
        success: true,
        data: {
          velocityAnalysis: filteredData,
          summary: velocitySummary,
          filters: {
            period,
            classification,
            limit
          }
        }
      };

    } catch (error) {
      console.error("🎸 Product Velocity Error:", error);
      return {
        success: false,
        message: "Failed to fetch product velocity analysis",
        error: error.message
      };
    }
  }

  // 🎸 Inventory Valuation
  async getInventoryValuation(options = {}) {
    try {
      const { 
        method = "fifo", // fifo, lifo, average
        asOfDate = null,
        groupBy = "category" // category, supplier, all
      } = options;

      const queryDate = asOfDate ? new Date(asOfDate) : new Date();

      // Basic inventory valuation
      const valuationData = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $project: {
            title: {
              $cond: {
                if: "$title.en",
                then: "$title.en",
                else: {
                  $cond: {
                    if: "$title.ar",
                    then: "$title.ar",
                    else: "$title"
                  }
                }
              }
            },
            sku: 1,
            category: 1,
            categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
            stock: 1,
            prices: 1,
            costPrice: { $ifNull: ["$prices.costPrice", "$prices.originalPrice"] },
            sellingPrice: "$prices.originalPrice",
            stockValue: { $multiply: ["$stock", { $ifNull: ["$prices.costPrice", "$prices.originalPrice"] }] },
            potentialRevenue: { $multiply: ["$stock", "$prices.originalPrice"] },
            potentialProfit: { 
              $multiply: [
                "$stock", 
                { $subtract: ["$prices.originalPrice", { $ifNull: ["$prices.costPrice", "$prices.originalPrice"] }] }
              ] 
            }
          }
        },
        { $sort: { stockValue: -1 } }
      ]);

      // Group by category if requested
      let groupedData = [];
      if (groupBy === "category") {
        groupedData = await Product.aggregate([
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo"
            }
          },
          {
            $group: {
              _id: "$category",
              categoryName: { $first: { $arrayElemAt: ["$categoryInfo.name", 0] } },
              totalProducts: { $sum: 1 },
              totalStock: { $sum: "$stock" },
              totalStockValue: { $sum: { $multiply: ["$stock", { $ifNull: ["$prices.costPrice", "$prices.originalPrice"] }] } },
              potentialRevenue: { $sum: { $multiply: ["$stock", "$prices.originalPrice"] } },
              potentialProfit: { 
                $sum: { 
                  $multiply: [
                    "$stock", 
                    { $subtract: ["$prices.originalPrice", { $ifNull: ["$prices.costPrice", "$prices.originalPrice"] }] }
                  ] 
                } 
              }
            }
          },
          { $sort: { totalStockValue: -1 } }
        ]);
      }

      // Calculate total valuation
      const totalValuation = {
        totalProducts: valuationData.length,
        totalStockValue: valuationData.reduce((sum, item) => sum + item.stockValue, 0),
        potentialRevenue: valuationData.reduce((sum, item) => sum + item.potentialRevenue, 0),
        potentialProfit: valuationData.reduce((sum, item) => sum + item.potentialProfit, 0),
        averageStockValue: valuationData.reduce((sum, item) => sum + item.stockValue, 0) / valuationData.length
      };

      return {
        success: true,
        data: {
          valuation: valuationData,
          groupedData,
          totalValuation,
          filters: {
            method,
            asOfDate: queryDate,
            groupBy
          }
        }
      };

    } catch (error) {
      console.error("🎸 Inventory Valuation Error:", error);
      return {
        success: false,
        message: "Failed to fetch inventory valuation",
        error: error.message
      };
    }
  }

  // 🎸 ABC Analysis (Product Classification by Value)
  async getABCAnalysis(options = {}) {
    try {
      const { period = 90 } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Calculate ABC analysis based on revenue contribution
      const abcData = await Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate }, 
            status: { $ne: "Cancel" } 
          } 
        },
        { $unwind: "$cart" },
        {
          $group: {
            _id: "$cart.id",
            productTitle: { $first: "$cart.title" },
            totalRevenue: { $sum: { $multiply: ["$cart.quantity", "$cart.price"] } },
            totalQuantity: { $sum: "$cart.quantity" }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        {
          $project: {
            productId: "$_id",
            productTitle: {
              $cond: {
                if: { $arrayElemAt: ["$productInfo.title.en", 0] },
                then: { $arrayElemAt: ["$productInfo.title.en", 0] },
                else: {
                  $cond: {
                    if: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    then: { $arrayElemAt: ["$productInfo.title.ar", 0] },
                    else: "$productTitle"
                  }
                }
              }
            },
            totalRevenue: 1,
            totalQuantity: 1,
            currentStock: { $arrayElemAt: ["$productInfo.stock", 0] },
            sku: { $arrayElemAt: ["$productInfo.sku", 0] }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      // Calculate total revenue for percentage calculation
      const totalRevenue = abcData.reduce((sum, item) => sum + item.totalRevenue, 0);
      
      // Classify products into A, B, C categories
      let cumulativeRevenue = 0;
      const classifiedData = abcData.map((item, index) => {
        cumulativeRevenue += item.totalRevenue;
        const revenuePercentage = (item.totalRevenue / totalRevenue) * 100;
        const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
        
        let classification;
        if (cumulativePercentage <= 80) {
          classification = "A"; // Top 80% revenue
        } else if (cumulativePercentage <= 95) {
          classification = "B"; // Next 15% revenue
        } else {
          classification = "C"; // Bottom 5% revenue
        }

        return {
          ...item,
          revenuePercentage,
          cumulativePercentage,
          classification,
          rank: index + 1
        };
      });

      // Calculate ABC summary
      const abcSummary = {
        totalProducts: classifiedData.length,
        classA: classifiedData.filter(item => item.classification === "A").length,
        classB: classifiedData.filter(item => item.classification === "B").length,
        classC: classifiedData.filter(item => item.classification === "C").length,
        totalRevenue
      };

      return {
        success: true,
        data: {
          abcAnalysis: classifiedData,
          summary: abcSummary,
          filters: {
            period
          }
        }
      };

    } catch (error) {
      console.error("🎸 ABC Analysis Error:", error);
      return {
        success: false,
        message: "Failed to fetch ABC analysis",
        error: error.message
      };
    }
  }

  // 🎸 Comprehensive Inventory Dashboard
  async getInventoryDashboard(options = {}) {
    try {
      const { lowStockThreshold = 10, period = 30 } = options;

      // Get all key metrics in parallel
      const [
        stockOverview,
        stockMovement,
        velocityAnalysis,
        inventoryValuation,
        abcAnalysis
      ] = await Promise.all([
        this.getStockOverview({ lowStockThreshold, limit: 10 }),
        this.getStockMovement({ period, limit: 10 }),
        this.getProductVelocity({ period, limit: 10 }),
        this.getInventoryValuation({ groupBy: "category" }),
        this.getABCAnalysis({ period })
      ]);

      return {
        success: true,
        data: {
          stockOverview: stockOverview.data,
          stockMovement: stockMovement.data,
          velocityAnalysis: velocityAnalysis.data,
          inventoryValuation: inventoryValuation.data,
          abcAnalysis: abcAnalysis.data,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error("🎸 Inventory Dashboard Error:", error);
      return {
        success: false,
        message: "Failed to fetch inventory dashboard",
        error: error.message
      };
    }
  }
}

module.exports = InventoryAnalyticsService; 