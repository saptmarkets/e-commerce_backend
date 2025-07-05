const CustomerAnalyticsService = require("../services/CustomerAnalyticsService");

// 🎸 Customer Analytics Controller - RESTful API for Customer Insights
// Provides comprehensive customer analytics endpoints for SaptMarkets admin dashboard
// Created by AYE for deep customer intelligence and business insights

class CustomerAnalyticsController {
  constructor() {
    this.customerAnalytics = new CustomerAnalyticsService();
    console.log("🎸 Customer Analytics Controller initialized - Ready to serve customer insights!");
  }

  // 🎸 GET /api/reports/customer/overview
  // Main customer overview with KPIs and summary metrics
  async getCustomerOverview(req, res) {
    try {
      const {
        period = 30,
        segment = null,
        minOrderValue = 0,
        city = null,
        country = null
      } = req.query;

      console.log("🎸 Fetching customer overview with params:", {
        period,
        segment,
        minOrderValue,
        city,
        country
      });

      const result = await this.customerAnalytics.getCustomerOverview({
        period: parseInt(period),
        segment,
        minOrderValue: parseFloat(minOrderValue),
        city,
        country
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Customer overview retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Customer Overview Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer overview",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/lifetime-value
  // Customer lifetime value analysis with predictive insights
  async getCustomerLifetimeValue(req, res) {
    try {
      const {
        segment = null,
        limit = 50,
        minClv = 0,
        city = null
      } = req.query;

      console.log("🎸 Fetching customer lifetime value with params:", {
        segment,
        limit,
        minClv,
        city
      });

      const result = await this.customerAnalytics.getCustomerLifetimeValue({
        segment,
        limit: parseInt(limit),
        minClv: parseFloat(minClv),
        city
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Customer lifetime value analysis retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Customer CLV Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer lifetime value analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/rfm-analysis
  // RFM analysis for customer segmentation (Recency, Frequency, Monetary)
  async getRFMAnalysis(req, res) {
    try {
      const {
        period = 365,
        limit = 100
      } = req.query;

      console.log("🎸 Fetching RFM analysis with params:", {
        period,
        limit
      });

      const result = await this.customerAnalytics.getRFMAnalysis({
        period: parseInt(period),
        limit: parseInt(limit)
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "RFM analysis retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 RFM Analysis Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch RFM analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/purchase-behavior
  // Purchase behavior analysis and patterns
  async getPurchaseBehavior(req, res) {
    try {
      const {
        period = 90,
        customerId = null,
        limit = 50
      } = req.query;

      console.log("🎸 Fetching purchase behavior with params:", {
        period,
        customerId,
        limit
      });

      const result = await this.customerAnalytics.getPurchaseBehavior({
        period: parseInt(period),
        customerId,
        limit: parseInt(limit)
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Purchase behavior analysis retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Purchase Behavior Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch purchase behavior analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/geographic-distribution
  // Geographic distribution of customers by city/country
  async getGeographicDistribution(req, res) {
    try {
      const {
        groupBy = "city",
        limit = 50,
        minCustomers = 1
      } = req.query;

      console.log("🎸 Fetching geographic distribution with params:", {
        groupBy,
        limit,
        minCustomers
      });

      const result = await this.customerAnalytics.getGeographicDistribution({
        groupBy,
        limit: parseInt(limit),
        minCustomers: parseInt(minCustomers)
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Geographic distribution retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Geographic Distribution Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch geographic distribution",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/acquisition-analysis
  // Customer acquisition trends and analysis
  async getCustomerAcquisition(req, res) {
    try {
      const {
        period = 365,
        groupBy = "month"
      } = req.query;

      console.log("🎸 Fetching customer acquisition with params:", {
        period,
        groupBy
      });

      const result = await this.customerAnalytics.getCustomerAcquisition({
        period: parseInt(period),
        groupBy
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Customer acquisition analysis retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Customer Acquisition Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer acquisition analysis",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/dashboard
  // Comprehensive customer dashboard with all key metrics
  async getCustomerDashboard(req, res) {
    try {
      const {
        period = 30,
        city = null,
        autoSync = 'true'
      } = req.query;

      console.log("🎸 Fetching customer dashboard with params:", {
        period,
        city,
        autoSync
      });

      const result = await this.customerAnalytics.getCustomerDashboard({
        period: parseInt(period),
        city
      });

      // 🎸 If no customer segments found and autoSync is enabled, sync purchase stats
      if (result.success && autoSync === 'true') {
        const customerSegments = result.data?.customerOverview?.customerSegments || [];
        const totalCustomers = customerSegments.reduce((sum, seg) => sum + seg.count, 0);
        
        if (totalCustomers === 0) {
          console.log("🎸 No customer segments found, attempting to sync purchase statistics...");
          const syncResult = await this.customerAnalytics.syncCustomerPurchaseStats();
          
          if (syncResult.success) {
            console.log("🎸 Purchase stats synced, refetching dashboard data...");
            const updatedResult = await this.customerAnalytics.getCustomerDashboard({
              period: parseInt(period),
              city
            });
            
            if (updatedResult.success) {
              return res.status(200).json({
                success: true,
                data: updatedResult.data,
                message: "Customer dashboard retrieved successfully (with data sync)",
                syncInfo: syncResult.data
              });
            }
          }
        }
      }

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Customer dashboard retrieved successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Customer Dashboard Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer dashboard",
        error: error.message
      });
    }
  }

  // 🎸 POST /api/reports/customer/sync-stats
  // Manual trigger to sync customer purchase statistics
  async syncCustomerStats(req, res) {
    try {
      console.log("🎸 Manual customer stats sync triggered");

      const result = await this.customerAnalytics.syncCustomerPurchaseStats();

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Customer purchase statistics synchronized successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error("🎸 Customer Stats Sync Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync customer statistics",
        error: error.message
      });
    }
  }

  // 🎸 GET /api/reports/customer/export
  // Export customer analytics data in various formats
  async exportCustomerReport(req, res) {
    try {
      const {
        reportType = "overview",
        format = "csv",
        period = 30,
        segment = null,
        city = null
      } = req.query;

      console.log("🎸 Exporting customer report with params:", {
        reportType,
        format,
        period,
        segment,
        city
      });

      let data;
      let filename;

      // Get data based on report type
      switch (reportType) {
        case "overview":
          data = await this.customerAnalytics.getCustomerOverview({
            period: parseInt(period),
            segment,
            city
          });
          filename = `customer_overview_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case "clv":
          data = await this.customerAnalytics.getCustomerLifetimeValue({
            segment,
            city,
            limit: 1000
          });
          filename = `customer_clv_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case "rfm":
          data = await this.customerAnalytics.getRFMAnalysis({
            period: parseInt(period),
            limit: 1000
          });
          filename = `customer_rfm_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case "behavior":
          data = await this.customerAnalytics.getPurchaseBehavior({
            period: parseInt(period),
            limit: 1000
          });
          filename = `customer_behavior_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case "geographic":
          data = await this.customerAnalytics.getGeographicDistribution({
            limit: 1000
          });
          filename = `customer_geographic_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case "acquisition":
          data = await this.customerAnalytics.getCustomerAcquisition({
            period: parseInt(period),
            groupBy: "month"
          });
          filename = `customer_acquisition_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type"
          });
      }

      if (!data.success) {
        return res.status(500).json({
          success: false,
          message: data.message,
          error: data.error
        });
      }

      // Generate CSV format
      if (format === "csv") {
        const csvData = this.generateCSV(data.data, reportType);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvData);
      } else {
        // JSON format
        res.status(200).json({
          success: true,
          data: data.data,
          reportType,
          exportDate: new Date(),
          filename
        });
      }
    } catch (error) {
      console.error("🎸 Customer Export Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export customer report",
        error: error.message
      });
    }
  }

  // 🎸 Helper method to generate CSV data
  generateCSV(data, reportType) {
    try {
      let csvContent = "";
      let headers = [];
      let rows = [];

      switch (reportType) {
        case "overview":
          if (data.topCustomers && data.topCustomers.length > 0) {
            headers = ["Name", "Email", "Phone", "City", "Total Spent", "Total Orders", "Average Order Value", "Segment", "Loyalty Points"];
            rows = data.topCustomers.map(customer => [
              customer.name || "",
              customer.email || "",
              customer.phone || "",
              customer.city || "",
              customer.totalSpent || 0,
              customer.totalOrders || 0,
              customer.averageOrderValue || 0,
              customer.customerSegment || "",
              customer.loyaltyPoints || 0
            ]);
          }
          break;
        case "clv":
          if (data.clvAnalysis && data.clvAnalysis.length > 0) {
            headers = ["Customer ID", "Name", "Email", "City", "Current CLV", "Total Orders", "Average Order Value", "Segment", "Predicted CLV"];
            rows = data.clvAnalysis.map(customer => [
              customer.customerId || "",
              customer.name || "",
              customer.email || "",
              customer.city || "",
              customer.currentClv || 0,
              customer.totalOrders || 0,
              customer.averageOrderValue || 0,
              customer.customerSegment || "",
              customer.predictedLifetimeValue || 0
            ]);
          }
          break;
        case "rfm":
          if (data.rfmAnalysis && data.rfmAnalysis.length > 0) {
            headers = ["Customer ID", "Name", "Email", "City", "Recency", "Frequency", "Monetary", "RFM Score", "Segment"];
            rows = data.rfmAnalysis.map(customer => [
              customer.customerId || "",
              customer.name || "",
              customer.email || "",
              customer.city || "",
              customer.recency || 0,
              customer.frequency || 0,
              customer.monetary || 0,
              customer.rfmScore || "",
              customer.rfmSegment || ""
            ]);
          }
          break;
        case "behavior":
          if (data.purchasePatterns && data.purchasePatterns.length > 0) {
            headers = ["Customer ID", "Name", "Email", "City", "Total Orders", "Total Products", "Total Spent", "Categories", "Order Frequency"];
            rows = data.purchasePatterns.map(customer => [
              customer.customerId || "",
              customer.customerName || "",
              customer.customerEmail || "",
              customer.customerCity || "",
              customer.totalOrderCount || 0,
              customer.totalProducts || 0,
              customer.totalSpent || 0,
              customer.categoryCount || 0,
              customer.orderFrequency || 0
            ]);
          }
          break;
        case "geographic":
          if (data.geographicData && data.geographicData.length > 0) {
            headers = ["Location", "Customer Count", "Total Spent", "Total Orders", "Average Spent", "Active Customers", "Penetration Rate"];
            rows = data.geographicData.map(location => [
              location.location || "",
              location.customerCount || 0,
              location.totalSpent || 0,
              location.totalOrders || 0,
              location.averageSpent || 0,
              location.activeCustomers || 0,
              location.penetrationRate || 0
            ]);
          }
          break;
        case "acquisition":
          if (data.acquisitionTrends && data.acquisitionTrends.length > 0) {
            headers = ["Period", "New Customers", "Unique Cities", "Growth Rate", "Average Order Value", "Total Value"];
            rows = data.acquisitionTrends.map(trend => [
              JSON.stringify(trend.period) || "",
              trend.newCustomers || 0,
              trend.uniqueCities || 0,
              trend.growthRate || 0,
              trend.averageFirstOrderValue || 0,
              trend.totalFirstOrderValue || 0
            ]);
          }
          break;
        default:
          headers = ["Error"];
          rows = [["Invalid report type"]];
      }

      // Build CSV content
      csvContent = headers.join(",") + "\n";
      rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(",") + "\n";
      });

      return csvContent;
    } catch (error) {
      console.error("🎸 CSV Generation Error:", error);
      return "Error,Message\n\"CSV Generation Failed\",\"" + error.message + "\"";
    }
  }
}

module.exports = new CustomerAnalyticsController(); 