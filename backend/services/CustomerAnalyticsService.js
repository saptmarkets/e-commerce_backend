const Customer = require("../models/Customer");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// 🎸 Customer Analytics Service - Comprehensive Customer Insights
// Provides customer lifetime value, segmentation, behavior analysis, and retention metrics
// Created by AYE for SaptMarkets customer intelligence system

class CustomerAnalyticsService {
  constructor() {
    this.name = "CustomerAnalyticsService";
    
  }

  // 🎸 Customer Overview & KPIs
  async getCustomerOverview(options = {}) {
    try {
      const { 
        period = 30, 
        segment = null, 
        minOrderValue = 0,
        city = null,
        country = null
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Build match queries
      const customerMatchQuery = {};
      if (city) customerMatchQuery.city = city;
      if (country) customerMatchQuery.country = country;

      // Get customer overview stats
      const customerStats = await Customer.aggregate([
        { $match: customerMatchQuery },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            totalSpent: { $sum: "$purchaseStats.totalSpent" },
            totalOrders: { $sum: "$purchaseStats.totalOrders" },
            averageLifetimeValue: { $avg: "$purchaseStats.totalSpent" },
            averageOrderValue: { $avg: "$purchaseStats.averageOrderValue" },
            activeCustomers: {
              $sum: {
                $cond: [
                  { $gte: ["$purchaseStats.lastOrderDate", startDate] },
                  1,
                  0
                ]
              }
            },
            loyaltyPointsTotal: { $sum: "$loyaltyPoints.current" }
          }
        }
      ]);

      // Get new customers in period
      const newCustomers = await Customer.countDocuments({
        ...customerMatchQuery,
        createdAt: { $gte: startDate }
      });

      // Get customer segmentation based on spending
      const customerSegments = await Customer.aggregate([
        { $match: customerMatchQuery },
        {
          $addFields: {
            segment: {
              $cond: {
                if: { $gte: ["$purchaseStats.totalSpent", 5000] },
                then: "VIP",
                else: {
                  $cond: {
                    if: { $gte: ["$purchaseStats.totalSpent", 1000] },
                    then: "Premium",
                    else: {
                      $cond: {
                        if: { $gte: ["$purchaseStats.totalSpent", 100] },
                        then: "Regular",
                        else: "New"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: "$segment",
            count: { $sum: 1 },
            totalSpent: { $sum: "$purchaseStats.totalSpent" },
            averageSpent: { $avg: "$purchaseStats.totalSpent" }
          }
        },
        { $sort: { totalSpent: -1 } }
      ]);

      // Get top customers by spending
      const topCustomers = await Customer.aggregate([
        { $match: customerMatchQuery },
        {
          $project: {
            name: 1,
            email: 1,
            phone: 1,
            city: 1,
            totalSpent: "$purchaseStats.totalSpent",
            totalOrders: "$purchaseStats.totalOrders",
            averageOrderValue: "$purchaseStats.averageOrderValue",
            lastOrderDate: "$purchaseStats.lastOrderDate",
            loyaltyPoints: "$loyaltyPoints.current",
            customerSegment: {
              $cond: {
                if: { $gte: ["$purchaseStats.totalSpent", 5000] },
                then: "VIP",
                else: {
                  $cond: {
                    if: { $gte: ["$purchaseStats.totalSpent", 1000] },
                    then: "Premium",
                    else: {
                      $cond: {
                        if: { $gte: ["$purchaseStats.totalSpent", 100] },
                        then: "Regular",
                        else: "New"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 20 }
      ]);

      return {
        success: true,
        data: {
          overview: customerStats[0] || {
            totalCustomers: 0,
            totalSpent: 0,
            totalOrders: 0,
            averageLifetimeValue: 0,
            averageOrderValue: 0,
            activeCustomers: 0,
            loyaltyPointsTotal: 0
          },
          newCustomers,
          customerSegments,
          topCustomers,
          filters: {
            period,
            segment,
            minOrderValue,
            city,
            country
          }
        }
      };

    } catch (error) {
      console.error("🎸 Customer Overview Error:", error);
      return {
        success: false,
        message: "Failed to fetch customer overview",
        error: error.message
      };
    }
  }

  // 🎸 Customer Lifetime Value Analysis
  async getCustomerLifetimeValue(options = {}) {
    try {
      const { 
        segment = null, 
        limit = 50,
        minClv = 0,
        city = null
      } = options;

      const matchQuery = {};
      if (segment) matchQuery.customerSegment = segment;
      if (city) matchQuery.city = city;

      // Calculate CLV with predictive analysis
      const clvAnalysis = await Customer.aggregate([
        { $match: matchQuery },
        {
          $addFields: {
            customerSegment: {
              $cond: {
                if: { $gte: ["$purchaseStats.totalSpent", 5000] },
                then: "VIP",
                else: {
                  $cond: {
                    if: { $gte: ["$purchaseStats.totalSpent", 1000] },
                    then: "Premium",
                    else: {
                      $cond: {
                        if: { $gte: ["$purchaseStats.totalSpent", 100] },
                        then: "Regular",
                        else: "New"
                      }
                    }
                  }
                }
              }
            },
            customerAge: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            },
            orderFrequency: {
              $cond: {
                if: { $gt: ["$purchaseStats.totalOrders", 0] },
                then: {
                  $divide: [
                    "$purchaseStats.totalOrders",
                    { $max: [1, { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60 * 24] }] }
                  ]
                },
                else: 0
              }
            },
            predictedLifetimeValue: {
              $multiply: [
                "$purchaseStats.averageOrderValue",
                { $multiply: [12, 2] } // Assume 2-year retention period
              ]
            }
          }
        },
        {
          $match: {
            "purchaseStats.totalSpent": { $gte: minClv }
          }
        },
        {
          $project: {
            customerId: "$_id",
            name: 1,
            email: 1,
            city: 1,
            customerSegment: 1,
            currentClv: "$purchaseStats.totalSpent",
            totalOrders: "$purchaseStats.totalOrders",
            averageOrderValue: "$purchaseStats.averageOrderValue",
            lastOrderDate: "$purchaseStats.lastOrderDate",
            loyaltyPoints: "$loyaltyPoints.current",
            customerAge: { $round: ["$customerAge", 0] },
            orderFrequency: { $round: ["$orderFrequency", 3] },
            predictedLifetimeValue: { $round: ["$predictedLifetimeValue", 2] },
            createdAt: 1
          }
        },
        { $sort: { currentClv: -1 } },
        { $limit: limit }
      ]);

      // Calculate CLV summary by segment
      const clvSummary = await Customer.aggregate([
        {
          $addFields: {
            customerSegment: {
              $cond: {
                if: { $gte: ["$purchaseStats.totalSpent", 5000] },
                then: "VIP",
                else: {
                  $cond: {
                    if: { $gte: ["$purchaseStats.totalSpent", 1000] },
                    then: "Premium",
                    else: {
                      $cond: {
                        if: { $gte: ["$purchaseStats.totalSpent", 100] },
                        then: "Regular",
                        else: "New"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: "$customerSegment",
            customerCount: { $sum: 1 },
            averageClv: { $avg: "$purchaseStats.totalSpent" },
            totalClv: { $sum: "$purchaseStats.totalSpent" },
            averageOrders: { $avg: "$purchaseStats.totalOrders" },
            averageOrderValue: { $avg: "$purchaseStats.averageOrderValue" }
          }
        },
        { $sort: { averageClv: -1 } }
      ]);

      return {
        success: true,
        data: {
          clvAnalysis,
          clvSummary,
          filters: {
            segment,
            limit,
            minClv,
            city
          }
        }
      };

    } catch (error) {
      console.error("🎸 Customer CLV Error:", error);
      return {
        success: false,
        message: "Failed to fetch customer lifetime value analysis",
        error: error.message
      };
    }
  }

  // 🎸 RFM Analysis (Recency, Frequency, Monetary)
  async getRFMAnalysis(options = {}) {
    try {
      const { 
        period = 365, 
        limit = 100
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const rfmAnalysis = await Customer.aggregate([
        {
          $addFields: {
            // Recency: Days since last order
            recency: {
              $cond: {
                if: "$purchaseStats.lastOrderDate",
                then: {
                  $divide: [
                    { $subtract: [new Date(), "$purchaseStats.lastOrderDate"] },
                    1000 * 60 * 60 * 24
                  ]
                },
                else: 999 // Very high number for customers with no orders
              }
            },
            // Frequency: Total number of orders
            frequency: "$purchaseStats.totalOrders",
            // Monetary: Total amount spent
            monetary: "$purchaseStats.totalSpent"
          }
        },
        {
          $addFields: {
            // RFM Scoring (1-5 scale)
            recencyScore: {
              $cond: {
                if: { $lte: ["$recency", 30] },
                then: 5,
                else: {
                  $cond: {
                    if: { $lte: ["$recency", 60] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $lte: ["$recency", 90] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $lte: ["$recency", 180] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            frequencyScore: {
              $cond: {
                if: { $gte: ["$frequency", 10] },
                then: 5,
                else: {
                  $cond: {
                    if: { $gte: ["$frequency", 5] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $gte: ["$frequency", 3] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $gte: ["$frequency", 1] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            monetaryScore: {
              $cond: {
                if: { $gte: ["$monetary", 5000] },
                then: 5,
                else: {
                  $cond: {
                    if: { $gte: ["$monetary", 2000] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $gte: ["$monetary", 500] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $gte: ["$monetary", 100] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            rfmScore: {
              $concat: [
                { $toString: "$recencyScore" },
                { $toString: "$frequencyScore" },
                { $toString: "$monetaryScore" }
              ]
            },
            rfmSegment: {
              $cond: {
                if: { $and: [{ $gte: ["$recencyScore", 4] }, { $gte: ["$frequencyScore", 4] }, { $gte: ["$monetaryScore", 4] }] },
                then: "Champions",
                else: {
                  $cond: {
                    if: { $and: [{ $gte: ["$recencyScore", 3] }, { $gte: ["$frequencyScore", 3] }, { $gte: ["$monetaryScore", 3] }] },
                    then: "Loyal Customers",
                    else: {
                      $cond: {
                        if: { $and: [{ $gte: ["$recencyScore", 4] }, { $lte: ["$frequencyScore", 2] }] },
                        then: "New Customers",
                        else: {
                          $cond: {
                            if: { $and: [{ $gte: ["$frequencyScore", 3] }, { $lte: ["$recencyScore", 2] }] },
                            then: "At Risk",
                            else: {
                              $cond: {
                                if: { $lte: ["$recencyScore", 2] },
                                then: "Lost Customers",
                                else: "Potential Loyalists"
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            customerId: "$_id",
            name: 1,
            email: 1,
            city: 1,
            recency: { $round: ["$recency", 0] },
            frequency: 1,
            monetary: { $round: ["$monetary", 2] },
            recencyScore: 1,
            frequencyScore: 1,
            monetaryScore: 1,
            rfmScore: 1,
            rfmSegment: 1,
            lastOrderDate: "$purchaseStats.lastOrderDate",
            createdAt: 1
          }
        },
        { $sort: { monetary: -1 } },
        { $limit: limit }
      ]);

      // Get RFM segment summary
      const rfmSummary = await Customer.aggregate([
        {
          $addFields: {
            recency: {
              $cond: {
                if: "$purchaseStats.lastOrderDate",
                then: {
                  $divide: [
                    { $subtract: [new Date(), "$purchaseStats.lastOrderDate"] },
                    1000 * 60 * 60 * 24
                  ]
                },
                else: 999
              }
            },
            frequency: "$purchaseStats.totalOrders",
            monetary: "$purchaseStats.totalSpent"
          }
        },
        {
          $addFields: {
            recencyScore: {
              $cond: {
                if: { $lte: ["$recency", 30] },
                then: 5,
                else: {
                  $cond: {
                    if: { $lte: ["$recency", 60] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $lte: ["$recency", 90] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $lte: ["$recency", 180] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            frequencyScore: {
              $cond: {
                if: { $gte: ["$frequency", 10] },
                then: 5,
                else: {
                  $cond: {
                    if: { $gte: ["$frequency", 5] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $gte: ["$frequency", 3] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $gte: ["$frequency", 1] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            monetaryScore: {
              $cond: {
                if: { $gte: ["$monetary", 5000] },
                then: 5,
                else: {
                  $cond: {
                    if: { $gte: ["$monetary", 2000] },
                    then: 4,
                    else: {
                      $cond: {
                        if: { $gte: ["$monetary", 500] },
                        then: 3,
                        else: {
                          $cond: {
                            if: { $gte: ["$monetary", 100] },
                            then: 2,
                            else: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            rfmSegment: {
              $cond: {
                if: { $and: [{ $gte: ["$recencyScore", 4] }, { $gte: ["$frequencyScore", 4] }, { $gte: ["$monetaryScore", 4] }] },
                then: "Champions",
                else: {
                  $cond: {
                    if: { $and: [{ $gte: ["$recencyScore", 3] }, { $gte: ["$frequencyScore", 3] }, { $gte: ["$monetaryScore", 3] }] },
                    then: "Loyal Customers",
                    else: {
                      $cond: {
                        if: { $and: [{ $gte: ["$recencyScore", 4] }, { $lte: ["$frequencyScore", 2] }] },
                        then: "New Customers",
                        else: {
                          $cond: {
                            if: { $and: [{ $gte: ["$frequencyScore", 3] }, { $lte: ["$recencyScore", 2] }] },
                            then: "At Risk",
                            else: {
                              $cond: {
                                if: { $lte: ["$recencyScore", 2] },
                                then: "Lost Customers",
                                else: "Potential Loyalists"
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: "$rfmSegment",
            customerCount: { $sum: 1 },
            averageRecency: { $avg: "$recency" },
            averageFrequency: { $avg: "$frequency" },
            averageMonetary: { $avg: "$monetary" },
            totalRevenue: { $sum: "$monetary" }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return {
        success: true,
        data: {
          rfmAnalysis,
          rfmSummary,
          filters: {
            period,
            limit
          }
        }
      };

    } catch (error) {
      console.error("🎸 RFM Analysis Error:", error);
      return {
        success: false,
        message: "Failed to fetch RFM analysis",
        error: error.message
      };
    }
  }

  // 🎸 Purchase Behavior Analysis
  async getPurchaseBehavior(options = {}) {
    try {
      const { 
        period = 90, 
        customerId = null,
        limit = 50
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      let matchQuery = {
        createdAt: { $gte: startDate },
        status: { $ne: "Cancel" }
      };

      if (customerId) {
        matchQuery.user = new mongoose.Types.ObjectId(customerId);
      }

      // Analyze purchase patterns from orders
      const purchasePatterns = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: "$cart" },
        {
          $group: {
            _id: "$user",
            totalOrders: { $addToSet: "$_id" },
            totalProducts: { $sum: "$cart.quantity" },
            totalSpent: { $sum: { $multiply: ["$cart.quantity", "$cart.price"] } },
            categoriesPurchased: { $addToSet: "$cart.category" },
            averageOrderValue: { $avg: "$totalAmount" },
            preferredPaymentMethod: { $first: "$paymentMethod" },
            lastOrderDate: { $max: "$createdAt" },
            firstOrderDate: { $min: "$createdAt" }
          }
        },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customerInfo"
          }
        },
        {
          $project: {
            customerId: "$_id",
            customerName: { $arrayElemAt: ["$customerInfo.name", 0] },
            customerEmail: { $arrayElemAt: ["$customerInfo.email", 0] },
            customerCity: { $arrayElemAt: ["$customerInfo.city", 0] },
            totalOrderCount: { $size: "$totalOrders" },
            totalProducts: 1,
            totalSpent: { $round: ["$totalSpent", 2] },
            categoriesPurchased: 1,
            categoryCount: { $size: "$categoriesPurchased" },
            averageOrderValue: { $round: ["$averageOrderValue", 2] },
            preferredPaymentMethod: 1,
            lastOrderDate: 1,
            firstOrderDate: 1,
            customerLifespan: {
              $divide: [
                { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            },
            orderFrequency: {
              $divide: [
                { $size: "$totalOrders" },
                {
                  $max: [
                    1,
                    {
                      $divide: [
                        { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit }
      ]);

  
      
      // Get most popular categories with proper name lookup
      const categoryAnalysis = await Order.aggregate([
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
          $addFields: {
            categoryName: {
              $ifNull: [
                { $ifNull: [
                  { $arrayElemAt: ["$categoryInfo.name.en", 0] },
                  { $arrayElemAt: ["$categoryInfo.name.ar", 0] }
                ]},
                "Unknown Category"
              ]
            }
          }
        },
        {
          $group: {
            _id: "$categoryName",
            totalQuantity: { $sum: "$cart.quantity" },
            totalRevenue: { $sum: { $multiply: ["$cart.quantity", "$cart.price"] } },
            uniqueCustomers: { $addToSet: "$user" },
            averagePrice: { $avg: "$cart.price" }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: "Unknown Category" }
          }
        },
        {
          $project: {
            category: "$_id",
            totalQuantity: 1,
            totalRevenue: { $round: ["$totalRevenue", 2] },
            customerCount: { $size: "$uniqueCustomers" },
            averagePrice: { $round: ["$averagePrice", 2] }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 20 }
      ]);



      // Get purchase time analysis
      const timeAnalysis = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" },
              dayOfWeek: { $dayOfWeek: "$createdAt" }
            },
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" }
          }
        },
        {
          $group: {
            _id: null,
            hourlyDistribution: {
              $push: {
                hour: "$_id.hour",
                orderCount: "$orderCount",
                totalRevenue: "$totalRevenue"
              }
            },
            weeklyDistribution: {
              $push: {
                dayOfWeek: "$_id.dayOfWeek",
                orderCount: "$orderCount",
                totalRevenue: "$totalRevenue"
              }
            }
          }
        }
      ]);

      return {
        success: true,
        data: {
          purchasePatterns,
          categoryAnalysis,
          timeAnalysis: timeAnalysis[0] || { hourlyDistribution: [], weeklyDistribution: [] },
          filters: {
            period,
            customerId,
            limit
          }
        }
      };

    } catch (error) {
      console.error("🎸 Purchase Behavior Error:", error);
      return {
        success: false,
        message: "Failed to fetch purchase behavior analysis",
        error: error.message
      };
    }
  }

  // 🎸 Geographic Customer Distribution
  async getGeographicDistribution(options = {}) {
    try {
      const { 
        groupBy = "area", 
        limit = 50,
        minCustomers = 1
      } = options;



      // Use comprehensive address data to extract areas
      const geographicData = await Customer.aggregate([
        {
          $match: {
            $or: [
              { "shippingAddress.coordinates.address": { $exists: true, $ne: null, $ne: "" } },
              { address: { $exists: true, $ne: null, $ne: "" } },
              { city: { $exists: true, $ne: null, $ne: "" } }
            ]
          }
        },
        {
          $addFields: {
            // Get the most detailed address available
            detailedAddress: {
              $cond: {
                if: { $and: [
                  { $ne: ["$shippingAddress.coordinates.address", null] },
                  { $ne: ["$shippingAddress.coordinates.address", ""] },
                  { $gt: [{ $strLenBytes: "$shippingAddress.coordinates.address" }, 10] }
                ]},
                then: "$shippingAddress.coordinates.address",
                else: {
                  $cond: {
                    if: { $and: [
                      { $ne: ["$address", null] },
                      { $ne: ["$address", ""] },
                      { $gt: [{ $strLenBytes: "$address" }, 5] }
                    ]},
                    then: "$address",
                    else: "$city"
                  }
                }
              }
            },
            // Extract coordinates for clustering
            coordinates: {
              lat: { $ifNull: ["$shippingAddress.coordinates.latitude", 0] },
              lng: { $ifNull: ["$shippingAddress.coordinates.longitude", 0] }
            }
          }
        },
        {
          $addFields: {
            // Extract area from detailed address
            area: {
              $cond: {
                if: { $regexMatch: { input: "$detailedAddress", regex: "," } },
                then: {
                  // If address has commas, take the first meaningful part
                  $trim: {
                    input: { $arrayElemAt: [{ $split: ["$detailedAddress", ","] }, 0] }
                  }
                },
                else: {
                  // For single-word addresses, use coordinate-based clustering
                  $cond: {
                    if: { $and: [
                      { $gt: ["$coordinates.lat", 0] },
                      { $gt: ["$coordinates.lng", 0] }
                    ]},
                    then: {
                      $concat: [
                        "Area-",
                        { $toString: { $floor: { $multiply: ["$coordinates.lat", 100] } } },
                        "-",
                        { $toString: { $floor: { $multiply: ["$coordinates.lng", 100] } } }
                      ]
                    },
                    else: { $trim: { input: "$detailedAddress" } }
                  }
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "user",
            as: "orders"
          }
        },
        {
          $addFields: {
            // Calculate customer metrics
            totalOrders: { $size: "$orders" },
            totalSpent: { $sum: "$orders.totalAmount" },
            avgOrderValue: { $avg: "$orders.totalAmount" },
            lastOrderDate: { $max: "$orders.createdAt" },
            isActive: {
              $cond: {
                if: { $gt: ["$lastOrderDate", { $subtract: [new Date(), 90 * 24 * 60 * 60 * 1000] }] },
                then: true,
                else: false
              }
            }
          }
        },
        {
          $group: {
            _id: "$area",
            customerCount: { $sum: 1 },
            totalOrders: { $sum: "$totalOrders" },
            totalSpent: { $sum: "$totalSpent" },
            avgOrderValue: { $avg: "$avgOrderValue" },
            activeCustomers: { $sum: { $cond: ["$isActive", 1, 0] } },
            avgLat: { $avg: "$coordinates.lat" },
            avgLng: { $avg: "$coordinates.lng" },
            sampleAddresses: { $push: "$detailedAddress" }
          }
        },
        {
          $match: {
            customerCount: { $gte: minCustomers },
            _id: { $ne: null, $ne: "" }
          }
        },
        {
          $project: {
            location: "$_id",
            customerCount: 1,
            totalOrders: 1,
            totalSpent: { $round: ["$totalSpent", 2] },
            averageSpent: { $round: [{ $divide: ["$totalSpent", "$customerCount"] }, 2] },
            avgOrderValue: { $round: ["$avgOrderValue", 2] },
            activeCustomers: 1,
            penetrationRate: { $round: [{ $multiply: [{ $divide: ["$activeCustomers", "$customerCount"] }, 100] }, 1] },
            avgCoordinates: {
              lat: "$avgLat",
              lng: "$avgLng"
            },
            sampleAddresses: { $slice: ["$sampleAddresses", 3] }
          }
        },
        { $sort: { customerCount: -1 } },
        { $limit: limit }
      ]);

      console.log("🎸 Geographic Analysis Results:", {
        count: geographicData.length,
        sampleAreas: geographicData.slice(0, 3).map(area => ({
          location: area.location,
          customers: area.customerCount,
          coordinates: area.avgCoordinates,
          sampleAddresses: area.sampleAddresses?.slice(0, 2)
        }))
      });

      return {
        success: true,
        data: {
          geographicData,
          summary: {
            totalAreas: geographicData.length,
            totalCustomers: geographicData.reduce((sum, area) => sum + area.customerCount, 0),
            totalOrders: geographicData.reduce((sum, area) => sum + area.totalOrders, 0),
            totalRevenue: geographicData.reduce((sum, area) => sum + area.totalSpent, 0),
            avgCustomersPerArea: geographicData.length > 0 ? 
              (geographicData.reduce((sum, area) => sum + area.customerCount, 0) / geographicData.length).toFixed(1) : 0
          },
          filters: { groupBy, limit, minCustomers }
        }
      };

    } catch (error) {
      console.error("🎸 Geographic Distribution Error:", error);
      return {
        success: false,
        message: "Failed to fetch geographic distribution",
        error: error.message
      };
    }
  }

  // 🎸 Customer Acquisition Analysis
  async getCustomerAcquisition(options = {}) {
    try {
      const { 
        period = 365, 
        groupBy = "month" // day, week, month, quarter
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      let dateGrouping;
      switch (groupBy) {
        case "day":
          dateGrouping = {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          };
          break;
        case "week":
          dateGrouping = {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          };
          break;
        case "quarter":
          dateGrouping = {
            year: { $year: "$createdAt" },
            quarter: {
              $ceil: { $divide: [{ $month: "$createdAt" }, 3] }
            }
          };
          break;
        default: // month
          dateGrouping = {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          };
      }

      const acquisitionData = await Customer.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: dateGrouping,
            newCustomers: { $sum: 1 },
            cities: { $addToSet: "$city" },
            averageFirstOrderValue: { $avg: "$purchaseStats.averageOrderValue" },
            totalFirstOrderValue: { $sum: "$purchaseStats.averageOrderValue" }
          }
        },
        {
          $project: {
            period: "$_id",
            newCustomers: 1,
            uniqueCities: { $size: "$cities" },
            averageFirstOrderValue: { $round: ["$averageFirstOrderValue", 2] },
            totalFirstOrderValue: { $round: ["$totalFirstOrderValue", 2] }
          }
        },
        { $sort: { "period.year": 1, "period.month": 1, "period.day": 1 } }
      ]);

      // Calculate acquisition rate and growth
      let acquisitionWithGrowth = [];
      for (let i = 0; i < acquisitionData.length; i++) {
        const current = acquisitionData[i];
        const previous = i > 0 ? acquisitionData[i - 1] : null;
        
        acquisitionWithGrowth.push({
          ...current,
          growthRate: previous 
            ? ((current.newCustomers - previous.newCustomers) / previous.newCustomers * 100).toFixed(2)
            : 0
        });
      }

      // Get acquisition summary
      const acquisitionSummary = await Customer.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalNewCustomers: { $sum: 1 },
            averageMonthlyAcquisition: { 
              $avg: 1 // Will be calculated based on period
            },
            uniqueCities: { $addToSet: "$city" },
            totalValue: { $sum: "$purchaseStats.totalSpent" }
          }
        },
        {
          $project: {
            totalNewCustomers: 1,
            uniqueCities: { $size: "$uniqueCities" },
            totalValue: { $round: ["$totalValue", 2] },
            averageCustomerValue: {
              $round: [{ $divide: ["$totalValue", "$totalNewCustomers"] }, 2]
            }
          }
        }
      ]);

      return {
        success: true,
        data: {
          acquisitionTrends: acquisitionWithGrowth,
          summary: acquisitionSummary[0] || {
            totalNewCustomers: 0,
            uniqueCities: 0,
            totalValue: 0,
            averageCustomerValue: 0
          },
          filters: {
            period,
            groupBy
          }
        }
      };

    } catch (error) {
      console.error("🎸 Customer Acquisition Error:", error);
      return {
        success: false,
        message: "Failed to fetch customer acquisition analysis",
        error: error.message
      };
    }
  }

  // 🎸 Comprehensive Customer Dashboard
  async getCustomerDashboard(options = {}) {
    try {
      const { period = 30, city = null } = options;

      // Get all key metrics in parallel
      const [
        customerOverview,
        lifetimeValue,
        rfmAnalysis,
        purchaseBehavior,
        geographicDistribution,
        customerAcquisition
      ] = await Promise.all([
        this.getCustomerOverview({ period, city, limit: 10 }),
        this.getCustomerLifetimeValue({ limit: 10, city }),
        this.getRFMAnalysis({ period, limit: 10 }),
        this.getPurchaseBehavior({ period, limit: 10 }),
        this.getGeographicDistribution({ limit: 10 }),
        this.getCustomerAcquisition({ period: 90, groupBy: "week" })
      ]);

      return {
        success: true,
        data: {
          customerOverview: customerOverview.data,
          lifetimeValue: lifetimeValue.data,
          rfmAnalysis: rfmAnalysis.data,
          purchaseBehavior: purchaseBehavior.data,
          geographicDistribution: geographicDistribution.data,
          customerAcquisition: customerAcquisition.data,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error("🎸 Customer Dashboard Error:", error);
      return {
        success: false,
        message: "Failed to fetch customer dashboard",
        error: error.message
      };
    }
  }
}

module.exports = CustomerAnalyticsService; 