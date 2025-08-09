const Admin = require("../models/Admin");
const Order = require("../models/Order");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const { signInToken } = require("../config/auth");
const bcrypt = require("bcryptjs");

// =====================================
// AUTHENTICATION & PROFILE MANAGEMENT
// =====================================

// Driver login
const deliveryLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }
    
    // Find driver in Admin collection
    const driver = await Admin.findOne({ 
      email: email.toLowerCase(),
      role: "Driver",
      status: "Active"
    });
    
    if (!driver) {
      return res.status(401).json({
        message: "Invalid credentials or account not found"
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, driver.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }
    
    // Generate JWT token
    const token = signInToken(driver);
    
    console.log(`✅ Driver ${driver.name.en} logged in successfully`);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        image: driver.image,
        role: driver.role,
        deliveryInfo: driver.deliveryInfo,
        deliveryStats: driver.deliveryStats
      }
    });
    
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
};

// Get driver profile
const getDeliveryProfile = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Get recent delivery stats
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayDeliveries = await Order.countDocuments({
      'deliveryInfo.assignedDriver': driverId,
      status: 'Delivered',
      'deliveryInfo.deliveredAt': { $gte: startOfDay }
    });
    
    const activeDeliveries = await Order.countDocuments({
      'deliveryInfo.assignedDriver': driverId,
      status: { $in: ['Processing', 'Out for Delivery'] }
    });
    
    res.json({
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        image: driver.image,
        address: driver.address,
        city: driver.city,
        country: driver.country,
        deliveryInfo: driver.deliveryInfo,
        deliveryStats: {
          ...driver.deliveryStats,
          completedToday: todayDeliveries,
          activeDeliveries: activeDeliveries
        }
      }
    });
    
  } catch (error) {
    console.error('Get delivery profile error:', error);
    res.status(500).json({
      message: "Error retrieving profile",
      error: error.message
    });
  }
};

// Update driver profile
const updateDeliveryProfile = async (req, res) => {
  try {
    const driverId = req.user._id;
    const updates = req.body;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'name', 'phone', 'image', 'address', 'city', 'country',
      'deliveryInfo.vehicleType', 'deliveryInfo.vehicleNumber', 
      'deliveryInfo.licenseNumber', 'deliveryInfo.phoneNumber',
      'deliveryInfo.emergencyContact', 'deliveryInfo.workingHours',
      'deliveryInfo.maxDeliveryRadius'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key.includes('deliveryInfo.')) {
          const field = key.split('.')[1];
          if (!driver.deliveryInfo) driver.deliveryInfo = {};
          driver.deliveryInfo[field] = updates[key];
        } else {
          driver[key] = updates[key];
        }
      }
    });
    
    await driver.save();
    
    console.log(`📝 Driver ${driver.name.en} profile updated`);
    
    res.json({
      message: "Profile updated successfully",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        image: driver.image,
        deliveryInfo: driver.deliveryInfo
      }
    });
    
  } catch (error) {
    console.error('Update delivery profile error:', error);
    res.status(500).json({
      message: "Error updating profile",
      error: error.message
    });
  }
};

// Update current location
const updateCurrentLocation = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Update location
    if (!driver.deliveryInfo) driver.deliveryInfo = {};
    driver.deliveryInfo.currentLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      lastUpdated: new Date()
    };
    
    await driver.save();
    
    res.json({
      message: "Location updated successfully",
      location: driver.deliveryInfo.currentLocation
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      message: "Error updating location",
      error: error.message
    });
  }
};

// =====================================
// SHIFT MANAGEMENT
// =====================================

// Clock in (start shift)
const clockIn = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { latitude, longitude } = req.body;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    if (driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        message: "You are already on duty"
      });
    }
    
    // Start shift
    if (!driver.deliveryInfo) driver.deliveryInfo = {};
    driver.deliveryInfo.isOnDuty = true;
    driver.deliveryInfo.shiftStartTime = new Date();
    driver.deliveryInfo.availability = "available";
    
    // Update location if provided
    if (latitude && longitude) {
      driver.deliveryInfo.currentLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        lastUpdated: new Date()
      };
    }
    
    // Reset daily stats
    const today = new Date();
    const lastShiftDate = driver.deliveryInfo.shiftStartTime ? 
      new Date(driver.deliveryInfo.shiftStartTime).toDateString() : null;
    
    if (today.toDateString() !== lastShiftDate) {
      if (!driver.deliveryStats) driver.deliveryStats = {};
      driver.deliveryStats.completedToday = 0;
      driver.deliveryStats.earningsToday = 0;
    }
    
    await driver.save();
    
    console.log(`🟢 Driver ${driver.name.en} clocked in`);
    
    // AUTO-ASSIGN PENDING ORDERS
    let assignedOrders = 0;
    try {
      const pendingOrders = await Order.find({
        status: 'Pending',
        $or: [
          { 'deliveryInfo.assignedDriver': { $exists: false } },
          { 'deliveryInfo.assignedDriver': null }
        ]
      }).sort({ createdAt: 1 }).limit(3); // Assign up to 3 orders initially
      
      for (const order of pendingOrders) {
        // Assign order to this driver
        order.status = 'Processing';
        order.deliveryInfo = {
          ...order.deliveryInfo,
          assignedDriver: driverId,
          assignedAt: new Date(),
          priority: 'medium'
        };
        
        // Generate product checklist if not exists
        if (!order.deliveryInfo.productChecklist || order.deliveryInfo.productChecklist.length === 0) {
          const VerificationCodeGenerator = require("../lib/verification-code/generator");
          order.deliveryInfo.productChecklist = VerificationCodeGenerator.generateProductChecklist(order.cart);
        }
        
        await order.save();
        assignedOrders++;
        
        console.log(`📦 Auto-assigned order ${order.invoice} to driver ${driver.name.en} on clock-in`);
      }
      
      if (assignedOrders > 0) {
        // Update driver availability to busy if orders were assigned
        driver.deliveryInfo.availability = 'busy';
        await driver.save();
      }
      
    } catch (assignmentError) {
      console.error('Auto-assignment error on clock-in:', assignmentError.message);
    }
    
    res.json({
      message: "Successfully clocked in",
      shiftStartTime: driver.deliveryInfo.shiftStartTime,
      availability: driver.deliveryInfo.availability,
      assignedOrders: assignedOrders,
      autoAssignmentMessage: assignedOrders > 0 ? 
        `${assignedOrders} order(s) have been automatically assigned to you` : 
        "No pending orders available for assignment"
    });
    
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({
      message: "Error clocking in",
      error: error.message
    });
  }
};

// Clock out (end shift)
const clockOut = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    if (!driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        message: "You are not currently on duty"
      });
    }
    
    // Check for active deliveries
    const activeDeliveries = await Order.countDocuments({
      'deliveryInfo.assignedDriver': driverId,
      status: { $in: ['Processing', 'Out for Delivery'] }
    });
    
    if (activeDeliveries > 0) {
      return res.status(400).json({
        message: `Cannot clock out. You have ${activeDeliveries} active deliveries.`,
        activeDeliveries
      });
    }
    
    // End shift
    const shiftEndTime = new Date();
    const shiftDuration = (shiftEndTime - driver.deliveryInfo.shiftStartTime) / 1000 / 60; // minutes
    
    driver.deliveryInfo.isOnDuty = false;
    driver.deliveryInfo.shiftEndTime = shiftEndTime;
    driver.deliveryInfo.availability = "offline";
    
    await driver.save();
    
    console.log(`🔴 Driver ${driver.name.en} clocked out. Shift duration: ${Math.round(shiftDuration)} minutes`);
    
    res.json({
      message: "Successfully clocked out",
      shiftEndTime: shiftEndTime,
      shiftDuration: Math.round(shiftDuration),
      availability: driver.deliveryInfo.availability
    });
    
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      message: "Error clocking out",
      error: error.message
    });
  }
};

// Get shift status
const getShiftStatus = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    const isOnDuty = driver.deliveryInfo?.isOnDuty || false;
    const shiftStartTime = driver.deliveryInfo?.shiftStartTime;
    const availability = driver.deliveryInfo?.availability || "offline";
    
    let shiftDuration = 0;
    if (isOnDuty && shiftStartTime) {
      shiftDuration = (new Date() - shiftStartTime) / 1000 / 60; // minutes
    }
    
    // Get active deliveries count
    const activeDeliveries = await Order.countDocuments({
      'deliveryInfo.assignedDriver': driverId,
      status: { $in: ['Processing', 'Out for Delivery'] }
    });
    
    res.json({
      isOnDuty,
      availability,
      shiftStartTime,
      shiftDuration: Math.round(shiftDuration),
      activeDeliveries,
      canClockOut: isOnDuty && activeDeliveries === 0
    });
    
  } catch (error) {
    console.error('Get shift status error:', error);
    res.status(500).json({
      message: "Error retrieving shift status",
      error: error.message
    });
  }
};

// =====================================
// STATISTICS & EARNINGS
// =====================================

// Get delivery statistics
const getDeliveryStats = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Date ranges
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Parallel queries for better performance
    const [
      todayDeliveries,
      weekDeliveries,
      monthDeliveries,
      totalDeliveries,
      activeDeliveries,
      averageRating
    ] = await Promise.all([
      Order.countDocuments({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered',
        'deliveryInfo.deliveredAt': { $gte: startOfDay }
      }),
      Order.countDocuments({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered',
        'deliveryInfo.deliveredAt': { $gte: startOfWeek }
      }),
      Order.countDocuments({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered',
        'deliveryInfo.deliveredAt': { $gte: startOfMonth }
      }),
      Order.countDocuments({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered'
      }),
      Order.countDocuments({
        'deliveryInfo.assignedDriver': driverId,
        status: { $in: ['Processing', 'Out for Delivery'] }
      }),
      Order.aggregate([
        {
          $match: {
            'deliveryInfo.assignedDriver': driverId,
            'deliveryInfo.customerRating.rating': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$deliveryInfo.customerRating.rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const ratingData = averageRating[0] || { avgRating: 5.0, totalRatings: 0 };
    
    res.json({
      deliveryStats: {
        today: todayDeliveries,
        thisWeek: weekDeliveries,
        thisMonth: monthDeliveries,
        total: totalDeliveries,
        active: activeDeliveries,
        averageRating: Math.round(ratingData.avgRating * 10) / 10,
        totalRatings: ratingData.totalRatings,
        successRate: driver.deliveryStats?.successRate || 100,
        averageDeliveryTime: driver.deliveryStats?.averageDeliveryTime || 0
      },
      driverInfo: {
        name: driver.name,
        isOnDuty: driver.deliveryInfo?.isOnDuty || false,
        availability: driver.deliveryInfo?.availability || "offline",
        shiftStartTime: driver.deliveryInfo?.shiftStartTime
      }
    });
    
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({
      message: "Error retrieving delivery statistics",
      error: error.message
    });
  }
};

// Get daily earnings
const getDailyEarnings = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { date } = req.query;
    
    const driver = await Admin.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({
        message: "Driver not found"
      });
    }
    
    // Date range for the requested day (default to today)
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    // Get deliveries for the day
    const deliveries = await Order.find({
      'deliveryInfo.assignedDriver': driverId,
      status: 'Delivered',
      'deliveryInfo.deliveredAt': { $gte: startOfDay, $lt: endOfDay }
    }).select('invoice total deliveryInfo.deliveredAt paymentMethod');
    
    // Calculate earnings (assuming fixed delivery fee per order)
    const deliveryFeePerOrder = 50; // You can make this configurable
    const totalEarnings = deliveries.length * deliveryFeePerOrder;
    const codAmount = deliveries
      .filter(order => order.paymentMethod === 'Cash')
      .reduce((sum, order) => sum + order.total, 0);
    
    res.json({
      date: targetDate.toDateString(),
      earnings: {
        totalDeliveries: deliveries.length,
        deliveryFee: deliveryFeePerOrder,
        totalEarnings: totalEarnings,
        codCollected: codAmount,
        averageOrderValue: deliveries.length > 0 ? 
          deliveries.reduce((sum, order) => sum + order.total, 0) / deliveries.length : 0
      },
      deliveries: deliveries.map(order => ({
        invoice: order.invoice,
        total: order.total,
        deliveredAt: order.deliveryInfo.deliveredAt,
        paymentMethod: order.paymentMethod
      }))
    });
    
  } catch (error) {
    console.error('Get daily earnings error:', error);
    res.status(500).json({
      message: "Error retrieving daily earnings",
      error: error.message
    });
  }
};

module.exports = {
  // Authentication & Profile
  deliveryLogin,
  getDeliveryProfile,
  updateDeliveryProfile,
  updateCurrentLocation,
  
  // Shift Management
  clockIn,
  clockOut,
  getShiftStatus,
  
  // Statistics
  getDeliveryStats,
  getDailyEarnings
}; 