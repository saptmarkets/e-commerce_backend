/**
 * Odoo Integration Validation Utilities
 * Based on Plan 01: Order Creation Enhancement Plan
 */

// Validate order for Odoo sync requirements
const validateOrderForOdooSync = (orderData) => {
  const errors = [];
  
  // Required customer fields for Odoo
  if (!orderData.user_info?.name) {
    errors.push('Customer name is required for Odoo sync');
  }
  if (!orderData.user_info?.contact) {
    errors.push('Customer phone is required for Odoo sync');
  }
  
  // Required product fields for Odoo
  for (const item of orderData.cart) {
    if (!item.sku) {
      errors.push(`Product SKU is required for Odoo sync: ${item.title?.en || 'Unknown product'}`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Invalid quantity for product: ${item.title?.en || 'Unknown product'}`);
    }
  }
  
  // Validate SKU format (should start with "ODOO-")
  for (const item of orderData.cart) {
    if (item.sku && !item.sku.startsWith('ODOO-')) {
      errors.push(`Invalid SKU format for Odoo sync: ${item.sku}. Should start with "ODOO-"`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Order validation failed: ${errors.join(', ')}`);
  }
  
  return true;
};

// Validate orders before Odoo sync
const validateOrderForSync = (order) => {
  const issues = [];
  
  // Check customer data
  if (!order.user_info?.contact) {
    issues.push('Missing customer phone number');
  }
  if (!order.user_info?.name) {
    issues.push('Missing customer name');
  }
  
  // Check product data
  for (const item of order.cart) {
    if (!item.sku) {
      issues.push(`Missing SKU for product: ${item.title?.en || 'Unknown'}`);
    }
    if (!item.sku?.startsWith('ODOO-')) {
      issues.push(`Invalid SKU format: ${item.sku}`);
    }
  }
  
  // Check order status
  if (order.status !== 'Delivered') {
    issues.push(`Order not delivered: ${order.status}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

// Normalize data for consistent Odoo sync
const normalizeOrderData = (order) => {
  return {
    ...order,
    user_info: {
      ...order.user_info,
      contact: order.user_info.contact?.replace(/\s+/g, ''), // Remove spaces
      email: order.user_info.email?.toLowerCase(),           // Lowercase email
      name: order.user_info.name?.trim()                     // Trim name
    },
    cart: order.cart.map(item => ({
      ...item,
      sku: item.sku?.toUpperCase(),                          // Uppercase SKU
      quantity: Math.max(1, item.quantity || 1),            // Minimum quantity
      price: Math.max(0, item.price || 0)                   // Non-negative price
    }))
  };
};

// Enhanced customer data capture
const enhanceCustomerData = (userInfo) => {
  return {
    name: userInfo.name,
    contact: userInfo.contact,        // Phone (KEY for Odoo matching)
    email: userInfo.email,
    address: userInfo.address,
    city: userInfo.city,
    zipCode: userInfo.zipCode,
    
    // Additional fields for better Odoo integration
    country: userInfo.country || 'Saudi Arabia',
    area: userInfo.area,
    
    // Validation
    contact: userInfo.contact.replace(/\s+/g, ''), // Remove spaces from phone
    email: userInfo.email?.toLowerCase() // Normalize email
  };
};

// Enhanced product data capture
const enhanceProductData = (cartItems) => {
  return cartItems.map(item => ({
    productId: item.productId,
    title: item.title,
    sku: item.sku,                              // ODOO-xxxxx format
    price: item.price,
    quantity: item.quantity,
    selectedUnitId: item.selectedUnitId,
    packQty: item.packQty,
    
    // Additional fields for Odoo sync
    barcode: item.barcode,                      // Product barcode
    productName: item.title?.en || item.title,  // English name for Odoo
    unitPrice: item.price,                      // Price per unit
    lineTotal: item.price * item.quantity,      // Total for this line
    
    // Validation
    sku: item.sku?.toUpperCase(),              // Normalize SKU
    quantity: Math.max(1, item.quantity || 1)  // Ensure minimum quantity
  }));
};

module.exports = {
  validateOrderForOdooSync,
  validateOrderForSync,
  normalizeOrderData,
  enhanceCustomerData,
  enhanceProductData
};
