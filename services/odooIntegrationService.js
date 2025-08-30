const OdooService = require('./odooService');
const Order = require('../models/Order');
const OrderPushSession = require('../models/OrderPushSession');

class OdooIntegrationService extends OdooService {
  constructor() {
    super(); // Call parent constructor
  }

  // Core methods
  async resolveCustomer(customerData) {
    const { name, contact, email, address, city, zipCode } = customerData;
    
    try {
      // Step 1: Search by phone (primary for loyalty points)
      const existingCustomer = await this.searchRead('res.partner', [
        ['phone', '=', contact],
        ['customer_rank', '>', 0]
      ], ['id', 'name', 'phone', 'email', 'street', 'city', 'zip']);
      
      if (existingCustomer.length > 0) {
        console.log(`✅ Customer found by phone: ${contact}`);
        return {
          partnerId: existingCustomer[0].id,
          wasCreated: false
        };
      }
      
      // Step 2: Search by email (fallback)
      if (email) {
        const customerByEmail = await this.searchRead('res.partner', [
          ['email', '=', email],
          ['customer_rank', '>', 0]
        ], ['id', 'name', 'phone', 'email']);
        
        if (customerByEmail.length > 0) {
          console.log(`✅ Customer found by email: ${email}`);
          return {
            partnerId: customerByEmail[0].id,
            wasCreated: false
          };
        }
      }
      
      // Step 3: Create new customer
      console.log(`🆕 Creating new customer: ${name} (${contact})`);
      const newPartnerId = await this.create('res.partner', {
        name: name,
        phone: contact,
        email: email,
        street: address,
        city: city,
        zip: zipCode,
        customer_rank: 1,
        is_company: false,
        country_id: 191, // Saudi Arabia
        ref: `ECO-${Date.now()}`
      });
      
      return {
        partnerId: newPartnerId,
        wasCreated: true
      };
      
    } catch (error) {
      console.error(`❌ Customer resolution failed: ${error.message}`);
      throw error;
    }
  }

  async resolveProduct(productData) {
    const { sku, title, price, barcode } = productData;
    
    try {
      // Step 1: Search by full SKU first (most reliable)
      let product = await this.searchRead('product.product', [
        ['default_code', '=', sku], // "ODOO-29542"
        ['sale_ok', '=', true]
      ], ['id', 'name', 'default_code', 'lst_price', 'uom_id']);
      
      // Step 2: If not found, try numeric part only
      if (product.length === 0 && sku.startsWith('ODOO-')) {
        const numericPart = sku.replace('ODOO-', '');
        product = await this.searchRead('product.product', [
          ['default_code', '=', numericPart], // "29542"
          ['sale_ok', '=', true]
        ], ['id', 'name', 'default_code', 'lst_price', 'uom_id']);
      }
      
      // Step 3: If still not found, try barcode (if available)
      if (product.length === 0 && barcode) {
        product = await this.searchRead('product.product', [
          ['barcode', '=', barcode],
          ['sale_ok', '=', true]
        ], ['id', 'name', 'default_code', 'lst_price', 'uom_id']);
      }
      
      if (product.length === 0) {
        throw new Error(`Product not found in Odoo: ${sku}`);
      }
      
      console.log(`✅ Product found: ${product[0].name} (${sku})`);
      
      return {
        productId: product[0].id,
        productName: product[0].name,
        defaultPrice: product[0].lst_price,
        defaultUomId: product[0].uom_id[0],
        resolvedSku: product[0].default_code
      };
      
    } catch (error) {
      console.error(`❌ Product resolution failed: ${error.message}`);
      throw error;
    }
  }

  async createSalesOrder(orderData) {
    const startTime = Date.now();
    
    try {
      // Step 1: Resolve customer
      const customerResult = await this.resolveCustomer(orderData.user_info);
      
      // Step 2: Resolve products and collect details
      const orderLines = [];
      const productDetails = []; // Collect for reporting
      
      for (const cartItem of orderData.cart) {
        const productResult = await this.resolveProduct(cartItem);
        
        orderLines.push([0, 0, {
          product_id: productResult.productId,
          product_uom_qty: cartItem.quantity,
          price_unit: cartItem.price,
          name: cartItem.title?.en || cartItem.title,
          product_uom: productResult.defaultUomId
        }]);
        
        // Collect product details for reporting
        productDetails.push({
          productId: productResult.productId,
          productName: productResult.productName,
          sku: productResult.resolvedSku,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          lineTotal: cartItem.price * cartItem.quantity
        });
      }
      
      // Step 3: Add loyalty discount (simple approach)
      if (orderData.loyaltyDiscount > 0) {
        const discountProduct = await this.findOrCreateDiscountProduct();
        
        orderLines.push([0, 0, {
          product_id: discountProduct.id,
          product_uom_qty: 1,
          price_unit: -orderData.loyaltyDiscount, // Negative price only
          name: `Loyalty Points Discount (${orderData.loyaltyPointsUsed} points)`
        }]);
      }
      
      // Step 4: Create order
      const odooOrderData = {
        partner_id: customerResult.partnerId,
        date_order: orderData.createdAt,
        client_order_ref: orderData.invoice.toString(),
        origin: `ECO-${orderData.invoice}`,
        state: 'sale',
        order_line: orderLines,
        note: `Order from E-commerce\nCustomer: ${orderData.user_info.name}\nPhone: ${orderData.user_info.contact}\nOrder ID: ${orderData.invoice}`,
        ref: `ECO-${orderData.invoice}`
      };
      
      const odooOrderId = await this.create('sale.order', odooOrderData);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Order created: ${odooOrderId} (${processingTime}ms)`);
      
      return {
        success: true,
        odooOrderId: odooOrderId,
        odooCustomerId: customerResult.partnerId,
        customerWasCreated: customerResult.wasCreated,
        productDetails: productDetails, // Return for session tracking
        processingTime: processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Order creation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        processingTime: processingTime,
        productDetails: [] // Empty array for failed orders
      };
    }
  }

  async findOrCreateDiscountProduct() {
    try {
      // Search for existing discount product
      const discountProduct = await this.searchRead('product.product', [
        ['default_code', '=', 'LOYALTY-DISCOUNT'],
        ['sale_ok', '=', true]
      ], ['id', 'name', 'lst_price']);
      
      if (discountProduct.length > 0) {
        return discountProduct[0];
      }
      
      // Create new discount product
      const newDiscountProductId = await this.create('product.product', {
        name: 'Loyalty Points Discount',
        default_code: 'LOYALTY-DISCOUNT',
        sale_ok: true,
        purchase_ok: false,
        type: 'service',
        lst_price: 0,
        standard_price: 0,
        uom_id: 1, // Units
        uom_po_id: 1,
        invoice_policy: 'order',
        expense_policy: 'no'
      });
      
      console.log(`✅ Created loyalty discount product: ${newDiscountProductId}`);
      
      return {
        id: newDiscountProductId,
        name: 'Loyalty Points Discount',
        lst_price: 0
      };
      
    } catch (error) {
      console.error(`❌ Failed to create discount product: ${error.message}`);
      throw error;
    }
  }

  // Production-ready batch processing with performance optimization
  async processOrderBatch(sessionId, targetDate, adminId) {
    console.log(`🚀 Starting batch processing: ${sessionId}`);
    
    try {
      // Step 1: Create session
      const session = await OrderPushSession.create({
        sessionId: sessionId,
        sessionDate: new Date(),
        status: 'processing',
        settings: {
          targetDate: targetDate,
          orderStatus: ['Delivered'],
          maxRetries: 3
        },
        initiatedBy: adminId,
        startedAt: new Date()
      });
      
      // Step 2: Find orders
      const orders = await Order.find({
        'odooSync.status': 'pending',
        status: 'Delivered',
        createdAt: {
          $gte: new Date(targetDate),
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      console.log(`📊 Found ${orders.length} orders`);
      
      // Step 3: Initialize counters and results arrays
      const orderResults = [];
      const sessionCounters = {
        totalOrdersFound: orders.length,
        totalOrdersProcessed: 0,
        totalOrdersSuccess: 0,
        totalOrdersFailed: 0,
        totalAmount: 0,
        totalProducts: 0,
        newCustomersCreated: 0,
        existingCustomersUsed: 0
      };
      
      // Step 4: Process orders in chunks (performance optimization)
      const chunkSize = 10; // Process 10 orders at a time
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < orders.length; i += chunkSize) {
        const chunk = orders.slice(i, i + chunkSize);
        console.log(`🔄 Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(orders.length / chunkSize)}`);
        
        // Process chunk
        for (const order of chunk) {
          try {
            console.log(`🔄 Processing order: ${order.invoice}`);
            
            const result = await this.createSalesOrder(order);
            
            // Prepare detailed result
            const orderResult = {
              orderObjectId: order._id,
              invoiceNumber: order.invoice,
              customerInfo: {
                name: order.user_info.name,
                phone: order.user_info.contact,
                email: order.user_info.email,
                wasCreated: result.customerWasCreated
              },
              orderTotal: order.total,
              itemCount: order.cart.length,
              products: result.productDetails || [],
              syncStatus: result.success ? 'synced' : 'failed',
              odooOrderId: result.odooOrderId,
              odooCustomerId: result.odooCustomerId,
              processingTime: result.processingTime,
              errorMessage: result.error,
              syncedAt: result.success ? new Date() : null
            };
            
            // Update order status immediately (for transaction safety)
            if (result.success) {
              await Order.findByIdAndUpdate(order._id, {
                'odooSync.status': 'synced',
                'odooSync.odooOrderId': result.odooOrderId,
                'odooSync.odooCustomerId': result.odooCustomerId,
                'odooSync.sessionId': sessionId,
                'odooSync.syncedAt': new Date(),
                'odooSync.attempts': (order.odooSync?.attempts || 0) + 1
              });
              
              results.successful++;
              sessionCounters.totalOrdersSuccess++;
            } else {
              await Order.findByIdAndUpdate(order._id, {
                'odooSync.status': 'failed',
                'odooSync.errorMessage': result.error,
                'odooSync.sessionId': sessionId,
                'odooSync.attempts': (order.odooSync?.attempts || 0) + 1,
                'odooSync.lastAttemptAt': new Date()
              });
              
              results.failed++;
              sessionCounters.totalOrdersFailed++;
              results.errors.push({
                orderId: order.invoice,
                error: result.error
              });
            }
            
            // Add to results array and update counters
            orderResults.push(orderResult);
            sessionCounters.totalOrdersProcessed++;
            sessionCounters.totalAmount += order.total;
            sessionCounters.totalProducts += order.cart.length;
            sessionCounters.newCustomersCreated += result.customerWasCreated ? 1 : 0;
            sessionCounters.existingCustomersUsed += result.customerWasCreated ? 0 : 1;
            
            results.processed++;
            
          } catch (error) {
            // Handle unexpected errors
            results.failed++;
            sessionCounters.totalOrdersFailed++;
            results.errors.push({
              orderId: order.invoice,
              error: error.message
            });
            
            // Add failed result
            orderResults.push({
              orderObjectId: order._id,
              invoiceNumber: order.invoice,
              customerInfo: {
                name: order.user_info.name,
                phone: order.user_info.contact,
                email: order.user_info.email,
                wasCreated: false
              },
              orderTotal: order.total,
              itemCount: order.cart.length,
              products: [],
              syncStatus: 'failed',
              errorMessage: error.message,
              syncedAt: null
            });
            
            sessionCounters.totalOrdersProcessed++;
          }
        }
        
        // Small delay between chunks to prevent overwhelming Odoo
        if (i + chunkSize < orders.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Step 5: Single session update at the end (performance optimization)
      sessionCounters.successRate = sessionCounters.totalOrdersProcessed > 0 
        ? (sessionCounters.totalOrdersSuccess / sessionCounters.totalOrdersProcessed) * 100 
        : 0;
      
      await OrderPushSession.findByIdAndUpdate(session._id, {
        status: 'completed',
        completedAt: new Date(),
        orderResults: orderResults,
        summary: sessionCounters,
        processingTime: Date.now() - session.startedAt.getTime()
      });
      
      console.log(`✅ Batch completed: ${results.successful}/${results.processed} synced`);
      
      return { sessionId, results };
      
    } catch (error) {
      console.error(`❌ Batch processing failed: ${error.message}`);
      throw error;
    }
  }

  // Proper error classification
  classifyError(error) {
    // Network/Connection errors (retryable)
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED') {
      return { type: 'retryable', category: 'network' };
    }
    
    // Odoo-specific errors
    if (error.message.includes('Authentication failed')) {
      return { type: 'non-retryable', category: 'authentication' };
    }
    
    if (error.message.includes('Product not found')) {
      return { type: 'non-retryable', category: 'data_validation' };
    }
    
    if (error.message.includes('Customer not found')) {
      return { type: 'non-retryable', category: 'data_validation' };
    }
    
    // Timeout errors (retryable)
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return { type: 'retryable', category: 'timeout' };
    }
    
    // Default to non-retryable for unknown errors
    return { type: 'non-retryable', category: 'unknown' };
  }

  // Improved retry logic
  async retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorClassification = this.classifyError(error);
        
        if (attempt === maxRetries || errorClassification.type === 'non-retryable') {
          throw error;
        }
        
        const delay = 2000 * attempt; // Simple linear backoff
        console.log(`⚠️ Retry ${attempt}/${maxRetries} (${errorClassification.category}) in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Retry logic for failed orders
  async retryFailedOrders(sessionId, maxRetries = 3) {
    try {
      // Find failed orders from session
      const failedOrders = await Order.find({
        'odooSync.sessionId': sessionId,
        'odooSync.status': 'failed',
        'odooSync.attempts': { $lt: maxRetries }
      });
      
      console.log(`🔄 Retrying ${failedOrders.length} failed orders`);
      
      const results = {
        retried: 0,
        successful: 0,
        failed: 0
      };
      
      for (const order of failedOrders) {
        try {
          const result = await this.createSalesOrder(order);
          
          if (result.success) {
            await Order.findByIdAndUpdate(order._id, {
              'odooSync.status': 'synced',
              'odooSync.odooOrderId': result.odooOrderId,
              'odooSync.attempts': order.odooSync.attempts + 1,
              'odooSync.syncedAt': new Date()
            });
            
            results.successful++;
          } else {
            await Order.findByIdAndUpdate(order._id, {
              'odooSync.attempts': order.odooSync.attempts + 1,
              'odooSync.lastAttemptAt': new Date(),
              'odooSync.errorMessage': result.error
            });
            
            results.failed++;
          }
          
          results.retried++;
          
        } catch (error) {
          results.failed++;
          console.error(`❌ Retry failed for order ${order.invoice}: ${error.message}`);
        }
      }
      
      console.log(`✅ Retry completed: ${results.successful}/${results.retried} successful`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ Retry process failed: ${error.message}`);
      throw error;
    }
  }

  // Performance monitoring
  monitorOdooPerformance = {
    apiCalls: 0,
    totalTime: 0,
    errors: 0,
    
    startCall() {
      this.apiCalls++;
      return Date.now();
    },
    
    endCall(startTime) {
      this.totalTime += Date.now() - startTime;
    },
    
    recordError() {
      this.errors++;
    },
    
    getStats() {
      return {
        totalCalls: this.apiCalls,
        averageTime: this.apiCalls > 0 ? this.totalTime / this.apiCalls : 0,
        errorRate: this.apiCalls > 0 ? (this.errors / this.apiCalls) * 100 : 0,
        totalErrors: this.errors
      };
    }
  };

  // Enhanced logging for debugging
  logOdooOperation(operation, data, result, error = null) {
    const logEntry = {
      timestamp: new Date(),
      operation: operation,
      data: data,
      result: result,
      error: error,
      processingTime: result?.processingTime || 0
    };
    
    if (error) {
      console.error(`❌ Odoo ${operation} failed:`, logEntry);
    } else {
      console.log(`✅ Odoo ${operation} successful:`, logEntry);
    }
    
    // Store in database for analysis
    // await OdooLog.create(logEntry);
  }

  // Validate environment variables
  validateOdooConfig() {
    const requiredEnvVars = {
      ODOO_URL: 'https://your-odoo-instance.com',
      ODOO_DATABASE: 'your_database_name',
      ODOO_USERNAME: 'your_username',
      ODOO_PASSWORD: 'your_password'
    };
    
    const missing = [];
    
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Create Odoo order (single order)
  async createOdooOrder(order) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Creating Odoo order for invoice: ${order.invoice}`);
      
      // Step 1: Resolve customer
      const customerResult = await this.resolveCustomer({
        name: order.user_info.name,
        contact: order.user_info.contact,
        email: order.user_info.email,
        address: order.user_info.address,
        city: order.user_info.city,
        zipCode: order.user_info.zipCode
      });
      
      // Step 2: Resolve products and create order lines
      const orderLines = [];
      const productDetails = [];
      
      for (const item of order.cart) {
        try {
          const productResult = await this.resolveProduct({
            sku: item.sku,
            title: item.title,
            price: item.price,
            barcode: item.barcode
          });
          
          orderLines.push([
            0, 0, {
              product_id: productResult.productId,
              name: item.title,
              product_uom_qty: item.quantity,
              price_unit: item.price,
              product_uom: productResult.defaultUomId
            }
          ]);
          
          productDetails.push({
            sku: item.sku,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            odooProductId: productResult.productId
          });
          
        } catch (error) {
          console.error(`❌ Product resolution failed for ${item.sku}: ${error.message}`);
          throw error;
        }
      }
      
      // Step 3: Create sales order
      const orderData = {
        partner_id: customerResult.partnerId,
        date_order: order.createdAt,
        order_line: orderLines,
        payment_term_id: 1, // Default payment term
        pricelist_id: 1, // Default pricelist
        team_id: 1, // Default sales team
        user_id: 1, // Default salesperson
        ref: `ECO-${order.invoice}`,
        note: `E-commerce order #${order.invoice}`,
        state: 'draft'
      };
      
      const odooOrderId = await this.create('sale.order', orderData);
      
      // Step 4: Confirm the order
      await this.execute('sale.order', 'action_confirm', [odooOrderId]);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Odoo order created successfully: ${odooOrderId} (${processingTime}ms)`);
      
      return {
        success: true,
        odooOrderId: odooOrderId,
        odooCustomerId: customerResult.partnerId,
        customerWasCreated: customerResult.wasCreated,
        productDetails: productDetails,
        processingTime: processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Odoo order creation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        processingTime: processingTime
      };
    }
  }
}

module.exports = OdooIntegrationService;
