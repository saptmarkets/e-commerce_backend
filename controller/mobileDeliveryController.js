const Order = require("../models/Order");
const Admin = require("../models/Admin");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Product = require("../models/Product");
const DeliveryAssignment = require('../models/DeliveryAssignment');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createOrderNotification } = require("./notificationController");

// =====================================
// MOBILE DELIVERY APP SPECIFIC ENDPOINTS
// =====================================

// Helper function to ensure order has proper delivery info structure
const ensureDeliveryInfoStructure = async (order) => {
  let updated = false;
  
  if (!order.deliveryInfo) {
    order.deliveryInfo = {};
    updated = true;
  }
  
  if (!order.deliveryInfo.productChecklist || !Array.isArray(order.deliveryInfo.productChecklist)) {

    
    // Create productChecklist from order cart items - use consistent ID extraction
    order.deliveryInfo.productChecklist = [];
    
    order.cart.forEach((cartItem, index) => {
      // Enhanced product information extraction
      const productTitle = cartItem.title || 
                          cartItem.name || 
                          cartItem.productTitle || 
                          cartItem.product?.title || 
                          cartItem.product?.name || 
                          `Product ${index + 1}`;
                          
      console.log(`🔧 Initializing cart item ${index}:`, {
        id: cartItem.id,
        title: cartItem.title,
        isCombo: cartItem.isCombo,
        hasComboDetails: !!cartItem.comboDetails,
        extractedTitle: productTitle
      });

      // Check if this is a combo product
      if (cartItem.isCombo && cartItem.comboDetails && cartItem.comboDetails.productBreakdown) {
        console.log(`🎁 Breaking down combo: ${productTitle}`);
        
        // Add individual products from combo breakdown
        cartItem.comboDetails.productBreakdown.forEach((comboProduct, comboIndex) => {
          const comboItem = {
            productId: comboProduct.productId || `combo_${index}_${comboIndex}`,
            title: comboProduct.productTitle || `Combo Item ${comboIndex + 1}`,
            quantity: comboProduct.quantity || 1,
            price: comboProduct.unitPrice || 0,
            originalPrice: comboProduct.unitPrice || 0,
            image: comboProduct.image,
            collected: false,
            collectedAt: null,
            notes: '',
            unitName: comboProduct.unitName || 'Unit',
            packQty: 1,
            sku: comboProduct.sku || '',
            // Add combo reference for tracking
            isFromCombo: true,
            comboTitle: productTitle,
            comboId: cartItem.id
          };
          
          order.deliveryInfo.productChecklist.push(comboItem);
          console.log(`  ├─ Added: ${comboItem.title} (Qty: ${comboItem.quantity})`);
        });
        
      } else {
        // Regular product (not a combo)
        const regularItem = {
          productId: cartItem.id || cartItem._id?.toString() || cartItem.productId || `product_${index}`,
          title: productTitle,
          quantity: cartItem.quantity,
          price: cartItem.price,
          originalPrice: cartItem.originalPrice,
          image: cartItem.image,
          collected: false,
          collectedAt: null,
          notes: '',
          unitName: cartItem.unitName || cartItem.unit || 'Unit',
          packQty: cartItem.packQty || 1,
          sku: cartItem.sku || '',
          isFromCombo: false
        };
        
        order.deliveryInfo.productChecklist.push(regularItem);
        console.log(`  ├─ Added regular product: ${regularItem.title} (Qty: ${regularItem.quantity})`);
      }
    });
    updated = true;
  }
  
  if (updated) {
    await order.save();
    console.log('✅ Order delivery info structure initialized');
  }
  
  return order;
};

// Mobile Login - Simplified for delivery personnel
const mobileLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Mobile login attempt:', { email, body: req.body });
    console.log('HEADERS:', req.headers);
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find delivery personnel (check both 'delivery-person' and 'Driver' roles)
    const deliveryPerson = await Admin.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['delivery-person', 'Driver'] }
    });
    
    if (!deliveryPerson) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials - delivery person not found"
      });
    }
    
    // Check password using bcrypt directly
    const isMatch = await bcrypt.compare(password, deliveryPerson.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials - password incorrect"
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: deliveryPerson._id,
        email: deliveryPerson.email,
        role: deliveryPerson.role,
        name: deliveryPerson.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Mobile login successful for:', email);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      driver: {
        id: deliveryPerson._id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        role: deliveryPerson.role,
        phone: deliveryPerson.phone
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// Get Mobile Orders - Simplified structure for mobile app
const getMobileOrders = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📱 Getting mobile orders for driver:', driverId);
    
    // Check if driver is on break
    const driver = await Admin.findById(driverId);
    const isOnBreak = driver?.deliveryInfo?.isOnBreak || false;
    
    if (isOnBreak) {
      console.log('⏸️ Driver is on break, showing only assigned orders');
    }
    
    // Find orders based on break status
    let orderQuery = {};
    
    if (isOnBreak) {
      // If on break, only show orders already assigned to this driver
      orderQuery = {
        'deliveryInfo.assignedDriver': driverId,
        // Only include active order statuses
        status: { $in: ['Received', 'Processing', 'Out for Delivery'] },
        // Ensure order is not cancelled or completed
        $and: [
          { status: { $ne: 'Cancelled' } },
          { status: { $ne: 'Delivered' } },
          { status: { $ne: 'Completed' } }
        ]
      };
    } else {
      // If not on break, show all available orders
      orderQuery = {
      $or: [
        // Orders assigned to this driver
        { 'deliveryInfo.assignedDriver': driverId },
        // Unassigned orders that can be accepted
        { 'deliveryInfo.assignedDriver': { $exists: false } },
        { 'deliveryInfo.assignedDriver': null }
      ],
      // Only include active order statuses
      status: { $in: ['Received', 'Processing', 'Out for Delivery'] },
      // Ensure order is not cancelled or completed
      $and: [
        { status: { $ne: 'Cancelled' } },
        { status: { $ne: 'Delivered' } },
        { status: { $ne: 'Completed' } }
      ]
      };
    }
    
    const orders = await Order.find(orderQuery)
    .populate('user', 'name email phone')
    .populate('deliveryInfo.assignedDriver', 'name email')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`📦 Found ${orders.length} active orders`);
    
    // Format orders for mobile app
    const mobileOrders = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      let productChecklist = [];
      
      if (order.deliveryInfo?.productChecklist && order.deliveryInfo.productChecklist.length > 0) {
        productChecklist = order.deliveryInfo.productChecklist;
      } else if (order.cart && order.cart.length > 0) {
        // Generate checklist from cart data by fetching actual product details from database
        productChecklist = [];
        
        for (let index = 0; index < order.cart.length; index++) {
          const item = order.cart[index];
          
          // Enhanced product information extraction
          const productTitle = item.title || 
                              item.name || 
                              item.productTitle || 
                              item.product?.title || 
                              item.product?.name || 
                              `Product ${index + 1}`;
                              
          console.log(`🔍 Processing cart item ${index}:`, {
            id: item.id,
            title: item.title,
            name: item.name,
            productTitle: item.productTitle,
            extractedTitle: productTitle,
            allKeys: Object.keys(item)
          });

          // Try to fetch actual product details from database
          let actualProduct = null;
          const productId = item.id || item.productId;
          
          if (productId) {
            try {
              actualProduct = await Product.findById(productId);
              console.log(`📦 Fetched product from DB:`, {
                productId: productId,
                found: !!actualProduct,
                title: actualProduct?.title || 'Not found'
              });
            } catch (error) {
              console.error(`❌ Error fetching product ${productId}:`, error.message);
            }
          }

          productChecklist.push({
            productId: productId || `product_${index}`,
            productTitle: actualProduct?.title || productTitle, // Use database title if available
            // Show both Arabic and English names if available
            displayName: actualProduct?.title ? 
              (actualProduct.title.ar && actualProduct.title.en ? 
                `${actualProduct.title.ar} / ${actualProduct.title.en}` : 
                actualProduct.title.ar || actualProduct.title.en || actualProduct.title) :
              productTitle,
            quantity: item.quantity || 1,
            // Include all product details
            price: actualProduct?.price || item.price || 0,
            image: actualProduct?.image || item.image || '',
            unitName: actualProduct?.unitName || item.unitName || item.unit || 'Unit',
            sku: actualProduct?.sku || item.sku || '',
            collected: false,
            collectedAt: null,
            notes: ""
          });
        }
      }
      
      const assignedDriverInfo = order.deliveryInfo?.assignedDriver;
      const isAssignedToMe = assignedDriverInfo && assignedDriverInfo._id.toString() === driverId;
      const isUnassigned = !assignedDriverInfo;

      let assignedDriverName = null;
      if (assignedDriverInfo) {
        if (assignedDriverInfo.name && typeof assignedDriverInfo.name === 'object') {
          assignedDriverName = assignedDriverInfo.name.en || Object.values(assignedDriverInfo.name)[0] || assignedDriverInfo.email;
        } else {
          assignedDriverName = assignedDriverInfo.name || assignedDriverInfo.email;
        }
      }
      
      mobileOrders.push({
        _id: order._id,
        orderNumber: order.invoice,
        status: order.status,
        customer: {
          name: order.user_info?.name || order.user?.name || 'Unknown Customer',
          phone: order.user_info?.contact || order.user_info?.phone || order.user?.phone || order.user?.contact || order.contact || 'N/A',
          address: order.user_info?.address || order.shippingAddress?.address || '',
          city: order.user_info?.city || order.shippingAddress?.city || ''
        },
        total: order.total || 0,
        paymentMethod: order.paymentMethod || 'Cash',
        productCount: productChecklist.length,
        collectedCount: productChecklist.filter(item => item.collected).length,
        createdAt: order.createdAt,
        verificationCode: order.verificationCode,
        delivery: {
          isAssigned: !!assignedDriverInfo,
          isAssignedToMe: isAssignedToMe,
          requiresAcceptance: isUnassigned,
          assignedDriverId: assignedDriverInfo ? assignedDriverInfo._id : null,
          assignedDriverName: assignedDriverName
        }
      });
    }
    
    console.log('📱 Sample order customer data:', mobileOrders.length > 0 ? {
      'order_id': mobileOrders[0]._id,
      'customer_phone': mobileOrders[0].customer.phone,
      'customer_name': mobileOrders[0].customer.name
    } : 'No orders found');
    
    // Updated response format to match frontend expectations
    res.json({
      success: true,
      data: mobileOrders,
      message: `Found ${mobileOrders.length} orders`
    });
    
  } catch (error) {
    console.error('❌ Get mobile orders error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: "Failed to get orders",
      error: error.message
    });
  }
};

// Get Mobile Order Details - Complete order info for mobile
const getMobileOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    console.log(
      "📱 Getting mobile order details:",
      orderId,
      "for driver:",
      driverId
    );

    const order = await Order.findById(orderId).populate(
      "user",
      "name email phone"
    );
    
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("✅ Order found:", {
      id: order._id,
      invoice: order.invoice,
      status: order.status,
      cartLength: order.cart?.length || 0,
      hasDeliveryInfo: !!order.deliveryInfo,
      hasProductChecklist: !!order.deliveryInfo?.productChecklist,
      checklistLength: order.deliveryInfo?.productChecklist?.length || 0
    });

    // Get or generate product checklist
    let productChecklist = [];
    
    try {
      if (order.deliveryInfo && 
          order.deliveryInfo.productChecklist && 
          Array.isArray(order.deliveryInfo.productChecklist) &&
          order.deliveryInfo.productChecklist.length > 0) {
        
        // Use existing checklist from order creation, but enhance with fresh database data
        console.log('✅ Using existing product checklist from order:', {
          checklistLength: order.deliveryInfo.productChecklist.length,
          sampleItem: order.deliveryInfo.productChecklist[0]
        });
        
        // Enhance existing checklist with fresh database data
        productChecklist = [];
        for (let i = 0; i < order.deliveryInfo.productChecklist.length; i++) {
          const checklistItem = order.deliveryInfo.productChecklist[i];
          console.log(`🔍 Processing checklist item ${i}:`, checklistItem);
          
          // Try to fetch fresh product details from database
          let actualProduct = null;
          if (checklistItem.productId && checklistItem.productId !== 'product_0' && !checklistItem.productId.startsWith('combo_')) {
            try {
              actualProduct = await Product.findById(checklistItem.productId);
              console.log(`📦 Enhanced existing checklist item ${i}:`, {
                productId: checklistItem.productId,
                found: !!actualProduct,
                title: actualProduct?.title || 'Not found'
              });
            } catch (error) {
              console.error(`❌ Error fetching product ${checklistItem.productId}:`, error.message);
            }
          }
          
          // Create enhanced checklist item with both Arabic and English names
          const enhancedItem = {
            productId: checklistItem.productId,
            productTitle: actualProduct?.title || checklistItem.productTitle || 'Unknown Product',
            // Show both Arabic and English names if available
            displayName: actualProduct?.title ? 
              (actualProduct.title.ar && actualProduct.title.en ? 
                `${actualProduct.title.ar} / ${actualProduct.title.en}` : 
                actualProduct.title.ar || actualProduct.title.en || actualProduct.title) :
              checklistItem.productTitle || 'Unknown Product',
            quantity: checklistItem.quantity || 1,
            // Include all product details
            price: actualProduct?.price || 0,
            image: actualProduct?.image || '',
            unitName: actualProduct?.unitName || 'Unit',
            sku: actualProduct?.sku || '',
            collected: checklistItem.collected || false,
            collectedAt: checklistItem.collectedAt || null,
            notes: checklistItem.notes || ""
          };
          
          productChecklist.push(enhancedItem);
          console.log(`✅ Enhanced item ${i} created:`, enhancedItem);
        }
        
      } else {
        // Generate new checklist from cart data by fetching actual product details from database
        console.log('🔄 No existing checklist found. Cart data available:', {
          hasCart: !!order.cart,
          cartLength: order.cart?.length || 0,
          cartSample: order.cart?.[0] ? {
            keys: Object.keys(order.cart[0]),
            title: order.cart[0].title,
            name: order.cart[0].name,
            productTitle: order.cart[0].productTitle
          } : 'No cart data'
        });
        
        if (order.cart && order.cart.length > 0) {
          productChecklist = [];
          
          // Process each cart item and fetch actual product details from database
          for (let index = 0; index < order.cart.length; index++) {
            const item = order.cart[index];
            console.log(`🔍 Processing cart item ${index}:`, {
              id: item.id,
              title: item.title,
              name: item.name,
              productTitle: item.productTitle,
              allKeys: Object.keys(item)
            });

            // Enhanced product information extraction with better fallbacks
            const productTitle = item.title || 
                                item.name || 
                                item.productTitle || 
                                `Product ${index + 1}`;
                                
            // Check if this is a combo product
            if (item.isCombo && item.comboDetails && item.comboDetails.productBreakdown) {
              console.log(`🎁 Breaking down combo: ${productTitle}`);
              
              // Add individual products from combo breakdown
              for (let comboIndex = 0; comboIndex < item.comboDetails.productBreakdown.length; comboIndex++) {
                const comboProduct = item.comboDetails.productBreakdown[comboIndex];
                
                // Try to fetch actual product details from database
                let actualProduct = null;
                if (comboProduct.productId) {
                  try {
                    actualProduct = await Product.findById(comboProduct.productId);
                    console.log(`📦 Fetched combo product from DB:`, {
                      productId: comboProduct.productId,
                      found: !!actualProduct,
                      title: actualProduct?.title || 'Not found'
                    });
                  } catch (error) {
                    console.error(`❌ Error fetching combo product ${comboProduct.productId}:`, error.message);
                  }
                }
                
                const comboItem = {
                  productId: comboProduct.productId || `combo_${index}_${comboIndex}`,
                  productTitle: actualProduct?.title || comboProduct.productTitle || `Combo Item ${comboIndex + 1}`,
                  // Show both Arabic and English names if available
                  displayName: actualProduct?.title ? 
                    (actualProduct.title.ar && actualProduct.title.en ? 
                      `${actualProduct.title.ar} / ${actualProduct.title.en}` : 
                      actualProduct.title.ar || actualProduct.title.en || actualProduct.title) :
                    comboProduct.productTitle || `Combo Item ${comboIndex + 1}`,
                  quantity: comboProduct.quantity || 1,
                  // Include all product details
                  price: actualProduct?.price || comboProduct.unitPrice || 0,
                  image: actualProduct?.image || comboProduct.image || '',
                  unitName: actualProduct?.unitName || comboProduct.unitName || 'Unit',
                  sku: actualProduct?.sku || comboProduct.sku || '',
                  collected: false,
                  collectedAt: null,
                  notes: ""
                };
                
                productChecklist.push(comboItem);
                console.log(`  ├─ Added: ${comboItem.displayName} (Qty: ${comboItem.quantity})`);
              }
              
            } else {
              // Regular product (not a combo) - fetch actual product details from database
              let actualProduct = null;
              const productId = item.id || item.productId;
              
              if (productId) {
                try {
                  actualProduct = await Product.findById(productId);
                  console.log(`📦 Fetched regular product from DB:`, {
                    productId: productId,
                    found: !!actualProduct,
                    title: actualProduct?.title || 'Not found'
                  });
                } catch (error) {
                  console.error(`❌ Error fetching product ${productId}:`, error.message);
                }
              }
              
              const regularItem = {
                productId: productId || `product_${index}`,
                productTitle: actualProduct?.title || productTitle, // Use database title if available
                // Show both Arabic and English names if available
                displayName: actualProduct?.title ? 
                  (actualProduct.title.ar && actualProduct.title.en ? 
                    `${actualProduct.title.ar} / ${actualProduct.title.en}` : 
                    actualProduct.title.ar || actualProduct.title.en || actualProduct.title) :
                  productTitle,
                quantity: item.quantity || 1,
                // Include all product details
                price: actualProduct?.price || item.price || 0,
                image: actualProduct?.image || item.image || '',
                unitName: actualProduct?.unitName || item.unitName || item.unit || 'Unit',
                sku: actualProduct?.sku || item.sku || '',
                collected: false,
                collectedAt: null,
                notes: ""
              };
              
              productChecklist.push(regularItem);
              console.log(`  ├─ Added regular product: ${regularItem.displayName} (Qty: ${regularItem.quantity})`);
            }
          }

          console.log(`✅ Generated ${productChecklist.length} new checklist items.`);

          // Save the newly generated checklist back to the order
          try {
            await Order.findByIdAndUpdate(
              orderId,
              {
                "deliveryInfo.productChecklist": productChecklist,
                "deliveryInfo.allItemsCollected": false,
              },
              { new: true }
            );
            console.log("💾 Saved newly generated checklist to the database.");
          } catch (updateError) {
            console.error(
              "⚠️ Failed to save newly generated checklist to order:",
              updateError.message
            );
          }
        } else {
          console.log("⚠️ No cart items found to generate checklist from.");
          productChecklist = [];
        }
      }
    } catch (checklistError) {
      console.error("❌ Error processing product checklist:", checklistError);
      // Continue with empty checklist rather than failing completely
      productChecklist = [];
    }

    console.log("📋 Final product checklist:", {
      length: productChecklist.length,
      items: productChecklist.map(item => ({
        productId: item.productId,
        displayName: item.displayName,
        quantity: item.quantity
      }))
    });

    // Prepare response data
    const orderDetails = {
      _id: order._id,
      invoice: order.invoice,
      status: order.status,
      customer: {
        name: order.user_info?.name || order.user?.name || 'Unknown Customer',
        phone: order.user_info?.contact || order.user?.phone || 'Unknown Phone',
        address: order.user_info?.address || 'Unknown Address'
      },
      products: productChecklist,
      total: order.total || 0,
      subTotal: order.subTotal || 0,
      shippingCost: order.shippingCost || 0,
      discount: order.discount || 0,
      paymentMethod: order.paymentMethod || 'COD',
      createdAt: order.createdAt,
      deliveryInfo: order.deliveryInfo || {}
    };

    console.log("📤 Sending order details response:", {
      orderId: orderDetails._id,
      invoice: orderDetails.invoice,
      productCount: orderDetails.products.length
    });

    res.json({
      success: true,
      data: orderDetails,
      message: "Order details retrieved successfully"
    });

  } catch (error) {
    console.error('❌ Get mobile order details error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message
    });
  }
};

// Helper function to generate combo description
const generateComboDescription = (comboItem) => {
  if (comboItem.comboDetails && comboItem.comboDetails.productBreakdown) {
    const items = comboItem.comboDetails.productBreakdown
      .map(p => `${p.quantity}x ${p.productTitle}`)
      .join(', ');
    return `Includes: ${items}`;
  }
  return 'Combo package with multiple items';
};

// Mobile Accept/Claim Order
const mobileAcceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    console.log('📱 Mobile accept order:', { orderId, driverId });
    
    // Check if driver is on break
    const driver = await Admin.findById(driverId);
    if (driver?.deliveryInfo?.isOnBreak) {
      return res.status(400).json({
        success: false,
        message: "You cannot accept new orders while on break. Please end your break first."
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    console.log('✅ Order found:', { 
      invoice: order.invoice, 
      status: order.status,
      currentAssignedDriver: order.deliveryInfo?.assignedDriver 
    });
    
    // Check if order is in correct status (Received orders are available for acceptance)
    if (order.status === 'Delivered' || order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Order status is '${order.status}'. Only 'Received' orders can be accepted.`
      });
    }

    // Check if order is already assigned to someone else
    const currentAssignedDriver = order.deliveryInfo?.assignedDriver;
    console.log('🔍 Assignment check:', {
      currentAssignedDriver,
      driverId,
      isAssignedToOther: currentAssignedDriver && currentAssignedDriver !== '' && currentAssignedDriver.toString() !== driverId,
      isAssignedToMe: currentAssignedDriver && currentAssignedDriver.toString() === driverId,
      isUnassigned: !currentAssignedDriver || currentAssignedDriver === '' || currentAssignedDriver === null
    });
    
    if (currentAssignedDriver && 
        currentAssignedDriver !== '' && 
        currentAssignedDriver.toString() !== driverId) {
      
      console.log('❌ Order already assigned to another driver:', currentAssignedDriver);
      // Get the assigned driver's info for better error message
      try {
        const assignedDriver = await Admin.findById(currentAssignedDriver);
        return res.status(409).json({
          success: false,
          message: `Order is already assigned to ${assignedDriver?.name || 'another driver'}`
        });
      } catch (err) {
        return res.status(409).json({
          success: false,
          message: "Order is already assigned to another driver"
        });
      }
    }
    
    // Check if order is already assigned to this driver
    if (currentAssignedDriver && currentAssignedDriver.toString() === driverId) {
      console.log('✅ Order already assigned to current driver');
      return res.json({
        success: true,
        message: "Order is already assigned to you",
        data: {
          orderId: order._id,
          orderNumber: order.invoice,
          status: order.status,
          alreadyAssigned: true
        }
      });
    }
    
    // Assign the order to this driver and change status to Processing
    console.log('🔄 Assigning order to driver...');
    
    // Get driver info for status history (driver already declared above for break check)
    const driverName = driver?.name?.en || driver?.email || 'Unknown Driver';
    
        order.deliveryInfo = order.deliveryInfo || {};
        order.deliveryInfo.assignedDriver = driverId;
        order.deliveryInfo.assignedAt = new Date();
    order.deliveryInfo.statusHistory = order.deliveryInfo.statusHistory || [];
    
    // Change status to Processing and add to history
    order.status = 'Processing';
    order.deliveryInfo.statusHistory.push({
      status: 'Processing',
      timestamp: new Date(),
      driverName: driverName,
      driverId: driverId,
      notes: `Order accepted by ${driverName}`
    });
    
    // Initialize product checklist if needed
    console.log('🔄 Ensuring delivery info structure...');
    await ensureDeliveryInfoStructure(order);
    
    console.log('🔄 Saving order...');
        await order.save();
    
    console.log('✅ Order assigned to driver successfully');
    
    const responseData = {
      success: true,
      message: "Order accepted successfully",
      data: {
        orderId: order._id,
        orderNumber: order.invoice,
        status: order.status,
        assignedAt: order.deliveryInfo.assignedAt,
        productChecklistCount: order.deliveryInfo.productChecklist?.length || 0
      }
    };
    
    console.log('📤 Sending success response:', responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Mobile accept order error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to accept order",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Mobile Toggle Product Collection
const mobileToggleProduct = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, collected } = req.body;
    const driverId = req.user.userId;
    
    console.log('🔄 Toggling product collection:', { orderId, productId, driverId });
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find the order and check if it exists
    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order is assigned to this driver
    if (!order.deliveryInfo?.assignedDriver || 
        order.deliveryInfo.assignedDriver.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Please accept the order first before collecting products'
      });
    }

    // Check if the order is in a valid state for product collection
    if (!['Processing', 'Out for Delivery'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be in Processing or Out for Delivery status to collect products'
      });
    }

    // Find the product in the checklist
    const productIndex = order.deliveryInfo.productChecklist.findIndex(
      item => item.productId.toString() === productId.toString()
    );
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in checklist'
      });
    }
    
    // Update the product collection status
    order.deliveryInfo.productChecklist[productIndex].collected = collected;
    order.deliveryInfo.productChecklist[productIndex].collectedAt = collected ? new Date() : null;
    
    // Check if all items are collected
    const allCollected = order.deliveryInfo.productChecklist.every(item => item.collected);
    order.deliveryInfo.allItemsCollected = allCollected;
    
    if (allCollected) {
      order.deliveryInfo.collectionCompletedAt = new Date();
    } else {
      order.deliveryInfo.collectionCompletedAt = null;
    }
    
    // Save the updated order
    await order.save();
    
    res.json({
      success: true,
      message: `Product ${collected ? 'collected' : 'uncollected'} successfully`,
      data: {
        productId,
        collected,
        collectedAt: order.deliveryInfo.productChecklist[productIndex].collectedAt,
        allItemsCollected: allCollected,
        collectedCount: order.deliveryInfo.productChecklist.filter(item => item.collected).length,
        totalCount: order.deliveryInfo.productChecklist.length,
        checklist: order.deliveryInfo.productChecklist
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile toggle product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product collection',
      error: error.message
    });
  }
};

// Mobile Mark Out for Delivery
const mobileMarkOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    console.log('📱 Mobile mark out for delivery:', orderId);
    
    // Find order assigned to this driver only
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please accept the order first."
      });
    }
    
    // Check if all items are collected
    const allCollected = order.deliveryInfo.productChecklist?.every(item => item.collected) || false;
    
    if (!allCollected) {
      return res.status(400).json({
        success: false,
        message: "All products must be collected before marking out for delivery"
      });
    }
    
    // Update order status and add to history
    const driver = await Admin.findById(driverId);
    const driverName = driver?.name?.en || driver?.email || 'Unknown Driver';
    
    order.status = 'Out for Delivery';
    order.deliveryInfo.outForDeliveryAt = new Date();
    order.deliveryInfo.statusHistory = order.deliveryInfo.statusHistory || [];
    order.deliveryInfo.statusHistory.push({
      status: 'Out for Delivery',
      timestamp: new Date(),
      driverName: driverName,
      driverId: driverId,
      notes: `Order marked out for delivery by ${driverName}`
    });
    
    await order.save();
    
    console.log('✅ Order marked out for delivery');
    console.log('📊 Order status after save:', order.status);
    
    res.json({
      success: true,
      message: "Order marked as out for delivery",
      data: {
        orderId,
        status: order.status,
        outForDeliveryAt: order.deliveryInfo.outForDeliveryAt
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile mark out for delivery error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark out for delivery",
      error: error.message
    });
  }
};

// Mobile Complete Delivery
const mobileCompleteDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verificationCode, notes, customerSignature } = req.body;
    const driverId = req.user.userId;

    console.log(`🚚 Complete delivery attempt for order ${orderId} by driver ${driverId}`);

    // Find the order and verify assignment
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId,
      status: 'Out for Delivery'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found, not assigned to you, or not ready for delivery completion'
      });
    }

    // Verify the customer's verification code
    console.log(`Debug: Received verificationCode: '${verificationCode}' (Type: ${typeof verificationCode}, Length: ${verificationCode?.length})`);
    console.log(`Debug: Order verificationCode: '${order.verificationCode}' (Type: ${typeof order.verificationCode}, Length: ${order.verificationCode?.length})`);
    if (!verificationCode || verificationCode.trim() !== order.verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please ask the customer for the correct code.'
      });
    }

    // Update order status to Delivered
    order.status = 'Delivered';
    order.deliveryInfo.deliveredAt = new Date();
    order.deliveryInfo.completedBy = driverId;
    
    if (notes) {
      order.deliveryInfo.deliveryNotes = notes;
    }
    
    if (customerSignature) {
      order.deliveryInfo.customerSignature = customerSignature;
    }

    // Process stock reduction and loyalty points (non-blocking)
    try {
      // Import helpers lazily to avoid circular dependencies
      const {
        handleProductQuantity,
        handleLoyaltyPoints
      } = require("../lib/stock-controller/others");

      console.log(`🚀 MOBILE DELIVERY COMPLETE: Processing order ${order.invoice} (${order._id})`);
      console.log(`📋 Order cart:`, order.cart ? order.cart.length : 'No cart');

      // Reduce product stock
      if (order.cart && order.cart.length > 0) {
        console.log(`📦 MOBILE DELIVERY: CALLING handleProductQuantity with ${order.cart.length} items`);
        // Add admin_id to order object for stock movement creation
        const orderWithAdmin = {
          ...order.toObject(),
          admin_id: req.admin?._id || req.user?._id || null
        };
        await handleProductQuantity(order.cart, orderWithAdmin);
        console.log(`✅ MOBILE DELIVERY: handleProductQuantity completed for order ${order.invoice}`);
      } else {
        console.warn(`⚠️ MOBILE DELIVERY: No cart items found for order ${order.invoice}`);
      }

      // Award loyalty points to customer
      if (order.user) {
        const orderAmountForPoints =
          order.subTotal + (order.shippingCost || 0) - (order.discount || 0);
        console.log(
          `💎 DELIVERY: Awarding loyalty points for order ${order.invoice}, amount: ${orderAmountForPoints}`
        );
        await handleLoyaltyPoints(order.user, order._id, orderAmountForPoints);
      }
    } catch (stockError) {
      console.error(
        "Error processing stock/loyalty for delivered order:",
        stockError
      );
      // Continue even if stock/loyalty processing fails
    }

    await order.save();

    // Create customer notification for Delivered status
    if (order.user) {
      try {
        await createOrderNotification(order.user, order._id, 'Delivered', order.invoice);
        console.log(`📢 NOTIFICATION: Created Delivered notification for customer ${order.user} - Order ${order.invoice}`);
      } catch (notificationError) {
        console.error('Failed to create delivered notification:', notificationError);
      }
    }

    console.log(`✅ Order ${order.invoice} marked as delivered by driver ${driverId}`);

    res.json({
      success: true,
      message: 'Order delivered successfully!',
      data: {
        orderId: order._id,
        invoice: order.invoice,
        status: order.status,
        deliveredAt: order.deliveryInfo.deliveredAt,
        verificationUsed: true
      }
    });

  } catch (error) {
    console.error('❌ Mobile complete delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete delivery',
      error: error.message
    });
  }
};

// Helper function to get proper image URL
const getImageUrl = (image) => {
  if (!image) {
    return 'https://via.placeholder.com/80x80/E5E7EB/6B7280?text=No+Image';
  }
  
  if (typeof image === 'string') {
    return image.trim() || 'https://via.placeholder.com/80x80/E5E7EB/6B7280?text=No+Image';
  }
  
  if (Array.isArray(image) && image.length > 0) {
    return image[0].trim() || 'https://via.placeholder.com/80x80/E5E7EB/6B7280?text=No+Image';
  }
  
  return 'https://via.placeholder.com/80x80/E5E7EB/6B7280?text=No+Image';
};

// Generate Bill for Order
const generateBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.userId;
    
    console.log('📱 Generating bill for order:', orderId);
    
    // First try to find order assigned to this driver
    let order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    }).populate('user', 'name email phone');
    
    // If not found, try to find unassigned order and auto-assign it
    if (!order) {
      order = await Order.findOne({
        _id: orderId,
        status: { $in: ['Processing', 'Pending', 'Out for Delivery', 'Delivered'] }
      }).populate('user', 'name email phone');
      
      if (order && (!order.deliveryInfo?.assignedDriver || order.deliveryInfo.assignedDriver === null || order.deliveryInfo.assignedDriver === '')) {
        // Auto-assign the order to this driver
        console.log('🔄 Auto-assigning order to driver for billing:', driverId);
        order.deliveryInfo = order.deliveryInfo || {};
        order.deliveryInfo.assignedDriver = driverId;
        order.deliveryInfo.assignedAt = new Date();
        await order.save();
        console.log('✅ Order auto-assigned successfully for billing');
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Generate bill data
    const billData = {
      orderNumber: order.invoice,
      customerName: order.user_info?.name || order.user?.name || 'Unknown Customer',
      customerPhone: order.user_info?.contact || order.user?.phone || '',
      customerAddress: order.user_info?.address || '',
      items: order.deliveryInfo?.productChecklist?.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1),
        unitName: item.unitName || 'Unit',
        packQty: item.packQty || 1
      })) || [],
      subtotal: order.subTotal || 0,
      delivery: order.shippingCost || 0,
      discount: order.discount || 0,
      tax: order.tax || 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod || 'Cash',
      currency: '﷼',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: order.status
    };
    
    // Check if PDF format is requested
    const format = req.query.format;
    if (format === 'pdf') {
      // Create PDF document
      const doc = new PDFDocument();
      const pdfFileName = `receipt-${order.invoice}-${Date.now()}.pdf`;
      const pdfPath = path.join(__dirname, '..', 'public', 'receipts', pdfFileName);
      
      // Ensure directory exists
      const dir = path.dirname(pdfPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Pipe PDF to file
      doc.pipe(fs.createWriteStream(pdfPath));
      
      // Add content to PDF
      doc.fontSize(20).text('Delivery Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order #: ${order.invoice}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Customer: ${billData.customerName}`);
      doc.text(`Address: ${billData.customerAddress}`);
      doc.moveDown();
      
      // Add items table
      doc.text('Items:', { underline: true });
      billData.items.forEach(item => {
        doc.text(`${item.title} - ${item.quantity}x ${item.unitPrice} = ${item.total} ${billData.currency}`);
      });
      doc.moveDown();
      
      // Add totals
      doc.text(`Subtotal: ${billData.currency} ${billData.subtotal.toFixed(2)}`);
      if (billData.delivery > 0) {
        doc.text(`Delivery: ${billData.currency} ${billData.delivery.toFixed(2)}`);
      }
      if (billData.discount > 0) {
        doc.text(`Discount: ${billData.currency} ${billData.discount.toFixed(2)}`);
      }
      doc.fontSize(14).text(`Total: ${billData.currency} ${billData.total.toFixed(2)}`, { bold: true });
      
      // Finalize PDF
      doc.end();
      
      // Generate PDF URL
      const pdfUrl = `${req.protocol}://${req.get('host')}/receipts/${pdfFileName}`;
      
      return res.json({
        success: true,
        message: "PDF bill generated successfully",
        data: {
          ...billData,
          pdfUrl: pdfUrl,
          downloadUrl: pdfUrl
        }
      });
    }
      
    // Return JSON format
    return res.json({
        success: true,
        message: "Bill generated successfully",
        data: billData
      });
    
  } catch (error) {
    console.error('❌ Generate bill error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to generate bill",
      error: error.message
    });
  }
};

// Print Bill (58mm thermal printer)
const printBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { printerSettings } = req.body;
    const driverId = req.user.userId;
    
    console.log('📱 Printing bill for order:', orderId, 'with settings:', printerSettings);
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    }).populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you"
      });
    }
    
    // Generate thermal printer format (58mm width)
    const thermalBill = generateThermalBill(order, printerSettings);
    
    // In a real implementation, you would send this to a thermal printer
    // For now, we'll just return the formatted bill
    console.log('✅ Bill formatted for thermal printer');
    
    res.json({
      success: true,
      message: "Bill formatted for printing",
      data: {
        thermalFormat: thermalBill,
        printerSettings: {
          width: '58mm',
          fontSize: printerSettings?.fontSize || 'small',
          alignment: printerSettings?.alignment || 'left',
          ...printerSettings
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Print bill error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to print bill",
      error: error.message
    });
  }
};

// Generate thermal printer format (58mm)
const generateThermalBill = (order, settings = {}) => {
  const width = 32; // 58mm printer typically supports 32 characters per line
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  
  let bill = '';
  
  // Store Name/Header
  bill += centerText('SAPTMARKETS', width) + '\n';
  bill += centerText('DELIVERY RECEIPT', width) + '\n';
  bill += line + '\n';
  
  // Order Info
  bill += `Order #: ${order.invoice}\n`;
  bill += `Date: ${new Date().toLocaleDateString()}\n`;
  bill += `Time: ${new Date().toLocaleTimeString()}\n`;
  bill += dash + '\n';
  
  // Customer Info
  bill += `Customer: ${order.user_info?.name || order.user?.name || 'Unknown'}\n`;
  bill += `Phone: ${order.user_info?.contact || order.user?.phone || 'N/A'}\n`;
  if (order.user_info?.address) {
    bill += `Address: ${order.user_info.address}\n`;
  }
  bill += dash + '\n';
  
  // Items Header
  bill += 'ITEMS\n';
  bill += dash + '\n';
  
  // Items
  if (order.deliveryInfo?.productChecklist) {
    order.deliveryInfo.productChecklist.forEach(item => {
      // Item name with truncation if needed
      const itemName = item.title.length > width 
        ? item.title.substring(0, width - 3) + '...'
        : item.title;
      bill += itemName + '\n';
      
      // Quantity and price
      const qtyPrice = `${item.quantity}x ${(item.price || 0).toFixed(2)}`;
      const total = `﷼${(item.quantity * (item.price || 0)).toFixed(2)}`;
      const spacing = width - qtyPrice.length - total.length;
      bill += `${qtyPrice}${' '.repeat(Math.max(0, spacing))}${total}\n`;
      
      // Unit info if available
      if (item.unitName && item.unitName !== 'Unit') {
        bill += `  Unit: ${item.unitName}\n`;
      }
    });
  }
  
  bill += dash + '\n';
  
  // Totals
  const subtotal = `Subtotal: ﷼${(order.subTotal || 0).toFixed(2)}`;
  bill += subtotal + '\n';
  
  if ((order.shippingCost || 0) > 0) {
    const delivery = `Delivery: ﷼${(order.shippingCost || 0).toFixed(2)}`;
    bill += delivery + '\n';
  }
  
  if ((order.discount || 0) > 0) {
    const discount = `Discount: ﷼${(order.discount || 0).toFixed(2)}`;
    bill += discount + '\n';
  }
  
  bill += line + '\n';
  const total = `TOTAL: ﷼${(order.total || 0).toFixed(2)}`;
  bill += centerText(total, width) + '\n';
  bill += line + '\n';
  
  // Payment Method
  bill += `Payment: ${order.paymentMethod || 'Cash'}\n`;
  
  // Footer
  bill += dash + '\n';
  bill += centerText('Thank you!', width) + '\n';
  bill += centerText('Visit us again', width) + '\n';
  
  return bill;
};

// Helper function to center text
const centerText = (text, width) => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
};

// Get Today's Earnings
const getTodayEarnings = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('💰 Getting earnings for driver:', driverId);
    
    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get start of week (Monday)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get start of month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Find delivered orders for different periods
    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      // Today's orders
      Order.find({
      'deliveryInfo.assignedDriver': driverId,
      status: 'Delivered',
      'deliveryInfo.deliveredAt': {
        $gte: startOfDay,
        $lte: endOfDay
      }
      }).lean(),
      
      // This week's orders
      Order.find({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered',
        'deliveryInfo.deliveredAt': {
          $gte: startOfWeek
        }
      }).lean(),
      
      // This month's orders
      Order.find({
        'deliveryInfo.assignedDriver': driverId,
        status: 'Delivered',
        'deliveryInfo.deliveredAt': {
          $gte: startOfMonth
        }
      }).lean()
    ]);
    
    // Calculate earnings based on total order amounts (driver gets full order value)
    const todayEarnings = todayOrders.reduce((total, order) => total + (order.total || 0), 0);
    const weekEarnings = weekOrders.reduce((total, order) => total + (order.total || 0), 0);
    const monthEarnings = monthOrders.reduce((total, order) => total + (order.total || 0), 0);
    
    console.log(`📊 Earnings - Today: ${todayEarnings} SAR (${todayOrders.length} deliveries), Week: ${weekEarnings} SAR (${weekOrders.length} deliveries), Month: ${monthEarnings} SAR (${monthOrders.length} deliveries)`);
    
    res.json({
      success: true,
      data: {
        todayEarnings,
        weekEarnings,
        monthEarnings,
        todayDeliveries: todayOrders.length,
        weekDeliveries: weekOrders.length,
        monthDeliveries: monthOrders.length,
        avgPerDelivery: todayOrders.length > 0 ? todayEarnings / todayOrders.length : 0
      },
      message: `Earnings calculated successfully`,
      stats: {
        deliveriesCount: todayOrders.length,
        totalEarnings: todayEarnings,
        averagePerDelivery: todayOrders.length > 0 ? todayEarnings / todayOrders.length : 0
      }
    });
    
  } catch (error) {
    console.error('❌ Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get earnings",
      error: error.message
    });
  }
};

// Get Completed Orders - Driver-specific completed orders
const getCompletedOrders = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📋 Getting completed orders for driver:', driverId);
    
    // Find completed orders for this specific driver only
    // This ensures drivers only see their own completed deliveries
    const completedOrders = await Order.find({
      'deliveryInfo.assignedDriver': driverId,
      status: { $in: ['Delivered', 'Completed'] }
    })
    .populate('user', 'name email phone')
    .sort({ deliveredAt: -1, updatedAt: -1 })
    .lean();
    
    console.log(`📦 Found ${completedOrders.length} completed orders for driver`);
    
    // Format orders for mobile app
    const mobileCompletedOrders = completedOrders.map(order => {
      return {
        _id: order._id,
        invoice: order.invoice,
        orderNumber: order.invoice,
        status: order.status,
        customer: {
          name: order.user_info?.name || order.user?.name || 'Unknown Customer',
          phone: order.user_info?.contact || order.user_info?.phone || order.user?.phone || order.user?.contact || order.contact || 'N/A',
          address: order.user_info?.address || order.shippingAddress?.address || '',
          city: order.user_info?.city || order.shippingAddress?.city || ''
        },
        customerName: order.user_info?.name || order.user?.name || 'Unknown Customer',
        total: order.total || 0,
        financial: {
          total: order.total || 0,
          currency: order.currency || '﷼',
          subtotal: order.subtotal || order.total || 0,
          delivery: order.deliveryCharge || 0,
          discount: order.discount || 0
        },
        paymentMethod: order.paymentMethod || 'Cash',
        deliveredAt: order.deliveredAt || order.updatedAt,
        completedAt: order.deliveredAt || order.updatedAt,
        createdAt: order.createdAt,
        // Add driver info for verification
        driverId: order.deliveryInfo?.assignedDriver,
        driverName: order.deliveryInfo?.driverName || 'Driver'
      };
    });
    
    // Calculate total earnings from completed orders
    const totalEarnings = mobileCompletedOrders.reduce((total, order) => {
      return total + (order.total || 0);
    }, 0);
    
    res.json({
      success: true,
      orders: mobileCompletedOrders,
      total: mobileCompletedOrders.length,
      totalEarnings: totalEarnings,
      message: `Found ${mobileCompletedOrders.length} completed orders`
    });
    
  } catch (error) {
    console.error('❌ Get completed orders error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get completed orders",
      error: error.message
    });
  }
};

// Mobile Clock In
const mobileClockIn = async (req, res) => {
  try {
    const driverId = req.user.userId;
    const { latitude, longitude } = req.body;
    
    console.log('📱 Mobile clock in for driver:', driverId);
    
    const driver = await Admin.findById(driverId);
    if (!driver || (driver.role !== "Driver" && driver.role !== "delivery-person")) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }
    
    if (driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        success: false,
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
    
    await driver.save();
    
    console.log('✅ Mobile clock in successful for:', driver.name.en || driver.email);
    
    res.json({
      success: true,
      message: "Successfully clocked in",
      data: {
        isOnDuty: true,
        shiftStartTime: driver.deliveryInfo.shiftStartTime,
        availability: driver.deliveryInfo.availability
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile clock in error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to clock in",
      error: error.message
    });
  }
};

// Mobile Clock Out
const mobileClockOut = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📱 Mobile clock out for driver:', driverId);
    
    const driver = await Admin.findById(driverId);
    if (!driver || (driver.role !== "Driver" && driver.role !== "delivery-person")) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }
    
    if (!driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message: `Cannot clock out. You have ${activeDeliveries} active deliveries.`
      });
    }
    
    // End shift
    const shiftEndTime = new Date();
    const shiftDuration = (shiftEndTime - driver.deliveryInfo.shiftStartTime) / 1000 / 60; // minutes
    
    driver.deliveryInfo.isOnDuty = false;
    driver.deliveryInfo.shiftEndTime = shiftEndTime;
    driver.deliveryInfo.availability = "offline";
    
    await driver.save();
    
    console.log('✅ Mobile clock out successful for:', driver.name.en || driver.email);
    
    res.json({
      success: true,
      message: "Successfully clocked out",
      data: {
        isOnDuty: false,
        shiftEndTime: shiftEndTime,
        shiftDuration: Math.round(shiftDuration),
        availability: driver.deliveryInfo.availability
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile clock out error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to clock out",
      error: error.message
    });
  }
};

// Get Mobile Driver Profile
const getMobileProfile = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📱 Getting mobile profile for driver:', driverId);
    
    const driver = await Admin.findById(driverId);
    if (!driver || (driver.role !== "Driver" && driver.role !== "delivery-person")) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }
    
    console.log('📊 Raw driver data from DB:', {
      driverId: driver._id,
      rawDeliveryInfo: driver.deliveryInfo,
      isOnBreak: driver.deliveryInfo?.isOnBreak,
      availability: driver.deliveryInfo?.availability
    });
    
    console.log('✅ Mobile profile retrieved for:', driver.name.en || driver.email);
    
    // Ensure deliveryInfo has all required fields
    const deliveryInfo = driver.deliveryInfo || {};
    const completeDeliveryInfo = {
      availability: deliveryInfo.availability || 'offline',
      isOnDuty: deliveryInfo.isOnDuty || false,
      isOnBreak: deliveryInfo.isOnBreak || false,
      breakStartTime: deliveryInfo.breakStartTime || null,
      breakEndTime: deliveryInfo.breakEndTime || null,
      clockInTime: deliveryInfo.clockInTime || null,
      clockOutTime: deliveryInfo.clockOutTime || null,
      shiftStartTime: deliveryInfo.shiftStartTime || null,
      currentLocation: deliveryInfo.currentLocation || null,
      breakHistory: deliveryInfo.breakHistory || []
    };
    
    console.log('📊 Driver status:', {
      isOnDuty: completeDeliveryInfo.isOnDuty,
      isOnBreak: completeDeliveryInfo.isOnBreak,
      availability: completeDeliveryInfo.availability
    });
    
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        deliveryInfo: completeDeliveryInfo
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message
    });
  }
};

// Debug endpoint to check order checklist structure
const debugOrderChecklist = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔧 Debug: Checking order checklist structure for:', orderId);
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const debugInfo = {
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      cartItems: order.cart?.map((item, index) => ({
        index,
        id: item.id,
        _id: item._id,
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        allKeys: Object.keys(item)
      })) || [],
      deliveryInfoExists: !!order.deliveryInfo,
      productChecklistExists: !!(order.deliveryInfo?.productChecklist),
      productChecklistLength: order.deliveryInfo?.productChecklist?.length || 0,
      productChecklist: order.deliveryInfo?.productChecklist?.map((item, index) => ({
        index,
        productId: item.productId,
        title: item.title,
        collected: item.collected,
        allKeys: Object.keys(item)
      })) || []
    };

    console.log('🔧 Debug info:', JSON.stringify(debugInfo, null, 2));

    res.json({
      success: true,
      data: debugInfo,
      message: "Debug information retrieved"
    });

  } catch (error) {
    console.error('❌ Debug order checklist error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get debug information",
      error: error.message
    });
  }
};

// Force regenerate checklist for debugging
const forceRegenerateChecklist = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔧 Force regenerating checklist for order:', orderId);
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Clear existing checklist
    order.deliveryInfo = order.deliveryInfo || {};
    order.deliveryInfo.productChecklist = [];
    
    // Regenerate checklist from cart
    if (order.cart && order.cart.length > 0) {
      productChecklist = [];
      
      order.cart.forEach((item, index) => {
        // Enhanced product information extraction
        const productTitle = item.title || 
                            item.name || 
                            item.productTitle || 
                            item.product?.title || 
                            item.product?.name || 
                            `Product ${index + 1}`;
                            
        console.log(`🔍 Processing cart item ${index}:`, {
          id: item.id,
          title: item.title,
          isCombo: item.isCombo,
          hasComboDetails: !!item.comboDetails,
          extractedTitle: productTitle
        });

        // Check if this is a combo product
        if (item.isCombo && item.comboDetails && item.comboDetails.productBreakdown) {
          console.log(`🎁 Breaking down combo: ${productTitle}`);
          
          // Add individual products from combo breakdown
          item.comboDetails.productBreakdown.forEach((comboProduct, comboIndex) => {
            const comboItem = {
              productId: comboProduct.productId || `combo_${index}_${comboIndex}`,
              productTitle: comboProduct.productTitle || `Combo Item ${comboIndex + 1}`, // Changed from 'title' to 'productTitle'
              quantity: comboProduct.quantity || 1,
              collected: false,
              collectedAt: null,
              notes: ""
            };
            
            productChecklist.push(comboItem);
            console.log(`  ├─ Added: ${comboItem.productTitle} (Qty: ${comboItem.quantity})`);
          });
          
        } else {
          // Regular product (not a combo)
          const regularItem = {
            productId: item.id || item._id?.toString() || `product_${index}`,
            productTitle: productTitle, // Changed from 'title' to 'productTitle'
            quantity: item.quantity || 1,
            collected: false,
            collectedAt: null,
            notes: ""
          };
          
          productChecklist.push(regularItem);
          console.log(`  ├─ Added regular product: ${regularItem.productTitle} (Qty: ${regularItem.quantity})`);
        }
      });
      
      order.deliveryInfo.productChecklist = productChecklist;
      await order.save();
      
      console.log(`✅ Regenerated ${productChecklist.length} checklist items`);
      
      res.json({
        success: true,
        message: "Checklist regenerated successfully",
        data: {
          checklistCount: productChecklist.length,
          checklist: productChecklist
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No cart items found to generate checklist from"
      });
    }
    
  } catch (error) {
    console.error("❌ Force regenerate checklist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate checklist",
      error: error.message
    });
  }
};

// Mobile Break In
const mobileBreakIn = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📱 Mobile break in for driver:', driverId);
    
    const driver = await Admin.findById(driverId);
    if (!driver || (driver.role !== "Driver" && driver.role !== "delivery-person")) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }
    
    if (!driver.deliveryInfo?.isOnDuty) {
      return res.status(400).json({
        success: false,
        message: "You must be on duty to take a break"
      });
    }
    
    if (driver.deliveryInfo?.isOnBreak) {
      return res.status(400).json({
        success: false,
        message: "You are already on break"
      });
    }
    
    // Start break
    if (!driver.deliveryInfo) driver.deliveryInfo = {};
    driver.deliveryInfo.isOnBreak = true;
    driver.deliveryInfo.breakStartTime = new Date();
    driver.deliveryInfo.availability = "busy"; // Set to busy during break
    
    console.log('📊 Before save - Driver break status:', {
      isOnBreak: driver.deliveryInfo.isOnBreak,
      breakStartTime: driver.deliveryInfo.breakStartTime,
      availability: driver.deliveryInfo.availability
    });
    
    await driver.save();
    
    console.log('📊 After save - Verifying driver break status in DB...');
    const verifyDriver = await Admin.findById(driverId);
    console.log('📊 Verification - Driver break status:', {
      isOnBreak: verifyDriver.deliveryInfo?.isOnBreak,
      breakStartTime: verifyDriver.deliveryInfo?.breakStartTime,
      availability: verifyDriver.deliveryInfo?.availability
    });
    
    console.log('✅ Mobile break in successful for:', driver.name?.en || driver.email);
    
    res.json({
      success: true,
      message: "Break started successfully",
      data: {
        isOnBreak: true,
        breakStartTime: driver.deliveryInfo.breakStartTime,
        availability: driver.deliveryInfo.availability
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile break in error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to start break",
      error: error.message
    });
  }
};

// Mobile Break Out
const mobileBreakOut = async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    console.log('📱 Mobile break out for driver:', driverId);
    
    const driver = await Admin.findById(driverId);
    if (!driver || (driver.role !== "Driver" && driver.role !== "delivery-person")) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }
    
    if (!driver.deliveryInfo?.isOnBreak) {
      return res.status(400).json({
        success: false,
        message: "You are not currently on break"
      });
    }
    
    // Calculate break duration
    const breakDuration = driver.deliveryInfo.breakStartTime ? 
      Math.round((new Date() - new Date(driver.deliveryInfo.breakStartTime)) / (1000 * 60)) : 0;
    
    // End break
    driver.deliveryInfo.isOnBreak = false;
    driver.deliveryInfo.breakEndTime = new Date();
    driver.deliveryInfo.availability = "available"; // Set back to available
    
    // Add to break history
    if (!driver.deliveryInfo.breakHistory) driver.deliveryInfo.breakHistory = [];
    driver.deliveryInfo.breakHistory.push({
      startTime: driver.deliveryInfo.breakStartTime,
      endTime: driver.deliveryInfo.breakEndTime,
      duration: breakDuration
    });
    
    // Clear break start time
    driver.deliveryInfo.breakStartTime = null;
    
    await driver.save();
    
    console.log('✅ Mobile break out successful for:', driver.name?.en || driver.email, `(${breakDuration} minutes)`);
    
    res.json({
      success: true,
      message: `Break ended successfully (${breakDuration} minutes)`,
      data: {
        isOnBreak: false,
        breakDuration: breakDuration,
        availability: driver.deliveryInfo.availability
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile break out error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to end break",
      error: error.message
    });
  }
};

module.exports = {
  mobileLogin,
  getMobileProfile,
  getMobileOrders,
  getMobileOrderDetails,
  mobileToggleProduct,
  mobileMarkOutForDelivery,
  mobileCompleteDelivery,
  generateBill,
  printBill,
  getTodayEarnings,
  getCompletedOrders,
  mobileClockIn,
  mobileClockOut,
  mobileBreakIn,
  mobileBreakOut,
  mobileAcceptOrder,
  debugOrderChecklist,
  forceRegenerateChecklist
}; 