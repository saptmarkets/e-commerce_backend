require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../../models/Product");
const ProductUnit = require("../../models/ProductUnit");
const LoyaltyService = require("../loyalty-system/loyaltyService");
const StockMovementLog = require("../../models/StockMovementLog");

// const base = 'https://api-m.sandbox.paypal.com';

// Use the main mongoose connection instead of creating a separate one
// Note: This will use the default mongoose connection established in start-server.js

// 🔄 ENHANCED MULTI-UNIT STOCK REDUCTION SYSTEM
const handleProductQuantity = async (cart, orderData = null) => {
  try {
    console.log(`🚀 handleProductQuantity called with ${cart.length} cart items`);
    console.log(`📋 OrderData received:`, orderData ? {
      _id: orderData._id,
      invoice: orderData.invoice,
      admin_id: orderData.admin_id,
      status: orderData.status
    } : 'NULL');
    console.log('📋 Cart items:', cart.map(item => ({
      productId: item.productId || item._id || item.id,
      quantity: item.quantity,
      selectedUnitId: item.selectedUnitId,
      unitId: item.unitId,
      unit: item.unit,
      packQty: item.packQty,
      isCombo: item.isCombo,
      selectedProducts: item.selectedProducts,
      title: item.title,
      comboDetails: item.comboDetails
    })));
    
    for (const p of cart) {
      console.log(`🔍 PROCESSING CART ITEM:`, {
        productId: p.productId || p._id || p.id,
        isCombo: p.isCombo,
        hasSelectedProducts: !!p.selectedProducts,
        selectedProducts: p.selectedProducts,
        title: p.title
      });
      
      // Handle Mega Combo Deals
      console.log(`🔍 COMBO CHECK:`, {
        isCombo: p.isCombo,
        isComboType: typeof p.isCombo,
        selectedProducts: p.selectedProducts,
        selectedProductsType: typeof p.selectedProducts,
        hasSelectedProducts: !!p.selectedProducts,
        selectedProductsKeys: p.selectedProducts ? Object.keys(p.selectedProducts) : null,
        comboDetails: p.comboDetails,
        title: p.title
      });
      
      // Check multiple combo deal conditions
      const isComboDeal = p.isCombo === true || p.isCombo === 'true' || p.comboDetails;
      const hasSelectedProducts = p.selectedProducts && Object.keys(p.selectedProducts).length > 0;
      
      console.log(`🔍 COMBO DETECTION RESULT:`, {
        isComboDeal,
        hasSelectedProducts,
        willProcess: isComboDeal && hasSelectedProducts,
        rawData: {
          isCombo: p.isCombo,
          selectedProducts: p.selectedProducts,
          comboDetails: p.comboDetails
        }
      });
      
      if (isComboDeal && hasSelectedProducts) {
        console.log(`🎯 PROCESSING COMBO DEAL:`, {
          isCombo: p.isCombo,
          isComboType: typeof p.isCombo,
          selectedProducts: p.selectedProducts,
          comboTitle: p.title || 'Combo Deal',
          quantity: p.quantity,
          comboDetails: p.comboDetails
        });
        
        // Process each product in the combo
        let productsToProcess = [];
        
        // Try selectedProducts first
        if (p.selectedProducts && Object.keys(p.selectedProducts).length > 0) {
          productsToProcess = Object.entries(p.selectedProducts).map(([productId, productQuantity]) => ({
            productId,
            productQuantity: Number(productQuantity)
          }));
        }
        // Fallback to comboDetails.productBreakdown
        else if (p.comboDetails && p.comboDetails.productBreakdown) {
          productsToProcess = p.comboDetails.productBreakdown.map(item => ({
            productId: item.productId,
            productQuantity: Number(item.quantity)
          }));
        }
        
        console.log(`📦 COMBO PRODUCTS TO PROCESS:`, productsToProcess);
        
        for (const { productId, productQuantity } of productsToProcess) {
          if (productQuantity > 0) {
            const actualComboStockReduction = p.quantity * productQuantity;

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
              
              if (!result) {
                console.error(`Product ${productId} not found for combo stock reduction`);
              } else {
                // Update ProductUnit pendingOdooQty for stock push system
                try {
                  // Find the ProductUnit that was used in the combo
                  const productUnit = await ProductUnit.findOne({ 
                    product: productId,
                    // Try to match by unit if available
                    ...(p.unit && p.unit._id && { unit: p.unit._id })
                  });
                  
                  if (productUnit) {
                    // Update pendingOdooQty for stock push
                    await ProductUnit.findByIdAndUpdate(productUnit._id, {
                      $inc: { pendingOdooQty: actualComboStockReduction }
                    });
                    console.log(`✅ Updated ProductUnit ${productUnit._id} pendingOdooQty by +${actualComboStockReduction} for combo`);
                  } else {
                    console.log(`⚠️ No ProductUnit found for combo product ${productId}, stock push may not work`);
                  }
                } catch (productUnitError) {
                  console.error(`❌ Error updating ProductUnit pendingOdooQty for combo:`, productUnitError.message);
                }
                
                // Create stock movement log for combo product with INDIVIDUAL PRODUCT DETAILS
                if (orderData) {
                  // Get the actual product details for proper identification
                  const actualProduct = await Product.findById(productId).select('title sku odoo_id');
                  const productTitle = actualProduct?.title?.en || actualProduct?.title || 'Unknown Product';
                  const productSku = actualProduct?.sku || 'No SKU';
                  const odooId = actualProduct?.odoo_id || null;
                  
                  console.log(`📊 CREATING COMBO STOCK MOVEMENT FOR INDIVIDUAL PRODUCT:`, {
                    product: productId,
                    product_title: productTitle,
                    product_sku: productSku,
                    odoo_id: odooId,
                    movement_type: 'sale',
                    quantity_before: result.stock + actualComboStockReduction,
                    quantity_changed: -actualComboStockReduction,
                    quantity_after: result.stock,
                    invoice_number: orderData.invoice,
                    reference_document: `Combo Order: ${orderData._id} - ${productTitle}`,
                    user: orderData.admin_id,
                    cost_per_unit: p.price || 0,
                    total_value: (p.price || 0) * actualComboStockReduction,
                    odoo_sync_status: 'pending',
                    is_combo_deal: true,
                    combo_reference: `Combo: ${p.title || 'Combo Deal'}`
                  });
                  
                  try {
                    // Find a default admin user if admin_id is not provided
                    let adminId = orderData.admin_id;
                    if (!adminId) {
                      console.log(`⚠️ No admin_id provided in orderData for combo, attempting to find default admin`);
                      try {
                        // Try to get the first admin user from the database
                        const Admin = mongoose.model('Admin');
                        const defaultAdmin = await Admin.findOne({ role: 'Super Admin' }).select('_id');
                        if (defaultAdmin) {
                          adminId = defaultAdmin._id;
                          console.log(`✅ Found default admin for combo: ${adminId}`);
                        } else {
                          console.error(`❌ No default admin found in database for combo, cannot create stock movement`);
                          continue; // Skip this product but continue with others
                        }
                      } catch (adminError) {
                        console.error(`❌ Error finding default admin for combo:`, adminError.message);
                        continue; // Skip this product but continue with others
                      }
                    }
                    
                    const movement = await StockMovementLog.create({
                      product: productId,
                      product_title: productTitle,
                      product_sku: productSku,
                      odoo_id: odooId,
                      movement_type: 'sale',
                      quantity_before: result.stock + actualComboStockReduction,
                      quantity_changed: -actualComboStockReduction,
                      quantity_after: result.stock,
                      invoice_number: orderData.invoice,
                      reference_document: `Combo Order: ${orderData._id} - ${productTitle}`,
                      user: adminId, // Use the admin ID we found or was provided
                      cost_per_unit: p.price || 0,
                      total_value: (p.price || 0) * actualComboStockReduction,
                      odoo_sync_status: 'pending',
                      is_combo_deal: true,
                      combo_reference: `Combo: ${p.title || 'Combo Deal'}`
                    });
                    console.log(`✅ COMBO STOCK MOVEMENT CREATED WITH PRODUCT DETAILS:`, movement._id);
                  } catch (movementError) {
                    console.error(`❌ ERROR CREATING COMBO STOCK MOVEMENT:`, movementError.message);
                  }
                } else {
                  console.warn(`⚠️ No orderData provided for combo, skipping stock movement creation`);
                }
              }
            } catch (productUpdateErr) {
              console.error(`❌ Error updating stock for combo product ${productId}:`, productUpdateErr.message);
            }
          }
        }
        console.log(`✅ COMBO DEAL PROCESSING COMPLETED`);
        continue; // Skip regular processing for combo items
      }
      
      // FALLBACK: If it looks like a combo but didn't match our conditions, log it
      if (p.title && p.title.toLowerCase().includes('combo') || p.title && p.title.toLowerCase().includes('offer')) {
        console.log(`⚠️ POTENTIAL COMBO MISSED:`, {
          title: p.title,
          isCombo: p.isCombo,
          selectedProducts: p.selectedProducts,
          comboDetails: p.comboDetails,
          rawItem: p
        });
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
        console.log(`�� Calculated packQty from totalBaseUnits: ${packQty}`);
      }
      
      // Get unit information
      unitId = p.selectedUnitId || p.unitId || null;
      unitName = p.unitName || p.unit?.name || 'pieces';
      
      // For multi-unit products, try to find the correct packQty from ProductUnit
      if (unitId) {
        try {
          const productUnit = await ProductUnit.findById(unitId);
          if (productUnit) {
            packQty = productUnit.packQty || 1;
            unitName = productUnit.unit?.name || productUnit.unit?.shortCode || unitName;
          }
        } catch (error) {
          console.error(`Error looking up ProductUnit:`, error.message);
        }
      }
      
      const actualStockReduction = p.quantity * packQty;
      
      // Determine the correct product ID for stock reduction
      // For multi-unit products, prioritize productId over composite id
      const actualProductId = p.productId || p._id || p.id;
      
      // Validate stock reduction makes sense
      if (actualStockReduction <= 0) {
        continue;
      }

      // Check if product exists before updating
      const existingProduct = await Product.findById(actualProductId);
      if (!existingProduct) {
        console.error(`Product ${actualProductId} not found, skipping stock reduction`);
        continue;
      }

      // Validate sufficient stock
      if (existingProduct.stock < actualStockReduction) {
        console.warn(`Insufficient stock for ${actualProductId}: need ${actualStockReduction}, have ${existingProduct.stock}`);
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
          // Create stock movement log
          if (orderData) {
            console.log(`📊 CREATING STOCK MOVEMENT:`, {
              product: actualProductId,
              movement_type: 'sale',
              quantity_before: result.stock + actualStockReduction,
              quantity_changed: -actualStockReduction,
              quantity_after: result.stock,
              invoice_number: orderData.invoice,
              reference_document: `Order: ${orderData._id}`,
              user: orderData.admin_id,
              cost_per_unit: p.price || 0,
              total_value: (p.price || 0) * actualStockReduction,
              odoo_sync_status: 'pending'
            });
            
            try {
              // Find a default admin user if admin_id is not provided
              let adminId = orderData.admin_id;
              if (!adminId) {
                console.log(`⚠️ No admin_id provided in orderData, attempting to find default admin`);
                try {
                  // Try to get the first admin user from the database
                  const Admin = mongoose.model('Admin');
                  const defaultAdmin = await Admin.findOne({ role: 'Super Admin' }).select('_id');
                  if (defaultAdmin) {
                    adminId = defaultAdmin._id;
                    console.log(`✅ Found default admin: ${adminId}`);
                  } else {
                    console.error(`❌ No default admin found in database, cannot create stock movement`);
                    return; // Skip stock movement creation
                  }
                } catch (adminError) {
                  console.error(`❌ Error finding default admin:`, adminError.message);
                  return; // Skip stock movement creation
                }
              }
              
              const movement = await StockMovementLog.create({
                product: actualProductId,
                movement_type: 'sale',
                quantity_before: result.stock + actualStockReduction,
                quantity_changed: -actualStockReduction,
                quantity_after: result.stock,
                invoice_number: orderData.invoice,
                reference_document: `Order: ${orderData._id}`,
                user: adminId, // Use the admin ID we found or was provided
                cost_per_unit: p.price || 0,
                total_value: (p.price || 0) * actualStockReduction,
                odoo_sync_status: 'pending'
              });
              console.log(`✅ STOCK MOVEMENT CREATED:`, movement._id);
            } catch (movementError) {
              console.error(`❌ ERROR CREATING STOCK MOVEMENT:`, movementError.message);
            }
          } else {
            console.warn(`⚠️ No orderData provided, skipping stock movement creation`);
          }

          // Accumulate quantity to push back to Odoo (negative because it was sold)
          if (unitId) {
            try {
              console.log(`📦 UPDATING pendingOdooQty: unitId=${unitId}, actualStockReduction=${actualStockReduction}, current pendingOdooQty will be decremented by ${actualStockReduction}`);
              await ProductUnit.findByIdAndUpdate(unitId, {
                $inc: { pendingOdooQty: -actualStockReduction }
              });
              console.log(`✅ Successfully updated pendingOdooQty for unit ${unitId}`);
            } catch (qe) {
              console.warn(`⚠️ Could not update pendingOdooQty for unit ${unitId}:`, qe.message);
            }
          } else {
            console.warn(`⚠️ No unitId found for product ${actualProductId}, skipping pendingOdooQty update`);
          }

          // Check for low stock warning
          if (result.stock <= 10) {
            console.warn(`Low stock warning: ${result.title?.en || result.title} has only ${result.stock} units remaining`);
          }
          
          // Check for out of stock
          if (result.stock <= 0) {
            console.warn(`Out of stock: ${result.title?.en || result.title} is now out of stock`);
          }
        } else {
          console.error(`Failed to update stock for product ${actualProductId}`);
        }
      } catch (err) {
        console.error(`Error updating stock for product ${actualProductId}:`, err.message);
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
