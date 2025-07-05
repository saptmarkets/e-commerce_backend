const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

// Import required models
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Admin = require("../models/Admin");
const DeliveryAssignment = require("../models/DeliveryAssignment");

// 📊 Sales Analytics - Task 1.2.1 Implementation
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, timeRange = "7d" } = req.query;
    
    // Calculate date range
    const now = dayjs();
    let dateQuery = {};
    
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      };
    } else {
      const daysBack = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 7;
      dateQuery = {
        createdAt: {
          $gte: now.subtract(daysBack, 'day').startOf('day').toDate(),
          $lte: now.endOf('day').toDate()
        }
      };
    }

    // Aggregate sales data
    const salesData = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$total" },
          totalOrders: { $count: {} },
          averageOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get top performing products
    const topProducts = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: "Cancel" } } },
      { $unwind: "$cart" },
      {
        $group: {
          _id: "$cart.title",
          quantity: { $sum: "$cart.quantity" },
          revenue: { $sum: { $multiply: ["$cart.price", "$cart.quantity"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Calculate summary metrics
    const totalRevenue = salesData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.totalOrders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          timeRange
        },
        dailySales: salesData,
        topProducts,
        dateRange: { startDate, endDate, timeRange }
      }
    });

  } catch (error) {
    console.error("Sales Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales analytics",
      error: error.message
    });
  }
};

// 📦 Inventory Reports - Task 1.2.1 Implementation  
const getInventoryReports = async (req, res) => {
  try {
    const { category, lowStockThreshold = 10 } = req.query;
    
    let matchQuery = {};
    if (category) {
      matchQuery["category.name"] = category;
    }

    // Get inventory data with stock levels
    const inventoryData = await Product.aggregate([
      { $match: matchQuery },
      {
        $project: {
          title: 1,
          category: 1,
          sku: 1,
          stock: 1,
          prices: 1,
          image: 1,
          status: 1,
          createdAt: 1,
          totalValue: { $multiply: ["$stock", "$prices.originalPrice"] }
        }
      },
      { $sort: { stock: 1 } }
    ]);

    // Calculate low stock items
    const lowStockItems = inventoryData.filter(item => item.stock <= lowStockThreshold);
    
    // Calculate inventory value by category
    const categoryValue = await Product.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category.name",
          totalItems: { $count: {} },
          totalStock: { $sum: "$stock" },
          totalValue: { $sum: { $multiply: ["$stock", "$prices.originalPrice"] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts: inventoryData.length,
          lowStockItems: lowStockItems.length,
          totalInventoryValue: inventoryData.reduce((sum, item) => sum + item.totalValue, 0)
        },
        inventoryItems: inventoryData,
        lowStockItems,
        categoryBreakdown: categoryValue
      }
    });

  } catch (error) {
    console.error("Inventory Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory reports",
      error: error.message
    });
  }
};

// 👥 Customer Insights - Task 1.2.1 Implementation
const getCustomerInsights = async (req, res) => {
  try {
    const { startDate, endDate, timeRange = "30d" } = req.query;
    
    // Calculate date range
    const now = dayjs();
    let dateQuery = {};
    
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      };
    } else {
      const daysBack = timeRange === "90d" ? 90 : timeRange === "7d" ? 7 : 30;
      dateQuery = {
        createdAt: {
          $gte: now.subtract(daysBack, 'day').startOf('day').toDate(),
          $lte: now.endOf('day').toDate()
        }
      };
    }

    // Get customer lifetime value
    const customerLifetimeValue = await Order.aggregate([
      { $match: { status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$total" },
          orderCount: { $count: {} },
          averageOrderValue: { $avg: "$total" },
          lastOrderDate: { $max: "$createdAt" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 100 }
    ]);

    // Get customer acquisition data
    const customerAcquisition = await Customer.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newCustomers: { $count: {} }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get repeat customer rate
    const repeatCustomers = await Order.aggregate([
      { $match: { status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $count: {} }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $count: {} },
          repeatCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } }
        }
      }
    ]);

    const repeatRate = repeatCustomers.length > 0 ? 
      (repeatCustomers[0].repeatCustomers / repeatCustomers[0].totalCustomers) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers: customerLifetimeValue.length,
          repeatCustomerRate: repeatRate,
          averageLifetimeValue: customerLifetimeValue.reduce((sum, customer) => sum + customer.totalSpent, 0) / customerLifetimeValue.length
        },
        customerLifetimeValue,
        customerAcquisition,
        timeRange
      }
    });

  } catch (error) {
    console.error("Customer Insights Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer insights",
      error: error.message
    });
  }
};

// 🚚 Delivery Performance - Task 5.1.1 Enhanced Implementation
const DeliveryAnalyticsService = require('../services/DeliveryAnalyticsService');

const getDeliveryPerformance = async (req, res) => {
  try {
    console.log("🚚 Delivery Performance API called with filters:", req.query);
    
    const filters = {
      period: parseInt(req.query.period) || 30,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      driverId: req.query.driverId,
      zone: req.query.zone
    };

    console.log("🎯 Processing delivery analytics with filters:", filters);

    // Use the comprehensive delivery analytics service
    const deliveryData = await DeliveryAnalyticsService.getDeliveryOverview(filters);
    
    if (deliveryData.success) {
      console.log("✅ Delivery analytics data retrieved successfully");
      res.status(200).json(deliveryData);
    } else {
      console.error("❌ Failed to retrieve delivery analytics");
      res.status(500).json({
        success: false,
        message: "Failed to retrieve delivery analytics",
        data: {}
      });
    }

  } catch (error) {
    console.error("🚚 Delivery Performance Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery performance",
      error: error.message,
      data: {}
    });
  }
};

// 💰 Financial Reports - Task 1.2.1 Implementation
const getFinancialReports = async (req, res) => {
  try {
    const { startDate, endDate, timeRange = "30d" } = req.query;
    
    // Calculate date range
    const now = dayjs();
    let dateQuery = {};
    
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      };
    } else {
      const daysBack = timeRange === "90d" ? 90 : timeRange === "7d" ? 7 : 30;
      dateQuery = {
        createdAt: {
          $gte: now.subtract(daysBack, 'day').startOf('day').toDate(),
          $lte: now.endOf('day').toDate()
        }
      };
    }

    // Get financial data
    const financialData = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          shippingRevenue: { $sum: "$shippingCost" },
          discounts: { $sum: "$discount" },
          loyaltyDiscounts: { $sum: "$loyaltyDiscount" },
          orderCount: { $count: {} }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get payment method breakdown
    const paymentMethods = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $count: {} },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: financialData.reduce((sum, day) => sum + day.revenue, 0),
          totalShippingRevenue: financialData.reduce((sum, day) => sum + day.shippingRevenue, 0),
          totalDiscounts: financialData.reduce((sum, day) => sum + day.discounts, 0),
          totalOrders: financialData.reduce((sum, day) => sum + day.orderCount, 0)
        },
        dailyFinancials: financialData,
        paymentMethods,
        timeRange
      }
    });

  } catch (error) {
    console.error("Financial Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial reports",
      error: error.message
    });
  }
};

// 📈 Executive Dashboard - Task 1.2.1 Implementation
const getExecutiveDashboard = async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;
    
    // Calculate date range
    const now = dayjs();
    const daysBack = timeRange === "90d" ? 90 : timeRange === "7d" ? 7 : 30;
    const dateQuery = {
      createdAt: {
        $gte: now.subtract(daysBack, 'day').startOf('day').toDate(),
        $lte: now.endOf('day').toDate()
      }
    };

    // Get KPIs
    const kpis = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $count: {} },
          averageOrderValue: { $avg: "$total" },
          totalCustomers: { $addToSet: "$user" }
        }
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: 1,
          totalCustomers: { $size: "$totalCustomers" }
        }
      }
    ]);

    // Get growth metrics (compare with previous period)
    const prevPeriodQuery = {
      createdAt: {
        $gte: now.subtract(daysBack * 2, 'day').startOf('day').toDate(),
        $lt: now.subtract(daysBack, 'day').endOf('day').toDate()
      }
    };

    const prevKpis = await Order.aggregate([
      { $match: { ...prevPeriodQuery, status: { $ne: "Cancel" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $count: {} }
        }
      }
    ]);

    const currentKpis = kpis[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalCustomers: 0 };
    const previousKpis = prevKpis[0] || { totalRevenue: 0, totalOrders: 0 };

    const revenueGrowth = previousKpis.totalRevenue > 0 ? 
      ((currentKpis.totalRevenue - previousKpis.totalRevenue) / previousKpis.totalRevenue) * 100 : 0;
    const orderGrowth = previousKpis.totalOrders > 0 ? 
      ((currentKpis.totalOrders - previousKpis.totalOrders) / previousKpis.totalOrders) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          ...currentKpis,
          revenueGrowth,
          orderGrowth
        },
        timeRange
      }
    });

  } catch (error) {
    console.error("Executive Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch executive dashboard",
      error: error.message
    });
  }
};

// 📄 Export Report - Task 1.2.1 Implementation
const exportReport = async (req, res) => {
  try {
    const { reportType, format = "json" } = req.query;
    
    // Implementation placeholder for PDF/Excel export
    // This will be expanded in Phase 2
    res.status(200).json({
      success: true,
      message: `Export functionality for ${reportType} in ${format} format coming soon!`,
      data: { reportType, format }
    });

  } catch (error) {
    console.error("Export Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message
    });
  }
};

module.exports = {
  getSalesAnalytics,
  getInventoryReports,
  getCustomerInsights,
  getDeliveryPerformance,
  getFinancialReports,
  getExecutiveDashboard,
  exportReport
}; 