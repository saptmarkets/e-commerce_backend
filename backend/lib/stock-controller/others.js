require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../../models/Product");
const ProductUnit = require("../../models/ProductUnit");
const LoyaltyService = require("../loyalty-system/loyaltyService");

// const base = 'https://api-m.sandbox.paypal.com';

// Use the main mongoose connection instead of creating a separate one
// Note: This will use the default mongoose connection established in start-server.js

// 🔄 ENHANCED MULTI-UNIT STOCK REDUCTION SYSTEM
const handleProductQuantity = async (cart) => {
  try {
    console.log(`🔍 STOCK REDUCTION: Processing ${cart.length} cart items`);
    console.log(`📋 FULL CART DATA:`, JSON.stringify(cart, null, 2));
    
    for (const p of cart) {
      console.log(`\n📦 PROCESSING ITEM:`, {
        id: p._id || p.id,
        productId: p.productId,
        title: p.title,
        quantity: p.quantity,
        packQty: p.packQty,
        unitId: p.unitId,
        selectedUnitId: p.selectedUnitId,
        unit: p.unit,
        unitName: p.unitName,
        isCombo: p.isCombo,
        isCombination: p.isCombination,
        totalBaseUnits: p.totalBaseUnits
      });
      
      // Handle Mega Combo Deals
      if (p.isCombo && p.selectedProducts) {
        console.log(`🎯 Processing Mega Combo Deal: ${p.title || p.id}`, {
          comboQuantity: p.quantity,
          selectedProducts: p.selectedProducts,
          comboPrice: p.comboPrice
        });

        // Process each product in the combo
        for (const [productId, productQuantity] of Object.entries(p.selectedProducts)) {
          if (productQuantity > 0) {
            const actualComboStockReduction = p.quantity * productQuantity;
            
            console.log(`📦 Combo product stock reduction for ${productId}:`, {
              comboOrderQuantity: p.quantity,
              productQuantityInCombo: productQuantity,
              actualStockReduction: actualComboStockReduction
            });

            try {
              const result = await Product.findOneAndUpdate(
                { _id: productId },
                {
                  $inc: {
                    stock: -actualComboStockReduction,
                    sales: actualComboStockReduction, // Track actual units sold from stock
                  },
                },
                { new: true }
              );
              
              if (result) {
                console.log(`✅ Combo stock updated for ${productId}: ${result.stock} remaining`);
              } else {
                console.log(`⚠️ Product ${productId} not found for combo stock reduction`);
              }
            } catch (productUpdateErr) {
              console.error(`❌ Error updating stock for combo product ${productId}:`, productUpdateErr.message);
            }
          }
        }
        continue; // Skip regular processing for combo items
      }

      // 🎯 ENHANCED MULTI-UNIT PROCESSING
      // Calculate actual stock reduction based on pack quantity
      // If customer buys 3 CTN 12, we need to reduce stock by 3 × 12 = 36
      
      // Try to get packQty from various possible sources with priority order
      let packQty = 1;
      let unitId = null;
      let unitName = 'pieces';
      
      // Priority 1: Direct packQty from cart item
      if (p.packQty && p.packQty > 0) {
        packQty = p.packQty;
        console.log(`📊 Using direct packQty: ${packQty}`);
      }
      // Priority 2: From unit object
      else if (p.unit && p.unit.packQty && p.unit.packQty > 0) {
        packQty = p.unit.packQty;
        console.log(`📊 Using unit.packQty: ${packQty}`);
      }
      // Priority 3: From totalBaseUnits calculation
      else if (p.totalBaseUnits && p.quantity && p.totalBaseUnits > p.quantity) {
        packQty = Math.floor(p.totalBaseUnits / p.quantity);
        console.log(`📊 Calculated packQty from totalBaseUnits: ${packQty}`);
      }
      
      // Get unit information
      unitId = p.selectedUnitId || p.unitId || null;
      unitName = p.unitName || p.unit?.name || 'pieces';
      
      // For multi-unit products, try to find the correct packQty from ProductUnit
      if (unitId) {
        console.log(`🔍 MULTI-UNIT: Looking up pack quantity for unit ID: ${unitId}`);
        try {
          const productUnit = await ProductUnit.findById(unitId);
          if (productUnit) {
            packQty = productUnit.packQty || 1;
            unitName = productUnit.unit?.name || productUnit.unit?.shortCode || unitName;
            console.log(`✅ MULTI-UNIT: Found pack quantity from ProductUnit: ${packQty} (${unitName})`);
          } else {
            console.log(`⚠️ MULTI-UNIT: ProductUnit not found for ID: ${unitId}`);
          }
        } catch (error) {
          console.error(`❌ MULTI-UNIT: Error looking up ProductUnit:`, error.message);
        }
      }
      
      const actualStockReduction = p.quantity * packQty;
      
      // Determine the correct product ID for stock reduction
      // For multi-unit products, prioritize productId over composite id
      const actualProductId = p.productId || p._id || p.id;
      
      console.log(`📊 ENHANCED STOCK CALCULATION:`, {
        productId: actualProductId,
        orderQuantity: p.quantity,
        packQty: packQty,
        actualStockReduction: actualStockReduction,
        unitName: unitName,
        unitId: unitId,
        cartItemId: p.id,
        stockReductionRatio: `${p.quantity} × ${packQty} = ${actualStockReduction}`,
        rawProductId: p.productId,
        rawId: p._id || p.id
      });

      // Validate stock reduction makes sense
      if (actualStockReduction <= 0) {
        console.log(`⚠️ Invalid stock reduction (${actualStockReduction}), skipping product ${actualProductId}`);
        continue;
      }

      // Check if product exists before updating
      const existingProduct = await Product.findById(actualProductId);
      if (!existingProduct) {
        console.log(`❌ Product ${actualProductId} not found, skipping stock reduction`);
        continue;
      }

      // Validate sufficient stock
      if (existingProduct.stock < actualStockReduction) {
        console.log(`⚠️ Insufficient stock for ${actualProductId}: need ${actualStockReduction}, have ${existingProduct.stock}`);
        // Still proceed but log the issue
      }

      try {
        // Update product stock
        const result = await Product.findByIdAndUpdate(
          actualProductId,
          {
            $inc: {
              stock: -actualStockReduction,
              sales: p.quantity // Track order quantity, not base units
            }
          },
          { new: true }
        );

        if (result) {
          // Accumulate quantity to push back to Odoo (negative because it was sold)
          if (unitId) {
            try {
              await ProductUnit.findByIdAndUpdate(unitId, {
                $inc: { pendingOdooQty: -actualStockReduction }
              });
            } catch (qe) {
              console.warn(`⚠️ Could not update pendingOdooQty for unit ${unitId}:`, qe.message);
            }
          }

          console.log(`✅ STOCK UPDATED for ${actualProductId}:`, {
            productTitle: result.title?.en || result.title || 'Unknown',
            previousStock: existingProduct.stock,
            reduction: actualStockReduction,
            newStock: result.stock,
            unitsSold: p.quantity,
            unitName: unitName,
            packQty: packQty
          });
          
          // Check for low stock warning
          if (result.stock <= 10) {
            console.log(`⚠️ LOW STOCK WARNING: ${result.title?.en || result.title} has only ${result.stock} units remaining`);
          }
          
          // Check for out of stock
          if (result.stock <= 0) {
            console.log(`🚨 OUT OF STOCK: ${result.title?.en || result.title} is now out of stock`);
          }
        } else {
          console.log(`❌ Failed to update stock for product ${actualProductId}`);
        }
      } catch (err) {
        console.error(`❌ Error updating stock for product ${actualProductId}:`, err.message);
      }
    }
    
    console.log(`✅ STOCK REDUCTION COMPLETE: Processed ${cart.length} items`);
  } catch (error) {
    console.error(`🚨 STOCK REDUCTION ERROR:`, error);
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
      console.log('Missing required data for loyalty points:', { customerId, orderId, orderTotal });
      return;
    }

    console.log(`Processing loyalty points for customer ${customerId}, order ${orderId}, total ${orderTotal}`);
    
    const result = await LoyaltyService.awardPoints(customerId, orderId, orderTotal);
    
    if (result.success) {
      console.log(`Successfully awarded ${result.pointsAwarded} loyalty points to customer ${customerId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error handling loyalty points:', error.message);
    // Don't throw error to prevent order completion failure
  }
};

// Restore loyalty points when order is cancelled
const restoreLoyaltyPoints = async (customerId, orderId, loyaltyPointsUsed) => {
  try {
    console.log(`🔄 RESTORING POINTS: Starting restoration for customer ${customerId}, order ${orderId}, points: ${loyaltyPointsUsed}`);
    
    if (!customerId || !loyaltyPointsUsed || loyaltyPointsUsed <= 0) {
      console.log('❌ RESTORING POINTS: No loyalty points to restore for order:', orderId, { customerId, loyaltyPointsUsed });
      return { success: true, pointsRestored: 0, message: 'No points to restore' };
    }

    console.log(`✅ RESTORING POINTS: Processing ${loyaltyPointsUsed} loyalty points for customer ${customerId}, cancelled order ${orderId}`);
    
    const result = await LoyaltyService.restorePointsFromCancelledOrder(customerId, orderId, loyaltyPointsUsed);
    
    if (result.success) {
      console.log(`🎉 RESTORING POINTS: Successfully restored ${loyaltyPointsUsed} loyalty points to customer ${customerId}. New balance: ${result.newBalance}`);
    } else {
      console.error(`❌ RESTORING POINTS: Failed to restore points:`, result);
    }
    
    return result;
  } catch (error) {
    console.error('💥 RESTORING POINTS: Critical error restoring loyalty points:', {
      error: error.message,
      customerId,
      orderId,
      loyaltyPointsUsed,
      stack: error.stack
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
