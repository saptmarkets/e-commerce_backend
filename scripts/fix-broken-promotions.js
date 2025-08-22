const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Promotion = require('../models/Promotion');
const ProductUnit = require('../models/ProductUnit');
const Product = require('../models/Product');
const OdooPricelistItem = require('../models/OdooPricelistItem');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixBrokenPromotions() {
  console.log('🔧 Starting broken promotions fix...');
  
  try {
    // Find all fixed_price promotions with null or invalid productUnit
    const brokenPromotions = await Promotion.find({
      type: 'fixed_price',
      $or: [
        { productUnit: null },
        { productUnit: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${brokenPromotions.length} broken promotions to fix`);
    
    if (brokenPromotions.length === 0) {
      console.log('✅ No broken promotions found!');
      return;
    }
    
    let fixedCount = 0;
    let unfixableCount = 0;
    
    for (const promotion of brokenPromotions) {
      console.log(`\n🔍 Fixing promotion ${promotion._id}...`);
      
      try {
        // Try to find the corresponding OdooPricelistItem to get product info
        const odooItem = await OdooPricelistItem.findOne({
          store_promotion_id: promotion._id
        });
        
        if (!odooItem) {
          console.log(`❌ No OdooPricelistItem found for promotion ${promotion._id}`);
          unfixableCount++;
          continue;
        }
        
        console.log(`📦 Found Odoo item: product_id=${odooItem.product_id}, barcode_unit_id=${odooItem.barcode_unit_id}`);
        
        let targetProductId = null;
        
        // Strategy 1: Try to find product by barcode_unit_id first
        if (odooItem.barcode_unit_id) {
          const barcodeUnit = await require('../models/OdooBarcodeUnit').findOne({
            id: odooItem.barcode_unit_id
          });
          
          if (barcodeUnit && barcodeUnit.store_product_unit_id) {
            const productUnit = await ProductUnit.findById(barcodeUnit.store_product_unit_id);
            if (productUnit && productUnit.product) {
              targetProductId = productUnit.product;
              console.log(`✅ Found product via barcode unit: ${targetProductId}`);
            }
          }
        }
        
        // Strategy 2: Try to find product by product_id
        if (!targetProductId && odooItem.product_id) {
          const odooProduct = await require('../models/OdooProduct').findOne({
            id: odooItem.product_id
          });
          
          if (odooProduct && odooProduct.store_product_id) {
            targetProductId = odooProduct.store_product_id;
            console.log(`✅ Found product via product_id: ${targetProductId}`);
          }
        }
        
        // Strategy 3: Try to find product by product_tmpl_id
        if (!targetProductId && odooItem.product_tmpl_id) {
          const odooProduct = await require('../models/OdooProduct').findOne({
            product_tmpl_id: odooItem.product_tmpl_id
          });
          
          if (odooProduct && odooProduct.store_product_id) {
            targetProductId = odooProduct.store_product_id;
            console.log(`✅ Found product via product_tmpl_id: ${targetProductId}`);
          }
        }
        
        if (!targetProductId) {
          console.log(`❌ Could not determine target product for promotion ${promotion._id}`);
          unfixableCount++;
          continue;
        }
        
        // Find the default unit for this product
        let targetProductUnitId = null;
        
        // Try to find default unit first
        const defaultUnit = await ProductUnit.findOne({
          product: targetProductId,
          isDefault: true
        });
        
        if (defaultUnit) {
          targetProductUnitId = defaultUnit._id;
          console.log(`✅ Found default unit: ${targetProductUnitId}`);
        } else {
          // Fallback to any unit
          const anyUnit = await ProductUnit.findOne({
            product: targetProductId
          });
          
          if (anyUnit) {
            targetProductUnitId = anyUnit._id;
            console.log(`✅ Found fallback unit: ${targetProductUnitId}`);
          }
        }
        
        if (!targetProductUnitId) {
          console.log(`❌ No units found for product ${targetProductId}`);
          unfixableCount++;
          continue;
        }
        
        // Update the promotion with the correct productUnit
        await Promotion.findByIdAndUpdate(promotion._id, {
          productUnit: targetProductUnitId
        });
        
        console.log(`✅ Fixed promotion ${promotion._id} -> productUnit: ${targetProductUnitId}`);
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error fixing promotion ${promotion._id}:`, error.message);
        unfixableCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`❌ Unfixable: ${unfixableCount}`);
    
    // Verify the fix
    const remainingBroken = await Promotion.find({
      type: 'fixed_price',
      $or: [
        { productUnit: null },
        { productUnit: { $exists: false } }
      ]
    });
    
    console.log(`\n🔍 Verification: ${remainingBroken.length} broken promotions remaining`);
    
    if (remainingBroken.length === 0) {
      console.log('🎉 All broken promotions have been fixed!');
    } else {
      console.log('⚠️ Some promotions could not be fixed:');
      remainingBroken.forEach(promo => {
        console.log(`  - ${promo._id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing broken promotions:', error);
  }
}

async function main() {
  await connectDB();
  await fixBrokenPromotions();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixBrokenPromotions }; 