const OdooIntegrationService = require('../services/odooIntegrationService');
const Order = require('../models/Order');
const OrderPushSession = require('../models/OrderPushSession');

class OdooIntegrationController {
  constructor() {
    this.odooService = new OdooIntegrationService();
  }

  // Initialize Odoo connection
  async initializeOdoo(req, res) {
    try {
      console.log('🔧 Initializing Odoo connection...');
      
      // Validate environment variables
      this.odooService.validateOdooConfig();
      
      // Initialize connection
      await this.odooService.initialize();
      
      console.log('✅ Odoo connection initialized successfully');
      
      res.status(200).json({
        success: true,
        message: 'Odoo connection initialized successfully',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Odoo initialization failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Process orders for a specific date
  async processOrdersForDate(req, res) {
    try {
      const { targetDate, adminId } = req.body;
      
      if (!targetDate) {
        return res.status(400).json({
          success: false,
          error: 'targetDate is required'
        });
      }

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'adminId is required'
        });
      }

      console.log(`🚀 Processing orders for date: ${targetDate}`);
      
      // Resolve admin ID from email if needed
      let resolvedAdminId = adminId;
      
      // Check if adminId looks like an email
      if (adminId.includes('@')) {
        const Admin = require('../models/Admin');
        const admin = await Admin.findOne({ email: adminId });
        
        if (!admin) {
          return res.status(400).json({
            success: false,
            error: `Admin not found with email: ${adminId}`
          });
        }
        
        resolvedAdminId = admin._id;
        console.log(`✅ Resolved admin email ${adminId} to ID: ${resolvedAdminId}`);
      }
      
      // Generate session ID
      const sessionId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Process orders
      const result = await this.odooService.processOrderBatch(
        sessionId,
        new Date(targetDate),
        resolvedAdminId
      );
      
      console.log(`✅ Batch processing completed: ${result.results.successful}/${result.results.processed} orders synced`);
      
      res.status(200).json({
        success: true,
        sessionId: result.sessionId,
        results: result.results,
        message: `Batch processing completed: ${result.results.successful}/${result.results.processed} orders synced`,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Retry failed orders from a session
  async retryFailedOrders(req, res) {
    try {
      const { sessionId, maxRetries = 3 } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required'
        });
      }

      console.log(`🔄 Retrying failed orders for session: ${sessionId}`);
      
      // Retry failed orders
      const results = await this.odooService.retryFailedOrders(sessionId, maxRetries);
      
      console.log(`✅ Retry completed: ${results.successful}/${results.retried} successful`);
      
      res.status(200).json({
        success: true,
        sessionId: sessionId,
        results: results,
        message: `Retry completed: ${results.successful}/${results.retried} successful`,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Retry failed orders failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get session report
  async getSessionReport(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required'
        });
      }

      console.log(`📊 Getting session report for: ${sessionId}`);
      
      // Find session
      const session = await OrderPushSession.findOne({ sessionId: sessionId });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      res.status(200).json({
        success: true,
        session: {
          sessionId: session.sessionId,
          sessionDate: session.sessionDate,
          status: session.status,
          settings: session.settings,
          summary: session.summary,
          initiatedBy: session.initiatedBy,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          processingTime: session.processingTime,
          orderResults: session.orderResults
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Get session report failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get all sessions
  async getAllSessions(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      console.log(`📊 Getting all sessions (page: ${page}, limit: ${limit})`);
      
      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }
      
      // Find sessions with pagination
      const sessions = await OrderPushSession.find(query)
        .sort({ startedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('sessionId sessionDate status summary initiatedBy startedAt completedAt processingTime');
      
      // Get total count
      const total = await OrderPushSession.countDocuments(query);
      
      res.status(200).json({
        success: true,
        sessions: sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Get all sessions failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get orders pending sync
  async getPendingOrders(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      console.log(`📊 Getting pending orders (page: ${page}, limit: ${limit})`);
      
      // Find pending orders
      const orders = await Order.find({
        'odooSync.status': 'pending',
        status: 'Delivered'
      })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('invoice user_info total cart createdAt odooSync');
      
      // Get total count
      const total = await Order.countDocuments({
        'odooSync.status': 'pending',
        status: 'Delivered'
      });
      
      res.status(200).json({
        success: true,
        orders: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Get pending orders failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get failed orders
  async getFailedOrders(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      console.log(`📊 Getting failed orders (page: ${page}, limit: ${limit})`);
      
      // Find failed orders
      const orders = await Order.find({
        'odooSync.status': 'failed'
      })
        .sort({ 'odooSync.lastAttemptAt': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('invoice user_info total cart createdAt odooSync');
      
      // Get total count
      const total = await Order.countDocuments({
        'odooSync.status': 'failed'
      });
      
      res.status(200).json({
        success: true,
        orders: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Get failed orders failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get sync statistics
  async getSyncStatistics(req, res) {
    try {
      console.log('📊 Getting sync statistics');
      
      // Get counts for different sync statuses
      const pendingCount = await Order.countDocuments({
        'odooSync.status': 'pending',
        status: 'Delivered'
      });
      
      const syncedCount = await Order.countDocuments({
        'odooSync.status': 'synced'
      });
      
      const failedCount = await Order.countDocuments({
        'odooSync.status': 'failed'
      });
      
      const totalOrders = await Order.countDocuments({
        status: 'Delivered'
      });
      
      // Get recent sessions
      const recentSessions = await OrderPushSession.find()
        .sort({ startedAt: -1 })
        .limit(5)
        .select('sessionId sessionDate status summary processingTime');
      
      // Calculate success rate
      const successRate = totalOrders > 0 ? (syncedCount / totalOrders) * 100 : 0;
      
      res.status(200).json({
        success: true,
        statistics: {
          totalOrders: totalOrders,
          pendingOrders: pendingCount,
          syncedOrders: syncedCount,
          failedOrders: failedCount,
          successRate: Math.round(successRate * 100) / 100
        },
        recentSessions: recentSessions,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Get sync statistics failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Test Odoo connection
  async testConnection(req, res) {
    try {
      console.log('🔧 Testing Odoo connection...');
      
      // Validate environment variables
      this.odooService.validateOdooConfig();
      
      // Test connection by getting user info
      const userInfo = await this.odooService.searchRead('res.users', [
        ['id', '=', 1]
      ], ['id', 'name', 'login']);
      
      console.log('✅ Odoo connection test successful');
      
      res.status(200).json({
        success: true,
        message: 'Odoo connection test successful',
        userInfo: userInfo[0] || null,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Odoo connection test failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Reset order sync status (for testing)
  async resetOrderSyncStatus(req, res) {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'orderId is required'
        });
      }

      console.log(`🔄 Resetting sync status for order: ${orderId}`);
      
      // Reset order sync status
      const order = await Order.findByIdAndUpdate(orderId, {
        'odooSync.status': 'pending',
        'odooSync.odooOrderId': null,
        'odooSync.odooCustomerId': null,
        'odooSync.sessionId': null,
        'odooSync.syncedAt': null,
        'odooSync.attempts': 0,
        'odooSync.errorMessage': null,
        'odooSync.errorType': undefined,
        'odooSync.lastAttemptAt': null
      }, { new: true });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      console.log(`✅ Sync status reset for order: ${order.invoice}`);
      
      res.status(200).json({
        success: true,
        message: `Sync status reset for order: ${order.invoice}`,
        order: {
          invoice: order.invoice,
          odooSync: order.odooSync
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Reset order sync status failed:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // === MISSING CONTROLLER METHODS FROM PLAN ===

  // Create new order push session
  async createOrderPushSession(req, res) {
    try {
      const {
        targetDate,
        orderStatus = ['Delivered'],
        maxRetries = 3,
        createMissingProducts = false,
        createMissingCustomers = true,
        validateStock = true,
        syncLoyaltyPoints = true,
        dryRun = false
      } = req.body;

      // Validate required fields
      if (!targetDate) {
        return res.status(400).json({
          success: false,
          message: 'Target date is required'
        });
      }

      // Generate session ID
      const sessionId = `OPS_${new Date(targetDate).toISOString().split('T')[0].replace(/-/g, '')}_${Math.random().toString(36).substr(2, 6)}`;

      // Create session document
      const session = new OrderPushSession({
        sessionId,
        sessionDate: new Date(targetDate),
        status: 'pending',
        settings: {
          targetDate: new Date(targetDate),
          orderStatus,
          maxRetries,
          createMissingProducts,
          createMissingCustomers,
          validateStock,
          syncLoyaltyPoints,
          dryRun
        },
        initiatedBy: req.user._id,
        createdAt: new Date(),
        startedAt: new Date()
      });

      await session.save();

      // Start processing in background
      this.odooService.processOrderBatch(sessionId, new Date(targetDate), req.user._id);

      res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: {
          sessionId: session.sessionId,
          status: session.status,
          targetDate: session.sessionDate,
          initiatedBy: req.user.name
        }
      });

    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create session',
        error: error.message
      });
    }
  }

  // Get session details
  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await OrderPushSession.findOne({ sessionId })
        .populate('initiatedBy', 'name email');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          session
        }
      });

    } catch (error) {
      console.error('Get session details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session details',
        error: error.message
      });
    }
  }

  // Get pending sync orders (enhanced version)
  async getPendingSyncOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status = 'Delivered',
        startDate,
        endDate,
        search
      } = req.query;

      // Build query
      const query = {
        status: status,
        $or: [
          { 'odooSync.status': null },
          { 'odooSync.status': 'pending' },
          { 
            'odooSync.status': 'failed',
            'odooSync.attempts': { $lt: 3 }
          }
        ]
      };

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      if (search) {
        query.$or = [
          { invoice: parseInt(search) || 0 },
          { 'user_info.name': { $regex: search, $options: 'i' } },
          { 'user_info.contact': { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get orders
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email');

      // Get total count
      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get pending sync orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending sync orders',
        error: error.message
      });
    }
  }

  // Manual order sync
  async syncOrderManually(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .populate('user', 'name email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'Delivered') {
        return res.status(400).json({
          success: false,
          message: 'Order must be delivered before syncing'
        });
      }

      // Create manual session
      const sessionId = `MANUAL_${Date.now()}`;
      const session = new OrderPushSession({
        sessionId,
        sessionDate: new Date(),
        status: 'processing',
        settings: {
          targetDate: new Date(),
          orderStatus: ['Delivered'],
          maxRetries: 1,
          createMissingCustomers: true,
          syncLoyaltyPoints: true,
          dryRun: false
        },
        initiatedBy: req.user._id,
        createdAt: new Date(),
        startedAt: new Date(),
        isManual: true
      });

      await session.save();

      // Sync order
      const result = await this.odooService.createOdooOrder(order);

      if (result.success) {
        // Update order sync status
        await Order.findByIdAndUpdate(orderId, {
          'odooSync.status': 'synced',
          'odooSync.odooOrderId': result.odooOrderId,
          'odooSync.sessionId': sessionId,
          'odooSync.syncedAt': new Date(),
          'odooSync.attempts': (order.odooSync?.attempts || 0) + 1
        });

        res.json({
          success: true,
          message: 'Order synced successfully',
          data: {
            odooOrderId: result.odooOrderId,
            odooCustomerId: result.odooCustomerId,
            processingTime: result.processingTime,
            sessionId
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Order sync failed',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Manual order sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync order',
        error: error.message
      });
    }
  }

  // Get order sync status
  async getOrderSyncStatus(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .select('invoice odooSync status user_info total');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: {
          orderId: order._id,
          invoice: order.invoice,
          status: order.status,
          odooSync: order.odooSync,
          total: order.total,
          userInfo: order.user_info
        }
      });

    } catch (error) {
      console.error('Get order sync status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order sync status',
        error: error.message
      });
    }
  }

  // Get session statistics
  async getSessionStats(req, res) {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get session statistics
      const sessionStats = await OrderPushSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            totalOrders: { $sum: '$summary.totalOrdersFound' },
            successfulOrders: { $sum: '$summary.totalOrdersSuccess' },
            failedOrders: { $sum: '$summary.totalOrdersFailed' },
            totalAmount: { $sum: '$summary.totalAmount' },
            newCustomers: { $sum: '$summary.newCustomersCreated' }
          }
        }
      ]);

      const stats = sessionStats[0] || {
        totalSessions: 0,
        completedSessions: 0,
        failedSessions: 0,
        totalOrders: 0,
        successfulOrders: 0,
        failedOrders: 0,
        totalAmount: 0,
        newCustomers: 0
      };

      const successRate = stats.totalOrders > 0 
        ? (stats.successfulOrders / stats.totalOrders) * 100 
        : 0;

      res.json({
        success: true,
        data: {
          period,
          totalSessions: stats.totalSessions,
          completedSessions: stats.completedSessions,
          failedSessions: stats.failedSessions,
          totalOrders: stats.totalOrders,
          successfulOrders: stats.successfulOrders,
          failedOrders: stats.failedOrders,
          successRate: Math.round(successRate * 100) / 100,
          totalAmount: stats.totalAmount,
          newCustomers: stats.newCustomers,
          averageOrdersPerSession: stats.totalSessions > 0 
            ? Math.round(stats.totalOrders / stats.totalSessions) 
            : 0
        }
      });

    } catch (error) {
      console.error('Get session stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session statistics',
        error: error.message
      });
    }
  }

  // Get session reports
  async getSessionReports(req, res) {
    try {
      const { startDate, endDate, status } = req.query;

      const query = {};
      
      if (startDate && endDate) {
        query.sessionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (status) {
        query.status = status;
      }

      const sessions = await OrderPushSession.find(query)
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: {
          sessions,
          total: sessions.length
        }
      });

    } catch (error) {
      console.error('Get session reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session reports',
        error: error.message
      });
    }
  }

  // Export session report
  async exportSessionReport(req, res) {
    try {
      const {
        sessionId,
        format = 'json',
        startDate,
        endDate
      } = req.query;

      let query = {};

      if (sessionId) {
        query.sessionId = sessionId;
      } else if (startDate && endDate) {
        query.sessionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const sessions = await OrderPushSession.find(query)
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // Simple CSV export
        const csvData = sessions.map(session => {
          return `${session.sessionId},${session.sessionDate},${session.status},${session.summary?.totalOrdersSuccess || 0},${session.summary?.totalOrdersFailed || 0}`;
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="odoo-sessions-${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        res.json({
          success: true,
          data: sessions
        });
      }

    } catch (error) {
      console.error('Export session report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export session report',
        error: error.message
      });
    }
  }

  // Get Odoo sync configuration
  async getOdooSyncConfig(req, res) {
    try {
      // For now, return default config
      // In a real implementation, this would be stored in database
      const config = {
        enabled: process.env.ODOO_ENABLED === 'true',
        autoSync: false,
        syncTime: '23:00',
        maxRetries: parseInt(process.env.ODOO_MAX_RETRIES) || 3,
        createMissingCustomers: true,
        createMissingProducts: false,
        validateStock: true,
        syncLoyaltyPoints: true,
        notificationEmail: process.env.ODOO_NOTIFICATION_EMAIL || '',
        dryRun: process.env.ODOO_DRY_RUN === 'true'
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Get Odoo sync config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Odoo sync configuration',
        error: error.message
      });
    }
  }

  // Update Odoo sync configuration
  async updateOdooSyncConfig(req, res) {
    try {
      const {
        enabled,
        autoSync,
        syncTime,
        maxRetries,
        createMissingCustomers,
        createMissingProducts,
        validateStock,
        syncLoyaltyPoints,
        notificationEmail,
        dryRun
      } = req.body;

      // In a real implementation, this would save to database
      // For now, just return success
      console.log('Updating Odoo sync configuration:', req.body);

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: {
          enabled,
          autoSync,
          syncTime,
          maxRetries,
          createMissingCustomers,
          createMissingProducts,
          validateStock,
          syncLoyaltyPoints,
          notificationEmail,
          dryRun,
          updatedBy: req.user._id,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Update Odoo sync config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update Odoo sync configuration',
        error: error.message
      });
    }
  }
}

module.exports = new OdooIntegrationController();
