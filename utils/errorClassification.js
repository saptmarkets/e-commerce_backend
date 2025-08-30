/**
 * Error Classification and Retry Logic
 * Based on Plan 02: Odoo Integration Service Plan
 */

// Proper error classification
const classifyError = (error) => {
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
  
  if (error.message.includes('Invalid SKU format')) {
    return { type: 'non-retryable', category: 'data_validation' };
  }
  
  if (error.message.includes('Missing required fields')) {
    return { type: 'non-retryable', category: 'data_validation' };
  }
  
  // Timeout errors (retryable)
  if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
    return { type: 'retryable', category: 'timeout' };
  }
  
  // Rate limiting errors (retryable with backoff)
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return { type: 'retryable', category: 'rate_limit' };
  }
  
  // Server errors (retryable)
  if (error.code === 'ECONNRESET' || error.message.includes('server error')) {
    return { type: 'retryable', category: 'server_error' };
  }
  
  // Default to non-retryable for unknown errors
  return { type: 'non-retryable', category: 'unknown' };
};

// Improved retry logic with exponential backoff
const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorClassification = classifyError(error);
      
      if (attempt === maxRetries || errorClassification.type === 'non-retryable') {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      console.log(`⚠️ Retry ${attempt}/${maxRetries} (${errorClassification.category}) in ${delay}ms`);
      console.log(`   Error: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Retry logic for failed orders with proper error handling
const retryFailedOrders = async (sessionId, maxRetries = 3) => {
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
      failed: 0,
      errors: []
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
          results.errors.push({
            orderId: order.invoice,
            error: result.error
          });
        }
        
        results.retried++;
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          orderId: order.invoice,
          error: error.message
        });
        
        console.error(`❌ Retry failed for order ${order.invoice}: ${error.message}`);
      }
    }
    
    console.log(`✅ Retry completed: ${results.successful}/${results.retried} successful`);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Retry process failed: ${error.message}`);
    throw error;
  }
};

// Enhanced error logging
const logError = (operation, error, context = {}) => {
  const errorClassification = classifyError(error);
  
  const logEntry = {
    timestamp: new Date(),
    operation: operation,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    classification: errorClassification,
    context: context
  };
  
  console.error(`❌ ${operation} failed:`, logEntry);
  
  // Store in database for analysis
  // await ErrorLog.create(logEntry);
};

// Validate error response from Odoo
const validateOdooResponse = (response) => {
  if (!response) {
    throw new Error('Empty response from Odoo');
  }
  
  if (response.error) {
    throw new Error(`Odoo API error: ${response.error}`);
  }
  
  if (response.fault) {
    throw new Error(`Odoo fault: ${response.fault.faultString}`);
  }
  
  return response;
};

// Handle specific Odoo error types
const handleOdooError = (error) => {
  if (error.message.includes('Access Denied')) {
    throw new Error('Odoo authentication failed - check credentials');
  }
  
  if (error.message.includes('Record not found')) {
    throw new Error('Record not found in Odoo - check data validity');
  }
  
  if (error.message.includes('Validation Error')) {
    throw new Error('Data validation failed in Odoo - check required fields');
  }
  
  return error;
};

module.exports = {
  classifyError,
  retryOperation,
  retryFailedOrders,
  logError,
  validateOdooResponse,
  handleOdooError
};
