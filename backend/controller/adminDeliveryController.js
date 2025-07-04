const Admin = require("../models/Admin");
const Order = require("../models/Order");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const bcrypt = require("bcryptjs");

// =====================================
// DRIVER MANAGEMENT
// =====================================

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const { status, availability, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = { role: "Driver" };
    
    if (status) {
      query.status = status;
    }
    
    if (availability) {
      query['deliveryInfo.availability'] = availability;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get drivers with stats
    const [drivers, totalCount] = await Promise.all([
      Admin.find(query)
        .select('-password -access_list')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admin.countDocuments(query)
    ]);
    
    // Get active deliveries count for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const activeDeliveries = await Order.countDocuments({
          'deliveryInfo.assignedDriver': driver._id,
          status: { $in: ['Processing', 'Out for Delivery'] }
        });
        
        const todayDeliveries = await Order.countDocuments({
          'deliveryInfo.assignedDriver': driver._id,
          status: 'Delivered',
          'deliveryInfo.deliveredAt': {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        });
        
        return {
          ...driver,
          currentStats: {
            activeDeliveries,
            todayDeliveries,
            isOnDuty: driver.deliveryInfo?.isOnDuty || false,
            availability: driver.deliveryInfo?.availability || 'offline',
            lastLocationUpdate: driver.deliveryInfo?.currentLocation?.lastUpdated
          }
        };
      })
    );
    
    res.json({
      drivers: driversWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalDrivers: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({
      message: "Error retrieving drivers",
      error: error.message
    });
  }
};

// Create new driver
const createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      country,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      emergencyContact,
      workingHours,
      maxDeliveryRadius
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !vehicleType || !vehicleNumber || !licenseNumber) {
      return res.status(400).json({
        message: "Name, email, vehicle type, vehicle number, and license number are required"
      });
    }
    
    // Check if email already exists
    const existingDriver = await Admin.findOne({ email: email.toLowerCase() });
    if (existingDriver) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }
    
    // Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 12) : await bcrypt.hash("12345678", 12);
    
    // Create driver
    const driver = new Admin({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      address,
      city,
      country,
      role: "Driver",
      status: "Active",
      deliveryInfo: {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        phoneNumber: phone,
        emergencyContact: emergencyContact || {},
        workingHours: workingHours || { start: "09:00", end: "18:00" },
        maxDeliveryRadius: maxDeliveryRadius || 10,
        isOnDuty: false,
        availability: "offline"
      },
      deliveryStats: {
        totalDeliveries: 0,
        completedToday: 0,
        averageRating: 5.0,
        totalRatings: 0,
        successRate: 100,
        averageDeliveryTime: 0,
        totalEarnings: 0,
        earningsToday: 0
      }
    });
    
    await driver.save();
    
    console.log(`✅ New driver created: ${driver.name.en} (${driver.email})`);
    
    res.status(201).json({
      message: "Driver created successfully",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        status: driver.status,
        deliveryInfo: driver.deliveryInfo,
        createdAt: driver.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({
      message: "Error creating driver",
      error: error.message
    });
  }
};

// Update driver information
const updateDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const updates = req.body;
    
    const driver = await Admin.findOne({ _id: driverId, role: "Driver" });
    if (!driver) {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'name', 'phone', 'address', 'city', 'country', 'status',
      'deliveryInfo'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'deliveryInfo' && updates[key]) {
          // Merge delivery info updates
          driver.deliveryInfo = { ...driver.deliveryInfo, ...updates[key] };
        } else {
          driver[key] = updates[key];
        }
      }
    });
    
    await driver.save();
    
    console.log(`📝 Driver ${driver.name.en} updated by admin`);
    
    res.json({
      message: "Driver updated successfully",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        deliveryInfo: driver.deliveryInfo,
        updatedAt: driver.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      message: "Error updating driver",
      error: error.message
    });
  }
};

// Delete/deactivate driver
const deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await Admin.findOne({ _id: driverId, role: "Driver" });
    if (!driver) {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Check for active deliveries
    const activeDeliveries = await Order.countDocuments({
      'deliveryInfo.assignedDriver': driverId,
      status: { $in: ['Processing', 'Out for Delivery'] }
    });
    
    if (activeDeliveries > 0) {
      return res.status(400).json({
        message: `Cannot delete driver. They have ${activeDeliveries} active deliveries.`,
        activeDeliveries
      });
    }
    
    // Deactivate instead of delete
    driver.status = "Inactive";
    driver.deliveryInfo.availability = "offline";
    driver.deliveryInfo.isOnDuty = false;
    
    await driver.save();
    
    console.log(`❌ Driver ${driver.name.en} deactivated by admin`);
    
    res.json({
      message: "Driver deactivated successfully"
    });
    
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      message: "Error deleting driver",
      error: error.message
    });
  }
};

// =====================================
// ORDER ASSIGNMENT MANAGEMENT
// =====================================

// Get pending orders (not assigned to any driver)
const getPendingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [pendingOrders, totalCount] = await Promise.all([
      Order.find({
        status: 'Pending',
        $or: [
          { 'deliveryInfo.assignedDriver': { $exists: false } },
          { 'deliveryInfo.assignedDriver': null }
        ]
      })
        .populate('user', 'name email phone')
        .sort({ createdAt: 1 }) // Oldest first for FIFO
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments({
        status: 'Pending',
        $or: [
          { 'deliveryInfo.assignedDriver': { $exists: false } },
          { 'deliveryInfo.assignedDriver': null }
        ]
      })
    ]);
    
    const formattedOrders = pendingOrders.map(order => ({
      _id: order._id,
      invoice: order.invoice,
      customer: {
        name: order.user_info?.name,
        contact: order.user_info?.contact,
        address: order.user_info?.address,
        city: order.user_info?.city,
        deliveryLocation: order.user_info?.deliveryLocation
      },
      orderSummary: {
        itemCount: order.cart?.length || 0,
        total: order.total,
        paymentMethod: order.paymentMethod
      },
      createdAt: order.createdAt,
      priority: order.priority || 'medium'
    }));
    
    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalOrders: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({
      message: "Error retrieving pending orders",
      error: error.message
    });
  }
};

// Assign order to driver
const assignOrderToDriver = async (req, res) => {
  try {
    const { orderId, driverId, priority, estimatedDeliveryTime } = req.body;
    
    if (!orderId || !driverId) {
      return res.status(400).json({
        message: "Order ID and Driver ID are required"
      });
    }
    
    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    if (order.status !== 'Pending') {
      return res.status(400).json({
        message: `Cannot assign order. Order status is ${order.status}`
      });
    }
    
    if (order.deliveryInfo?.assignedDriver) {
      return res.status(400).json({
        message: "Order is already assigned to another driver"
      });
    }
    
    // Validate driver
    const driver = await Admin.findOne({ _id: driverId, role: "Driver", status: "Active" });
    if (!driver) {
      return res.status(404).json({
        message: "Driver not found or inactive"
      });
    }
    
    if (!driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        message: "Driver is not currently on duty"
      });
    }
    
    // Fix cart image fields before processing
    if (order.cart && Array.isArray(order.cart)) {
      order.cart = order.cart.map(item => {
        if (item.image && Array.isArray(item.image)) {
          return {
            ...item,
            image: item.image.length > 0 ? item.image[0] : ''
          };
        }
        return item;
      });
    }
    
    // Assign order
    order.status = 'Processing';
    order.deliveryInfo = {
      ...order.deliveryInfo,
      assignedDriver: driverId,
      assignedAt: new Date(),
      assignedBy: req.user._id,
      priority: priority || 'medium'
    };
    
    if (estimatedDeliveryTime) {
      order.deliveryInfo.estimatedDeliveryTime = estimatedDeliveryTime;
    }
    
    // Generate product checklist if not exists
    if (!order.deliveryInfo.productChecklist || order.deliveryInfo.productChecklist.length === 0) {
      const VerificationCodeGenerator = require("../lib/verification-code/generator");
      order.deliveryInfo.productChecklist = VerificationCodeGenerator.generateProductChecklist(order.cart);
    }
    
    await order.save();
    
    // Update driver availability
    driver.deliveryInfo.availability = 'busy';
    await driver.save();
    
    console.log(`📦 Order ${order.invoice} assigned to driver ${driver.name.en} by admin`);
    
    res.json({
      message: "Order assigned successfully",
      assignment: {
        orderId: order._id,
        invoice: order.invoice,
        driverId: driver._id,
        driverName: driver.name,
        assignedAt: order.deliveryInfo.assignedAt,
        priority: order.deliveryInfo.priority
      }
    });
    
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({
      message: "Error assigning order",
      error: error.message
    });
  }
};

// Reassign order to different driver
const reassignOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newDriverId, reason } = req.body;
    
    if (!newDriverId) {
      return res.status(400).json({
        message: "New driver ID is required"
      });
    }
    
    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    if (!order.deliveryInfo?.assignedDriver) {
      return res.status(400).json({
        message: "Order is not currently assigned to any driver"
      });
    }
    
    if (order.status === 'Delivered') {
      return res.status(400).json({
        message: "Cannot reassign delivered order"
      });
    }
    
    // Validate new driver
    const newDriver = await Admin.findOne({ _id: newDriverId, role: "Driver", status: "Active" });
    if (!newDriver) {
      return res.status(404).json({
        message: "New driver not found or inactive"
      });
    }
    
    if (!newDriver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        message: "New driver is not currently on duty"
      });
    }
    
    // Get old driver
    const oldDriver = await Admin.findById(order.deliveryInfo.assignedDriver);
    
    // Update order assignment
    const oldDriverId = order.deliveryInfo.assignedDriver;
    order.deliveryInfo.assignedDriver = newDriverId;
    order.deliveryInfo.reassignedAt = new Date();
    order.deliveryInfo.reassignedBy = req.user._id;
    order.deliveryInfo.reassignmentReason = reason || 'Admin reassignment';
    
    // Reset delivery progress if order was in progress
    if (order.status === 'Out for Delivery') {
      order.status = 'Processing';
      order.deliveryInfo.outForDeliveryAt = null;
    }
    
    await order.save();
    
    // Update driver availabilities
    if (oldDriver) {
      oldDriver.deliveryInfo.availability = 'available';
      await oldDriver.save();
    }
    
    newDriver.deliveryInfo.availability = 'busy';
    await newDriver.save();
    
    console.log(`🔄 Order ${order.invoice} reassigned from ${oldDriver?.name?.en || 'Unknown'} to ${newDriver.name.en}`);
    
    res.json({
      message: "Order reassigned successfully",
      reassignment: {
        orderId: order._id,
        invoice: order.invoice,
        oldDriverId,
        oldDriverName: oldDriver?.name,
        newDriverId: newDriver._id,
        newDriverName: newDriver.name,
        reassignedAt: order.deliveryInfo.reassignedAt,
        reason: reason
      }
    });
    
  } catch (error) {
    console.error('Reassign order error:', error);
    res.status(500).json({
      message: "Error reassigning order",
      error: error.message
    });
  }
};

// =====================================
// DELIVERY MONITORING & ANALYTICS
// =====================================

// Get delivery dashboard stats
const getDeliveryDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Parallel queries for dashboard statistics
    const [
      totalDrivers,
      activeDrivers,
      onDutyDrivers,
      pendingOrders,
      processingOrders,
      outForDeliveryOrders,
      deliveredTodayOrders,
      failedDeliveries,
      avgDeliveryTime,
      topDrivers
    ] = await Promise.all([
      Admin.countDocuments({ role: "Driver", status: "Active" }),
      
      Admin.countDocuments({ 
        role: "Driver", 
        status: "Active",
        'deliveryInfo.availability': { $in: ['available', 'busy'] }
      }),
      
      Admin.countDocuments({ 
        role: "Driver", 
        'deliveryInfo.isOnDuty': true 
      }),
      
      Order.countDocuments({ 
        status: 'Pending',
        $or: [
          { 'deliveryInfo.assignedDriver': { $exists: false } },
          { 'deliveryInfo.assignedDriver': null }
        ]
      }),
      
      Order.countDocuments({ status: 'Processing' }),
      
      Order.countDocuments({ status: 'Out for Delivery' }),
      
      Order.countDocuments({ 
        status: 'Delivered',
        'deliveryInfo.deliveredAt': { $gte: startOfDay }
      }),
      
      Order.countDocuments({ 
        status: 'Cancel',
        cancelReason: { $regex: /delivery failed/i },
        cancelledAt: { $gte: startOfDay }
      }),
      
      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            'deliveryInfo.deliveredAt': { $gte: startOfMonth },
            'deliveryInfo.assignedAt': { $exists: true },
            'deliveryInfo.deliveredAt': { $exists: true }
          }
        },
        {
          $project: {
            deliveryTime: {
              $divide: [
                { $subtract: ['$deliveryInfo.deliveredAt', '$deliveryInfo.assignedAt'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$deliveryTime' }
          }
        }
      ]),
      
      Admin.aggregate([
        {
          $match: { role: "Driver", status: "Active" }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'deliveryInfo.assignedDriver',
            as: 'deliveries'
          }
        },
        {
          $project: {
            name: 1,
            deliveryStats: 1,
            todayDeliveries: {
              $size: {
                $filter: {
                  input: '$deliveries',
                  cond: {
                    $and: [
                      { $eq: ['$$this.status', 'Delivered'] },
                      { $gte: ['$$this.deliveryInfo.deliveredAt', startOfDay] }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $sort: { todayDeliveries: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);
    
    const averageDeliveryTime = avgDeliveryTime[0]?.avgTime || 0;
    
    res.json({
      overview: {
        totalDrivers,
        activeDrivers,
        onDutyDrivers,
        driverUtilization: totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0
      },
      
      orders: {
        pending: pendingOrders,
        processing: processingOrders,
        outForDelivery: outForDeliveryOrders,
        deliveredToday: deliveredTodayOrders,
        failedToday: failedDeliveries,
        totalActive: pendingOrders + processingOrders + outForDeliveryOrders
      },
      
      performance: {
        averageDeliveryTime: Math.round(averageDeliveryTime),
        successRate: deliveredTodayOrders + failedDeliveries > 0 ? 
          Math.round((deliveredTodayOrders / (deliveredTodayOrders + failedDeliveries)) * 100) : 100,
        deliveryEfficiency: Math.round((deliveredTodayOrders / Math.max(activeDrivers, 1)) * 100) / 100
      },
      
      topDrivers: topDrivers.map(driver => ({
        _id: driver._id,
        name: driver.name,
        todayDeliveries: driver.todayDeliveries,
        totalDeliveries: driver.deliveryStats?.totalDeliveries || 0,
        averageRating: driver.deliveryStats?.averageRating || 5.0
      }))
    });
    
  } catch (error) {
    console.error('Get delivery dashboard error:', error);
    res.status(500).json({
      message: "Error retrieving delivery dashboard",
      error: error.message
    });
  }
};

// Get available drivers for assignment
const getAvailableDrivers = async (req, res) => {
  try {
    const { orderLocation } = req.query;
    
    const availableDrivers = await Admin.find({
      role: "Driver",
      status: "Active",
      'deliveryInfo.isOnDuty': true,
      'deliveryInfo.availability': 'available'
    }).select('name email phone deliveryInfo deliveryStats');
    
    // Calculate distance from order location if provided
    let driversWithDistance = availableDrivers;
    
    if (orderLocation) {
      const { latitude, longitude } = JSON.parse(orderLocation);
      
      driversWithDistance = availableDrivers.map(driver => {
        let distance = null;
        
        if (driver.deliveryInfo?.currentLocation?.latitude &&
            driver.deliveryInfo?.currentLocation?.longitude) {
          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = (latitude - driver.deliveryInfo.currentLocation.latitude) * Math.PI / 180;
          const dLon = (longitude - driver.deliveryInfo.currentLocation.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(driver.deliveryInfo.currentLocation.latitude * Math.PI / 180) * 
                    Math.cos(latitude * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }
        
        return {
          ...driver.toObject(),
          estimatedDistance: distance ? `${distance.toFixed(2)} km` : 'Unknown'
        };
      });
      
      // Sort by distance if available
      driversWithDistance.sort((a, b) => {
        if (a.estimatedDistance === 'Unknown') return 1;
        if (b.estimatedDistance === 'Unknown') return -1;
        return parseFloat(a.estimatedDistance) - parseFloat(b.estimatedDistance);
      });
    }
    
    res.json({
      drivers: driversWithDistance.map(driver => ({
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleInfo: {
          type: driver.deliveryInfo?.vehicleType,
          number: driver.deliveryInfo?.vehicleNumber,
        },
        stats: {
          totalDeliveries: driver.deliveryStats?.totalDeliveries || 0,
          averageRating: driver.deliveryStats?.averageRating || 5.0,
          successRate: driver.deliveryStats?.successRate || 100
        },
        location: {
          current: driver.deliveryInfo?.currentLocation,
          maxRadius: driver.deliveryInfo?.maxDeliveryRadius || 10
        },
        estimatedDistance: driver.estimatedDistance || null
      }))
    });
    
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({
      message: "Error retrieving available drivers",
      error: error.message
    });
  }
};

// =====================================
// AUTO-ASSIGNMENT & SETTINGS
// =====================================

// Auto-assign pending orders to available drivers
const autoAssignPendingOrders = async (req, res) => {
  try {
    // Get pending orders
    const pendingOrders = await Order.find({
      status: 'Pending',
      $or: [
        { 'deliveryInfo.assignedDriver': { $exists: false } },
        { 'deliveryInfo.assignedDriver': null }
      ]
    }).sort({ createdAt: 1 }); // Oldest first

    // Get available drivers
    const availableDrivers = await Admin.find({
      role: "Driver",
      status: "Active",
      'deliveryInfo.isOnDuty': true,
      'deliveryInfo.availability': 'available'
    });

    if (availableDrivers.length === 0) {
      return res.status(400).json({
        message: "No available drivers for auto-assignment"
      });
    }

    let assignedCount = 0;
    let driverIndex = 0;

    // Round-robin assignment
    for (const order of pendingOrders) {
      const driver = availableDrivers[driverIndex % availableDrivers.length];
      
      // Fix cart image fields before processing
      if (order.cart && Array.isArray(order.cart)) {
        order.cart = order.cart.map(item => {
          if (item.image && Array.isArray(item.image)) {
            return {
              ...item,
              image: item.image.length > 0 ? item.image[0] : ''
            };
          }
          return item;
        });
      }
      
      // Assign order
      order.status = 'Processing';
      order.deliveryInfo = {
        ...order.deliveryInfo,
        assignedDriver: driver._id,
        assignedAt: new Date(),
        assignedBy: req.user._id,
        priority: 'medium'
      };

      // Generate product checklist if not exists
      if (!order.deliveryInfo.productChecklist || order.deliveryInfo.productChecklist.length === 0) {
        const VerificationCodeGenerator = require("../lib/verification-code/generator");
        order.deliveryInfo.productChecklist = VerificationCodeGenerator.generateProductChecklist(order.cart);
      }

      await order.save();

      // Update driver availability
      driver.deliveryInfo.availability = 'busy';
      await driver.save();

      assignedCount++;
      driverIndex++;
      
      console.log(`📦 Auto-assigned order ${order.invoice} to driver ${driver.name.en}`);
    }

    res.json({
      message: `Successfully auto-assigned ${assignedCount} orders`,
      assignedOrders: assignedCount,
      availableDrivers: availableDrivers.length
    });

  } catch (error) {
    console.error('Auto-assign orders error:', error);
    res.status(500).json({
      message: "Error auto-assigning orders",
      error: error.message
    });
  }
};

// Get delivery settings
const getDeliverySettings = async (req, res) => {
  try {
    console.log('📖 GET DELIVERY SETTINGS CALLED');
    const Setting = require('../models/Setting');
    
    // Try to get existing delivery settings from database
    let deliverySettings = await Setting.findOne({ name: "deliverySettings" });
    console.log('Found settings in DB:', !!deliverySettings);
    
    // Default settings if none exist
    const defaultSettings = {
      autoAssignEnabled: false,
      maxOrdersPerDriver: 5,
      deliveryRadius: 10, // km
      workingHours: {
        start: "09:00",
        end: "21:00"
      },
      prioritySettings: {
        urgent: { maxWaitTime: 15 }, // minutes
        high: { maxWaitTime: 30 },
        medium: { maxWaitTime: 60 },
        low: { maxWaitTime: 120 }
      }
    };

    const settings = deliverySettings ? deliverySettings.setting : defaultSettings;
    console.log('Returning settings:', JSON.stringify(settings, null, 2));

    res.json({
      settings
    });

  } catch (error) {
    console.error('❌ Get delivery settings error:', error);
    res.status(500).json({
      message: "Error retrieving delivery settings",
      error: error.message
    });
  }
};

// Update delivery settings
const updateDeliverySettings = async (req, res) => {
  try {
    console.log('🔥 UPDATE DELIVERY SETTINGS CALLED');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user._id : 'NO USER');
    
    const Setting = require('../models/Setting');
    const { autoAssignEnabled, maxOrdersPerDriver, deliveryRadius, workingHours, prioritySettings } = req.body;
    
    // Prepare updated settings
    const updatedSettings = {
      autoAssignEnabled: autoAssignEnabled !== undefined ? autoAssignEnabled : false,
      maxOrdersPerDriver: maxOrdersPerDriver || 5,
      deliveryRadius: deliveryRadius || 10,
      workingHours: workingHours || { start: "09:00", end: "21:00" },
      prioritySettings: prioritySettings || {
        urgent: { maxWaitTime: 15 },
        high: { maxWaitTime: 30 },
        medium: { maxWaitTime: 60 },
        low: { maxWaitTime: 120 }
      }
    };

    console.log('Prepared settings:', JSON.stringify(updatedSettings, null, 2));

    // Find existing delivery settings or create new one
    let deliverySettings = await Setting.findOne({ name: "deliverySettings" });
    console.log('Found existing settings:', !!deliverySettings);
    
    if (deliverySettings) {
      // Update existing settings
      deliverySettings.setting = updatedSettings;
      await deliverySettings.save();
      console.log('✅ Updated existing settings');
    } else {
      // Create new settings document
      deliverySettings = new Setting({
        name: "deliverySettings",
        setting: updatedSettings
      });
      await deliverySettings.save();
      console.log('✅ Created new settings document');
    }

    console.log(`⚙️ Delivery settings updated and saved by admin ${req.user ? req.user._id : 'UNKNOWN'}`);

    res.json({
      message: "Delivery settings updated successfully",
      settings: updatedSettings
    });

  } catch (error) {
    console.error('❌ Update delivery settings error:', error);
    res.status(500).json({
      message: "Error updating delivery settings",
      error: error.message
    });
  }
};

// Get live tracking data for active deliveries
const getLiveTracking = async (req, res) => {
  try {
    // Get all active deliveries (Processing and Out for Delivery)
    const activeDeliveries = await Order.find({
      status: { $in: ['Processing', 'Out for Delivery'] },
      'deliveryInfo.assignedDriver': { $exists: true, $ne: null }
    })
    .populate('deliveryInfo.assignedDriver', 'name phone deliveryInfo')
    .populate('user', 'name phone address')
    .select('invoice status customer deliveryInfo orderSummary createdAt')
    .sort({ 'deliveryInfo.assignedAt': -1 })
    .lean();

    // Format the response with driver location and delivery details
    const trackingData = activeDeliveries.map(order => {
      const driver = order.deliveryInfo.assignedDriver;
      
      return {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        customer: {
          name: order.customer?.name || order.user?.name || 'Unknown Customer',
          phone: order.customer?.phone || order.user?.phone || 'N/A',
          address: order.customer?.address || order.user?.address || 'N/A'
        },
        driver: {
          _id: driver._id,
          name: driver.name?.en || driver.name || 'Unknown Driver',
          phone: driver.phone || 'N/A',
          vehicleType: driver.deliveryInfo?.vehicleType || 'N/A',
          vehicleNumber: driver.deliveryInfo?.vehicleNumber || 'N/A',
          currentLocation: driver.deliveryInfo?.currentLocation || null,
          lastLocationUpdate: driver.deliveryInfo?.currentLocation?.lastUpdated || null
        },
        deliveryInfo: {
          assignedAt: order.deliveryInfo.assignedAt,
          outForDeliveryAt: order.deliveryInfo.outForDeliveryAt,
          estimatedDeliveryTime: order.deliveryInfo.estimatedDeliveryTime,
          priority: order.deliveryInfo.priority || 'medium',
          deliveryNotes: order.deliveryInfo.deliveryNotes || ''
        },
        orderSummary: {
          total: order.orderSummary?.total || 0,
          itemCount: order.orderSummary?.itemCount || 0
        },
        createdAt: order.createdAt
      };
    });

    res.json({
      deliveries: trackingData,
      summary: {
        totalActive: trackingData.length,
        processing: trackingData.filter(d => d.status === 'Processing').length,
        outForDelivery: trackingData.filter(d => d.status === 'Out for Delivery').length,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get live tracking error:', error);
    res.status(500).json({
      message: "Error retrieving live tracking data",
      error: error.message
    });
  }
};

module.exports = {
  // Driver Management
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  
  // Order Assignment
  getPendingOrders,
  assignOrderToDriver,
  reassignOrder,
  
  // Analytics & Monitoring
  getDeliveryDashboard,
  getAvailableDrivers,
  
  // Auto-assignment & Settings
  autoAssignPendingOrders,
  getDeliverySettings,
  updateDeliverySettings,
  
  // Live Tracking
  getLiveTracking
}; 