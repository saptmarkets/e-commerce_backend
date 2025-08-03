const mongoose = require('mongoose');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const dayjs = require('dayjs');

// 🚚 Delivery Analytics Service - Task 5.1.1 Implementation
// Comprehensive delivery performance analysis and reporting

class DeliveryAnalyticsService {
  
  // 🚚 MAIN DELIVERY OVERVIEW AGGREGATION
  async getDeliveryOverview(baseMatch) {
    try {
      const [
        deliveryMetrics,
        driverPerformance,
        zonePerformance,
        timeAnalysis,
        customerSatisfaction,
        routeEfficiency
      ] = await Promise.all([
        this.getDeliveryMetrics(baseMatch),
        this.getDriverPerformanceStats(baseMatch),
        this.getZonePerformanceData(baseMatch),
        this.getDeliveryTimeAnalysis(baseMatch),
        this.getCustomerSatisfactionData(baseMatch),
        this.getRouteEfficiencyData(baseMatch)
      ]);

      // Calculate additional overview metrics
      const totalRevenue = await Order.aggregate([
        { $match: { ...baseMatch, status: "Delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);

      const avgDeliveryTime = await Order.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            status: "Delivered",
            'deliveryInfo.assignedAt': { $exists: true },
            'deliveryInfo.deliveredAt': { $exists: true }
          } 
        },
        {
          $group: {
            _id: null,
            avgTime: {
              $avg: {
                $divide: [
                  { $subtract: ["$deliveryInfo.deliveredAt", "$deliveryInfo.assignedAt"] },
                  1000 * 60 // Convert to minutes
                ]
              }
            }
          }
        }
      ]);

      return {
        overview: {
          totalDeliveries: deliveryMetrics.totalDeliveries || 0,
          successfulDeliveries: deliveryMetrics.successfulDeliveries || 0,
          successRate: deliveryMetrics.successRate || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
          averageDeliveryTime: Math.round(avgDeliveryTime[0]?.avgTime || 0),
          activeDrivers: driverPerformance.activeDrivers || 0
        },
        drivers: {
          activeDrivers: driverPerformance.activeDrivers || 0,
          driverPerformance: driverPerformance.driverPerformance || [],
          topPerformer: driverPerformance.topPerformer || null
        },
        zones: {
          zonePerformance: zonePerformance.zonePerformance || [],
          topZone: zonePerformance.topZone || 'N/A',
          totalZones: zonePerformance.totalZones || 0
        },
        timeAnalysis: timeAnalysis || { deliveryTrends: [], peakHours: [] },
        customerSatisfaction: customerSatisfaction || { satisfactionData: [], averageRating: 0 },
        routeEfficiency: routeEfficiency || { routeData: [], averageDistance: 0 }
      };
    } catch (error) {
      console.error("🚚 Delivery Overview Error:", error);
      return this.getEmptyOverview();
    }
  }
  
  // 📊 DELIVERY OVERVIEW DASHBOARD
  async getDeliveryOverview(filters = {}) {
    try {
      console.log("🚚 Fetching delivery overview with filters:", filters);
      
      const { period = 30, startDate, endDate, driverId, zone } = filters;
      
      // Calculate date range
      const dateQuery = this.buildDateQuery(period, startDate, endDate);
      console.log("📅 Date query:", dateQuery);
      
      // Base match query
      const baseMatch = {
        ...dateQuery,
        status: { $in: ["Delivered", "Out for Delivery", "Processing", "Cancel"] },
        'deliveryInfo': { $exists: true }
      };
      
      if (driverId) baseMatch['deliveryInfo.assignedDriver'] = mongoose.Types.ObjectId(driverId);
      if (zone) baseMatch['user.address'] = { $regex: zone, $options: 'i' };
      
      // Parallel aggregation queries for performance
      const [
        deliveryMetrics,
        timeAnalysis,
        driverStats,
        zonePerformance
      ] = await Promise.all([
        this.getDeliveryMetrics(baseMatch),
        this.getDeliveryTimeAnalysis(baseMatch),
        this.getDriverPerformanceStats(baseMatch),
        this.getZonePerformanceData(baseMatch)
      ]);
      
      console.log("✅ Delivery overview aggregation complete");
      
      return {
        success: true,
        data: {
          overview: {
            totalDeliveries: deliveryMetrics.totalDeliveries || 0,
            successfulDeliveries: deliveryMetrics.successfulDeliveries || 0,
            pendingDeliveries: deliveryMetrics.pendingDeliveries || 0,
            failedDeliveries: deliveryMetrics.failedDeliveries || 0,
            successRate: deliveryMetrics.successRate || 0,
            averageDeliveryTime: timeAnalysis.averageDeliveryTime || 0,
            activeDrivers: driverStats.activeDrivers || 0,
            topPerformingZone: zonePerformance.topZone || 'N/A'
          },
          timeAnalysis,
          drivers: driverStats, // FIXED: Changed from driverStats to drivers
          zonePerformance,
          period,
          generatedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error("🚚 Delivery Overview Error:", error);
      throw error;
    }
  }
  
  // 📈 DELIVERY METRICS CALCULATION
  async getDeliveryMetrics(baseMatch) {
    try {
      console.log("📊 Getting delivery metrics with baseMatch:", baseMatch);
      
      const metrics = await Order.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: 1 },
            successfulDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } 
            },
            pendingDeliveries: { 
              $sum: { $cond: [{ $in: ["$status", ["Processing", "Out for Delivery"]] }, 1, 0] } 
            },
            failedDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Cancel"] }, 1, 0] } 
            }
          }
        },
        {
          $project: {
            totalDeliveries: 1,
            successfulDeliveries: 1,
            pendingDeliveries: 1,
            failedDeliveries: 1,
            successRate: {
              $cond: [
                { $gt: ["$totalDeliveries", 0] },
                { $multiply: [{ $divide: ["$successfulDeliveries", "$totalDeliveries"] }, 100] },
                0
              ]
            }
          }
        }
      ]);
      
      const result = metrics[0] || {};
      console.log("📊 Delivery metrics result:", result);
      return result;
    } catch (error) {
      console.error("📊 Delivery Metrics Error:", error);
      return {};
    }
  }
  
  // ⏱️ DELIVERY TIME ANALYSIS
  async getDeliveryTimeAnalysis(baseMatch) {
    try {
      const timeAnalysis = await Order.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            status: "Delivered",
            'deliveryInfo.assignedAt': { $exists: true },
            'deliveryInfo.deliveredAt': { $exists: true }
          } 
        },
        {
          $project: {
            deliveryTimeMinutes: {
              $divide: [
                { $subtract: ["$deliveryInfo.deliveredAt", "$deliveryInfo.assignedAt"] },
                1000 * 60 // Convert to minutes
              ]
            },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$deliveryInfo.deliveredAt" } },
            hour: { $hour: "$deliveryInfo.deliveredAt" }
          }
        },
        {
          $group: {
            _id: null,
            averageDeliveryTime: { $avg: "$deliveryTimeMinutes" },
            minDeliveryTime: { $min: "$deliveryTimeMinutes" },
            maxDeliveryTime: { $max: "$deliveryTimeMinutes" },
            totalDeliveries: { $sum: 1 },
            // Group by date for trends
            dailyData: {
              $push: {
                date: "$date",
                time: "$deliveryTimeMinutes",
                hour: "$hour"
              }
            }
          }
        }
      ]);
      
      const result = timeAnalysis[0] || {};
      
      // Process daily trends
      if (result.dailyData) {
        const dailyTrends = this.processDailyTrends(result.dailyData);
        const hourlyTrends = this.processHourlyTrends(result.dailyData);
        
        result.dailyTrends = dailyTrends;
        result.hourlyTrends = hourlyTrends;
        delete result.dailyData; // Remove raw data
      }
      
      return result;
    } catch (error) {
      console.error("⏱️ Time Analysis Error:", error);
      return {};
    }
  }
  
  // 👥 DRIVER PERFORMANCE STATISTICS
  async getDriverPerformanceStats(baseMatch) {
    try {
      console.log("🚗 Getting driver performance stats with baseMatch:", baseMatch);
      
      // First, let's check if we have any orders with delivery info
      const ordersWithDeliveryInfo = await Order.countDocuments({
        'deliveryInfo.assignedDriver': { $exists: true }
      });
      console.log("📊 Orders with deliveryInfo.assignedDriver:", ordersWithDeliveryInfo);
      
      // Check if we have any drivers in the admin collection
      const driversCount = await Admin.countDocuments({ role: "Driver" });
      console.log("👥 Total drivers in admin collection:", driversCount);
      
      // Check delivered orders with drivers
      const deliveredWithDrivers = await Order.countDocuments({
        status: "Delivered",
        'deliveryInfo.assignedDriver': { $exists: true }
      });
      console.log("🎯 Delivered orders with assigned drivers:", deliveredWithDrivers);
      
      const driverStats = await Order.aggregate([
        { 
          $match: { 
            ...baseMatch,
            'deliveryInfo.assignedDriver': { $exists: true }
          } 
        },
        {
          $lookup: {
            from: "admins",
            localField: "deliveryInfo.assignedDriver",
            foreignField: "_id",
            as: "driver"
          }
        },
        { $unwind: "$driver" },
        {
          $group: {
            _id: "$driver._id",
            // FIX: Use name.en from the actual data structure
            driverName: { $first: "$driver.name.en" },
            driverEmail: { $first: "$driver.email" },
            driverPhone: { $first: "$driver.phone" },
            totalAssignments: { $sum: 1 },
            successfulDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } 
            },
            failedDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Cancel"] }, 1, 0] } 
            },
            pendingDeliveries: { 
              $sum: { $cond: [{ $in: ["$status", ["Processing", "Out for Delivery"]] }, 1, 0] } 
            },
            totalRevenue: { 
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$total", 0] } 
            },
            averageOrderValue: { 
              $avg: { $cond: [{ $eq: ["$status", "Delivered"] }, "$total", null] } 
            },
            averageRating: { 
              $avg: {
                $ifNull: ["$deliveryInfo.customerRating.rating", null]
              }
            },
            averageDeliveryTime: {
              $avg: {
                $cond: [
                  { $and: [
                    { $eq: ["$status", "Delivered"] },
                    { $ifNull: ["$deliveryInfo.assignedAt", false] },
                    { $ifNull: ["$deliveryInfo.deliveredAt", false] }
                  ]},
                  {
                    $divide: [
                      { $subtract: ["$deliveryInfo.deliveredAt", "$deliveryInfo.assignedAt"] },
                      1000 * 60 // Convert to minutes
                    ]
                  },
                  null
                ]
              }
            }
          }
        },
        {
          $project: {
            driverName: 1,
            driverEmail: 1,
            driverPhone: 1,
            totalAssignments: 1,
            successfulDeliveries: 1,
            failedDeliveries: 1,
            pendingDeliveries: 1,
            totalRevenue: { $round: ["$totalRevenue", 2] },
            averageOrderValue: { $round: ["$averageOrderValue", 2] },
            successRate: {
              $cond: [
                { $gt: ["$totalAssignments", 0] },
                { $round: [{ $multiply: [{ $divide: ["$successfulDeliveries", "$totalAssignments"] }, 100] }, 1] },
                0
              ]
            },
            averageRating: { $round: [{ $ifNull: ["$averageRating", 5.0] }, 1] },
            averageDeliveryTime: { $round: [{ $ifNull: ["$averageDeliveryTime", 0] }, 1] },
            efficiency: {
              $cond: [
                { $gt: ["$successfulDeliveries", 0] },
                { $round: [{ $divide: ["$totalRevenue", "$successfulDeliveries"] }, 2] },
                0
              ]
            }
          }
        },
        { $sort: { successfulDeliveries: -1, totalRevenue: -1 } },
        { $limit: 20 }
      ]);
      
      // Get active drivers count
      const activeDrivers = await Admin.countDocuments({
        role: "Driver",
        'deliveryInfo.isOnDuty': true
      });
      
      console.log("📊 Driver aggregation results:", JSON.stringify(driverStats, null, 2));
      console.log("🎯 Active drivers count:", activeDrivers);
      console.log("🏆 Top performer:", driverStats[0] || null);
      
      return {
        activeDrivers,
        driverPerformance: driverStats,
        topPerformer: driverStats[0] || null
      };
      
    } catch (error) {
      console.error("👥 Driver Stats Error:", error);
      return { activeDrivers: 0, driverPerformance: [], topPerformer: null };
    }
  }
  
  // 🗺️ ZONE PERFORMANCE ANALYSIS
  async getZonePerformanceData(baseMatch) {
    try {
      const zoneStats = await Order.aggregate([
        { $match: baseMatch },
        {
          $project: {
            // Extract area/zone from user address - use user_info.address which is the correct field
            zone: {
              $let: {
                vars: {
                  address: { $ifNull: ["$user_info.address", "Unknown"] }
                },
                in: {
                  $cond: [
                    { $regexMatch: { input: "$$address", regex: "Area|District|Zone|Street", options: "i" } },
                    {
                      $arrayElemAt: [
                        { $split: [
                          { $arrayElemAt: [
                            { $regexFindAll: { input: "$$address", regex: "([A-Za-z\\s]+)\\s*(Area|District|Zone|Street)", options: "i" } },
                            0
                          ]},
                          " "
                        ]},
                        0
                      ]
                    },
                    {
                      $arrayElemAt: [
                        { $split: ["$$address", ","] },
                        0
                      ]
                    }
                  ]
                }
              }
            },
            status: 1,
            total: 1, // Use 'total' not 'totalAmount'
            deliveryInfo: 1
          }
        },
        {
          $group: {
            _id: "$zone",
            totalOrders: { $sum: 1 },
            successfulDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } 
            },
            failedDeliveries: { 
              $sum: { $cond: [{ $eq: ["$status", "Cancel"] }, 1, 0] } 
            },
            pendingDeliveries: { 
              $sum: { $cond: [{ $in: ["$status", ["Processing", "Out for Delivery"]] }, 1, 0] } 
            },
            totalRevenue: { 
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$total", 0] } 
            },
            averageOrderValue: { $avg: "$total" }, // Use 'total' not 'totalAmount'
            averageDeliveryTime: {
              $avg: {
                $cond: [
                  { $and: [
                    { $eq: ["$status", "Delivered"] },
                    { $exists: ["$deliveryInfo.assignedAt"] },
                    { $exists: ["$deliveryInfo.deliveredAt"] }
                  ]},
                  {
                    $divide: [
                      { $subtract: ["$deliveryInfo.deliveredAt", "$deliveryInfo.assignedAt"] },
                      1000 * 60
                    ]
                  },
                  null
                ]
              }
            }
          }
        },
        {
          $project: {
            zone: "$_id",
            totalOrders: 1,
            successfulDeliveries: 1,
            failedDeliveries: 1,
            pendingDeliveries: 1,
            totalRevenue: { $round: ["$totalRevenue", 2] },
            averageOrderValue: { $round: ["$averageOrderValue", 2] },
            successRate: {
              $cond: [
                { $gt: ["$totalOrders", 0] },
                { $round: [{ $multiply: [{ $divide: ["$successfulDeliveries", "$totalOrders"] }, 100] }, 1] },
                0
              ]
            },
            averageDeliveryTime: { $round: ["$averageDeliveryTime", 1] },
            efficiency: {
              $cond: [
                { $gt: ["$totalOrders", 0] },
                { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
                0
              ]
            }
          }
        },
        { $sort: { totalRevenue: -1, successRate: -1 } },
        { $limit: 15 }
      ]);
      
      return {
        zonePerformance: zoneStats,
        topZone: zoneStats[0]?.zone || 'N/A',
        totalZones: zoneStats.length
      };
      
    } catch (error) {
      console.error("🗺️ Zone Performance Error:", error);
      return { zonePerformance: [], topZone: 'N/A', totalZones: 0 };
    }
  }
  
  // 📊 CUSTOMER SATISFACTION ANALYSIS
  async getCustomerSatisfactionData(filters = {}) {
    try {
      console.log("😊 Fetching customer satisfaction data");
      
      const { period = 30, startDate, endDate, driverId } = filters;
      const dateQuery = this.buildDateQuery(period, startDate, endDate);
      
      const baseMatch = {
        ...dateQuery,
        status: "Delivered",
        'deliveryInfo.customerRating': { $exists: true },
        'deliveryInfo.customerRating.rating': { $gt: 0 }
      };
      
      if (driverId) baseMatch['deliveryInfo.assignedDriver'] = mongoose.Types.ObjectId(driverId);
      
      const satisfactionData = await Order.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: "$deliveryInfo.customerRating.rating" },
            rating5: { $sum: { $cond: [{ $eq: ["$deliveryInfo.customerRating.rating", 5] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ["$deliveryInfo.customerRating.rating", 4] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ["$deliveryInfo.customerRating.rating", 3] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ["$deliveryInfo.customerRating.rating", 2] }, 1, 0] } },
            rating1: { $sum: { $cond: [{ $eq: ["$deliveryInfo.customerRating.rating", 1] }, 1, 0] } },
            // Collect feedback comments
            feedback: {
              $push: {
                $cond: [
                  { $and: [
                    { $exists: ["$deliveryInfo.customerRating.feedback"] },
                    { $ne: ["$deliveryInfo.customerRating.feedback", ""] }
                  ]},
                  {
                    rating: "$deliveryInfo.customerRating.rating",
                    feedback: "$deliveryInfo.customerRating.feedback",
                    date: "$deliveryInfo.deliveredAt",
                    orderId: "$_id"
                  },
                  "$$REMOVE"
                ]
              }
            }
          }
        },
        {
          $project: {
            totalRatings: 1,
            averageRating: { $round: ["$averageRating", 2] },
            ratingDistribution: {
              "5": "$rating5",
              "4": "$rating4", 
              "3": "$rating3",
              "2": "$rating2",
              "1": "$rating1"
            },
            satisfactionRate: {
              $cond: [
                { $gt: ["$totalRatings", 0] },
                { $round: [{ $multiply: [{ $divide: [{ $add: ["$rating4", "$rating5"] }, "$totalRatings"] }, 100] }, 1] },
                0
              ]
            },
            recentFeedback: { $slice: ["$feedback", -10] }
          }
        }
      ]);
      
      return {
        success: true,
        data: satisfactionData[0] || {
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
          satisfactionRate: 0,
          recentFeedback: []
        }
      };
      
    } catch (error) {
      console.error("😊 Customer Satisfaction Error:", error);
      throw error;
    }
  }
  
  // 🛣️ ROUTE EFFICIENCY ANALYSIS
  async getRouteEfficiencyData(filters = {}) {
    try {
      console.log("🛣️ Analyzing route efficiency");
      
      const { period = 30, startDate, endDate, driverId } = filters;
      const dateQuery = this.buildDateQuery(period, startDate, endDate);
      
      const baseMatch = {
        ...dateQuery,
        status: "Delivered",
        'deliveryInfo.assignedDriver': { $exists: true },
        'deliveryInfo.route': { $exists: true }
      };
      
      if (driverId) baseMatch['deliveryInfo.assignedDriver'] = mongoose.Types.ObjectId(driverId);
      
      const routeData = await Order.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: "admins",
            localField: "deliveryInfo.assignedDriver",
            foreignField: "_id",
            as: "driver"
          }
        },
        { $unwind: "$driver" },
        {
          $group: {
            _id: {
              driver: "$driver._id",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$deliveryInfo.deliveredAt" } }
            },
            driverName: { $first: "$driver.name" },
            totalDeliveries: { $sum: 1 },
            totalDistance: { $sum: { $ifNull: ["$deliveryInfo.route.totalDistance", 0] } },
            totalDuration: { $sum: { $ifNull: ["$deliveryInfo.route.totalDuration", 0] } },
            averageDistance: { $avg: { $ifNull: ["$deliveryInfo.route.totalDistance", 0] } },
            fuelEfficiency: {
              $avg: {
                $cond: [
                  { $gt: ["$deliveryInfo.route.totalDistance", 0] },
                  { $divide: ["$totalAmount", "$deliveryInfo.route.totalDistance"] },
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            date: "$_id.date",
            driverName: 1,
            totalDeliveries: 1,
            totalDistance: { $round: ["$totalDistance", 2] },
            totalDuration: { $round: [{ $divide: ["$totalDuration", 60] }, 1] }, // Convert to hours
            averageDistance: { $round: ["$averageDistance", 2] },
            deliveryDensity: {
              $cond: [
                { $gt: ["$totalDistance", 0] },
                { $round: [{ $divide: ["$totalDeliveries", "$totalDistance"] }, 3] },
                0
              ]
            },
            efficiency: { $round: ["$fuelEfficiency", 2] }
          }
        },
        { $sort: { date: -1, efficiency: -1 } },
        { $limit: 50 }
      ]);
      
      return {
        success: true,
        data: {
          routeAnalysis: routeData,
          summary: this.calculateRouteSummary(routeData)
        }
      };
      
    } catch (error) {
      console.error("🛣️ Route Efficiency Error:", error);
      throw error;
    }
  }
  
  // 🔧 UTILITY METHODS
  
  buildDateQuery(period, startDate, endDate) {
    // 🧪 TEMPORARY: Disable date filtering to see all orders (including future dates)
    console.log("🕐 TEMPORARILY BYPASSING DATE FILTERING - WILL SHOW ALL ORDERS");
    return {}; // Return empty object = no date filtering
    
    /* ORIGINAL CODE - WILL RE-ENABLE AFTER TESTING:
    const now = dayjs();
    
    if (startDate && endDate) {
      return {
        createdAt: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      };
    }
    
    const daysBack = parseInt(period) || 30;
    return {
      createdAt: {
        $gte: now.subtract(daysBack, 'day').startOf('day').toDate(),
        $lte: now.endOf('day').toDate()
      }
    };
    */
  }
  
  processDailyTrends(dailyData) {
    const trends = {};
    
    dailyData.forEach(item => {
      if (!trends[item.date]) {
        trends[item.date] = {
          date: item.date,
          deliveries: 0,
          totalTime: 0,
          averageTime: 0
        };
      }
      
      trends[item.date].deliveries += 1;
      trends[item.date].totalTime += item.time;
      trends[item.date].averageTime = trends[item.date].totalTime / trends[item.date].deliveries;
    });
    
    return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date));
  }
  
  processHourlyTrends(dailyData) {
    const hourlyStats = {};
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = {
        hour,
        deliveries: 0,
        totalTime: 0,
        averageTime: 0
      };
    }
    
    dailyData.forEach(item => {
      const hour = item.hour;
      if (hourlyStats[hour]) {
        hourlyStats[hour].deliveries += 1;
        hourlyStats[hour].totalTime += item.time;
        hourlyStats[hour].averageTime = hourlyStats[hour].totalTime / hourlyStats[hour].deliveries;
      }
    });
    
    return Object.values(hourlyStats);
  }
  
  calculateRouteSummary(routeData) {
    if (!routeData || routeData.length === 0) {
      return {
        totalRoutes: 0,
        averageDistance: 0,
        averageDuration: 0,
        bestEfficiency: 0,
        totalDeliveries: 0
      };
    }
    
    const summary = routeData.reduce((acc, route) => {
      acc.totalRoutes += 1;
      acc.totalDistance += route.totalDistance || 0;
      acc.totalDuration += route.totalDuration || 0;
      acc.totalDeliveries += route.totalDeliveries || 0;
      acc.bestEfficiency = Math.max(acc.bestEfficiency, route.efficiency || 0);
      return acc;
    }, {
      totalRoutes: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalDeliveries: 0,
      bestEfficiency: 0
    });
    
    return {
      totalRoutes: summary.totalRoutes,
      averageDistance: parseFloat((summary.totalDistance / summary.totalRoutes).toFixed(2)),
      averageDuration: parseFloat((summary.totalDuration / summary.totalRoutes).toFixed(1)),
      bestEfficiency: summary.bestEfficiency,
      totalDeliveries: summary.totalDeliveries
    };
  }
}

module.exports = new DeliveryAnalyticsService(); 