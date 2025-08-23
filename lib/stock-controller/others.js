require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../../models/Product");
const ProductUnit = require("../../models/ProductUnit");
const LoyaltyService = require("../loyalty-system/loyaltyService");
const StockMovementLog = require("../../models/StockMovementLog");

// const base = 'https://api-m.sandbox.paypal.com';

// Use the main mongoose connection instead of creating a separate one
// Note: This will use the default mongoose connection established in start-server.js

// 🔄 SIMPLIFIED STOCK REDUCTION SYSTEM
// Now handles both normal and combo products uniformly
const handleProductQuantity = async (cart, orderData = null) => {
  try {
    console.log(`🚀 handleProductQuantity called with ${cart.length} cart items`);
    console.log(`📋 OrderData received:`, orderData ? {
      _id: orderData._id,
      invoice: orderData.invoice,
      admin_id: orderData.admin_id,
      status: orderData.status
    } : 'NULL');
    
    for (const p of cart) {
      console.log(`🔍 PROCESSING CART ITEM:`, {
        productId: p.productId || p._id || p.id,
        title: p.title,
        quantity: p.quantity,
        price: p.price,
        hasComboReference: !!p.comboReference
      });
      
      // NEW APPROACH: Check if this is a combo product by looking for comboReference
      // The frontend now sends individual products with comboReference field
      const isComboDeal = !!p.comboReference;
      
      console.log(`🔍 COMBO DETECTION RESULT:`, {
        isComboDeal,
        comboReference: p.comboReference,
        willProcess: true // Always process since frontend sends individual products
      });
      
      // Process as individual product (combo or normal)
      const productId = p.productId || p._id || p.id;
      const productQuantity = p.quantity || 1;
      
      if (productQuantity > 0) {
        const actualStockReduction = productQuantity;
        console.log(`📊 Processing product ${productId}: quantity=${productQuantity}, stock reduction=${actualStockReduction}, isCombo=${isComboDeal}`);

        try {
          const result = await Product.findOneAndUpdate(
            { _id: productId },
            {
              $inc: {
                stock: -actualStockReduction,
                sales: actualStockReduction,
              },
            },
            { new: true }
          );
          
          if (!result) {
            console.error(`Product ${productId} not found for stock reduction`);
            continue;
          }
          
          // Update ProductUnit pendingOdooQty for stock push system
          try {
            const productUnit = await ProductUnit.findOne({ 
              product: productId,
              ...(p.unit && p.unit._id && { unit: p.unit._id })
            });
            
            if (productUnit) {
              await ProductUnit.findByIdAndUpdate(productUnit._id, {
                $inc: { pendingOdooQty: -actualStockReduction }
              });
              console.log(`✅ Updated ProductUnit ${productUnit._id} pendingOdooQty by -${actualStockReduction}`);
            } else {
              console.log(`⚠️ No ProductUnit found for product ${productId}, stock push may not work`);
            }
          } catch (productUnitError) {
            console.error(`❌ Error updating ProductUnit pendingOdooQty:`, productUnitError.message);
          }
          
          // Create stock movement log for ALL products (combo or normal)
          if (orderData) {
            // Get the actual product details for proper identification
            const actualProduct = await Product.findById(productId).select('title sku odoo_id');
            const productTitle = actualProduct?.title?.en || actualProduct?.title || 'Unknown Product';
            const productSku = actualProduct?.sku || 'No SKU';
            const odooId = actualProduct?.odoo_id || null;
            
            const referenceDoc = isComboDeal 
              ? `Combo Order: ${orderData._id} - ${productTitle}`
              : `Order: ${orderData._id}`;
            
            console.log(`📊 CREATING STOCK MOVEMENT:`, {
              product: productId,
              product_title: productTitle,
              product_sku: productSku,
              odoo_id: odooId,
              movement_type: 'sale',
              quantity_before: result.stock + actualStockReduction,
              quantity_changed: -actualStockReduction,
              quantity_after: result.stock,
              invoice_number: orderData.invoice,
              reference_document: referenceDoc,
              user: orderData.admin_id,
              cost_per_unit: p.price || 0,
              total_value: (p.price || 0) * actualStockReduction,
              odoo_sync_status: 'pending',
              is_combo_deal: isComboDeal,
              combo_reference: isComboDeal ? `Combo: ${p.comboReference?.promotionName || 'Combo Deal'}` : null
            });
            
            try {
              // Find a default admin user if admin_id is not provided
              let adminId = orderData.admin_id;
              if (!adminId) {
                console.log(`⚠️ No admin_id provided, attempting to find default admin`);
                try {
                  const Admin = mongoose.model('Admin');
                  const defaultAdmin = await Admin.findOne({ role: 'Super Admin' }).select('_id');
                  if (defaultAdmin) {
                    adminId = defaultAdmin._id;
                    console.log(`✅ Found default admin: ${adminId}`);
                  } else {
                    console.error(`❌ No default admin found, cannot create stock movement`);
                    continue;
                  }
                } catch (adminError) {
                  console.error(`❌ Error finding default admin:`, adminError.message);
                  continue;
                }
              }
              
              const movement = await StockMovementLog.create({
                product: productId,
                product_title: productTitle,
                product_sku: productSku,
                odoo_id: odooId,
                movement_type: 'sale',
                quantity_before: result.stock + actualStockReduction,
                quantity_changed: -actualStockReduction,
                quantity_after: result.stock,
                invoice_number: orderData.invoice,
                reference_document: referenceDoc,
                user: adminId,
                cost_per_unit: p.price || 0,
                total_value: (p.price || 0) * actualStockReduction,
                odoo_sync_status: 'pending',
                is_combo_deal: isComboDeal,
                combo_reference: isComboDeal ? `Combo: ${p.comboReference?.promotionName || 'Combo Deal'}` : null
              });
              
              const movementType = isComboDeal ? 'COMBO' : 'NORMAL';
              console.log(`✅ ${movementType} STOCK MOVEMENT CREATED:`, movement._id);
            } catch (movementError) {
              console.error(`❌ ERROR CREATING STOCK MOVEMENT:`, movementError.message);
            }
          } else {
            console.warn(`⚠️ No orderData provided, skipping stock movement creation`);
          }
          
          // Check for low stock warning
          if (result.stock <= 10) {
            console.warn(`Low stock warning: ${result.title?.en || result.title} has only ${result.stock} units remaining`);
          }
          
          // Check for out of stock
          if (result.stock <= 0) {
            console.warn(`Out of stock: ${result.title?.en || result.title} is now out of stock`);
          }
        } catch (err) {
          console.error(`Error updating stock for product ${productId}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error(`Stock reduction error:`, error);
    throw error;
  }
};

const handleProductAttribute = async (key, value, multi) => {
  try {
    // const products = await Product.find({ 'variants.1': { $exists: true } });
    const products = await Product.find({ isCombination: true });

    // console.log('products', products);

    if (multi) {
      for (const p of products) {
        await Product.updateOne(
          { _id: p._id },
          {
            $pull: {
              variants: { [key]: { $in: value } },
            },
          }
        );
      }
    } else {
      for (const p of products) {
        // console.log('p', p._id);
        await Product.updateOne(
          { _id: p._id },
          {
            $pull: {
              variants: { [key]: value },
            },
          }
        );
      }
    }
  } catch (err) {
    console.log("err, when delete product variants", err.message);
  }
};

// Award loyalty points after successful order
const handleLoyaltyPoints = async (customerId, orderId, orderTotal) => {
  try {
    if (!customerId || !orderId || !orderTotal) {
      console.error('Missing required data for loyalty points:', { customerId, orderId, orderTotal });
      return;
    }
    
    const result = await LoyaltyService.awardPoints(customerId, orderId, orderTotal);
    
    return result;
  } catch (error) {
    console.error('Error handling loyalty points:', error.message);
    // Don't throw error to prevent order completion failure
  }
};

// Restore loyalty points when order is cancelled
const restoreLoyaltyPoints = async (customerId, orderId, loyaltyPointsUsed) => {
  try {
    if (!customerId || !loyaltyPointsUsed || loyaltyPointsUsed <= 0) {
      return { success: true, pointsRestored: 0, message: 'No points to restore' };
    }
    
    const result = await LoyaltyService.restorePointsFromCancelledOrder(customerId, orderId, loyaltyPointsUsed);
    
    if (!result.success) {
      console.error(`Failed to restore loyalty points:`, result);
    }
    
    return result;
  } catch (error) {
    console.error('Critical error restoring loyalty points:', {
      error: error.message,
      customerId,
      orderId,
      loyaltyPointsUsed
    });
    // Don't throw error to prevent cancellation failure, but return error info
    return { success: false, error: error.message, pointsRestored: 0 };
  }
};

// Restore stock quantities when order is cancelled
const restoreProductQuantity = (cartItem) => {
  if (cartItem && cartItem.length > 0) {
    cartItem.map(async (item) => {
      try {
        if (item.isCombo) {
          // Handle combo products
          if (item.selectedProducts && typeof item.selectedProducts === 'object') {
            for (const [productId, quantity] of Object.entries(item.selectedProducts)) {
              // For combo products, the quantity passed should be the actual stock reduction
              // which is combo quantity * product quantity in combo (already calculated in stock reduction)
              const comboStockRestore = item.quantity * quantity;
              // Pass null for unitId since combo products don't use product units
              // Pass the calculated stock restore directly without pack quantity multiplication
              await handleSingleProductRestoreDirect(productId, comboStockRestore);
            }
          }
        } else {
          // Handle regular products - prioritize productId over composite id
          const actualProductId = item.productId || item._id || item.id;
          await handleSingleProductRestore(actualProductId, item.selectedUnitId, item.quantity);
        }
      } catch (error) {
        console.error(`Error restoring quantity for item ${item.id}:`, error.message);
      }
    });
  }
};

// Helper function to restore quantity directly without pack calculation (for combo products)
const handleSingleProductRestoreDirect = async (productId, actualStockRestore) => {
  try {
    console.log(`🔄 RESTORING STOCK (DIRECT): Processing product ${productId}, actualStockRestore ${actualStockRestore}`);
    
    const result = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          stock: actualStockRestore,
          sales: -actualStockRestore // Reduce sales count by actual stock units
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ RESTORING STOCK (DIRECT): Restored ${actualStockRestore} to product ${result.title}, new stock: ${result.stock}`);
    } else {
      console.log(`❌ RESTORING STOCK (DIRECT): Failed to restore stock for product ${productId}`);
    }
  } catch (error) {
    console.error(`❌ RESTORING STOCK (DIRECT): Error restoring product ${productId} quantity:`, error.message);
  }
};

// Helper function to restore quantity for a single product
const handleSingleProductRestore = async (productId, unitId, quantity) => {
  try {
    console.log(`🔄 RESTORING STOCK: Processing product ${productId}, unit ${unitId}, quantity ${quantity}`);
    
    const product = await Product.findById(productId);
    if (!product) {
      console.log(`❌ RESTORING STOCK: Product ${productId} not found, skipping quantity restore`);
      return;
    }

    // Calculate actual stock restoration based on pack quantity
    let packQty = 1;
    
    // For multi-unit products, get the correct packQty
    if (unitId) {
      try {
        const ProductUnit = require("../../models/ProductUnit");
        const productUnit = await ProductUnit.findById(unitId);
        if (productUnit) {
          packQty = productUnit.packQty || 1;
          console.log(`✅ RESTORING STOCK: Found pack quantity from ProductUnit: ${packQty}`);
        } else {
          console.log(`⚠️ RESTORING STOCK: ProductUnit not found for ID: ${unitId}`);
        }
      } catch (error) {
        console.error(`❌ RESTORING STOCK: Error looking up ProductUnit:`, error.message);
      }
    }
    
    const actualStockRestore = quantity * packQty;
    
    console.log(`📊 RESTORE CALCULATION:`, {
      productId: productId,
      orderQuantity: quantity,
      packQty: packQty,
      actualStockRestore: actualStockRestore,
      unitId: unitId
    });

    // Always restore to main product stock
    const result = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          stock: actualStockRestore,
          sales: -quantity // Reduce sales count by order quantity
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ RESTORING STOCK: Restored ${actualStockRestore} to product ${product.title}, new stock: ${result.stock}`);
    } else {
      console.log(`❌ RESTORING STOCK: Failed to restore stock for product ${productId}`);
    }
  } catch (error) {
    console.error(`❌ RESTORING STOCK: Error restoring product ${productId} quantity:`, error.message);
  }
};

// Complete order cancellation handler
const handleOrderCancellation = async (order, cancelReason = 'Order cancelled') => {
  try {
    console.log(`🚀 ORDER CANCELLATION: Processing cancellation for order ${order._id || order.invoice}`);
    console.log(`📋 ORDER DETAILS:`, {
      orderId: order._id,
      invoice: order.invoice,
      customer: order.user,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      status: order.status,
      cartItems: order.cart?.length || 0
    });
    
    const results = {
      stockRestored: false,
      pointsRestored: false,
      pointsRestoredDetails: null,
      error: null
    };
    
    // Restore stock quantities
    if (order.cart && order.cart.length > 0) {
      console.log('📦 Restoring product quantities...');
      restoreProductQuantity(order.cart);
      results.stockRestored = true;
      console.log('✅ Product quantities restoration initiated');
    } else {
      console.log('⚠️ No cart items found to restore');
    }
    
    // Restore loyalty points if any were used
    if (order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0) {
      console.log(`💎 RESTORING LOYALTY POINTS: Found ${order.loyaltyPointsUsed} points to restore...`);
      const pointsResult = await restoreLoyaltyPoints(order.user, order._id, order.loyaltyPointsUsed);
      results.pointsRestored = pointsResult.success;
      results.pointsRestoredDetails = pointsResult;
      
      if (pointsResult.success) {
        console.log(`🎉 LOYALTY POINTS: Successfully restored ${order.loyaltyPointsUsed} points`);
      } else {
        console.error(`❌ LOYALTY POINTS: Failed to restore points:`, pointsResult);
        results.error = pointsResult.error;
      }
    } else {
      console.log('💎 No loyalty points to restore for this order');
    }
    
    console.log(`✅ ORDER CANCELLATION: Processing completed for order ${order._id || order.invoice}`, results);
    
    return {
      success: true,
      message: 'Order cancelled successfully',
      restoredPoints: order.loyaltyPointsUsed || 0,
      restoredItems: order.cart?.length || 0,
      details: results
    };
    
  } catch (error) {
    console.error('💥 ORDER CANCELLATION: Critical error processing order cancellation:', {
      error: error.message,
      orderId: order._id,
      invoice: order.invoice,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  handleProductQuantity,
  handleProductAttribute,
  handleLoyaltyPoints,
  restoreLoyaltyPoints,
  restoreProductQuantity,
  handleOrderCancellation,
};
