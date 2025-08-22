const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Promotion = require('../models/Promotion');
const ProductUnit = require('../models/ProductUnit');
const Product = require('../models/Product');
const Unit = require('../models/Unit');

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

async function fixPromotionProductUnitRefs() {
  console.log('🔧 Starting promotion productUnit reference fix...');
  
  try {
    // Get all fixed_price promotions
    const fixedPricePromotions = await Promotion.find({ type: 'fixed_price' });
    console.log(`📊 Found ${fixedPricePromotions.length} fixed price promotions`);
    
    let fixedCount = 0;
    let alreadyValidCount = 0;
    let unfixableCount = 0;
    
    for (const promotion of fixedPricePromotions) {
      console.log(`\n🔍 Checking promotion ${promotion._id}...`);
      
      // Check if productUnit exists
      if (!promotion.productUnit) {
        console.log(`❌ Promotion ${promotion._id} has no productUnit reference`);
        unfixableCount++;
        continue;
      }
      
      // Try to find the productUnit
      const productUnit = await ProductUnit.findById(promotion.productUnit).populate('product');
      
      if (!productUnit) {
        console.log(`❌ ProductUnit ${promotion.productUnit} not found for promotion ${promotion._id}`);
        
        // Try to find a suitable replacement ProductUnit
        // This would require knowing which product this promotion was meant for
        // For now, we'll just log it as unfixable
        unfixableCount++;
        continue;
      }
      
      if (!productUnit.product) {
        console.log(`❌ ProductUnit ${productUnit._id} has no product reference`);
        
        // Try to find the product and link it
        // This would require additional logic to determine the correct product
        unfixableCount++;
        continue;
      }
      
      console.log(`✅ Promotion ${promotion._id} has valid productUnit and product`);
      alreadyValidCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Already valid: ${alreadyValidCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`❌ Unfixable: ${unfixableCount}`);
    
    // Get detailed info about broken references
    console.log('\n🔍 Detailed analysis of broken references...');
    
    const brokenPromotions = await Promotion.aggregate([
      { $match: { type: 'fixed_price' } },
      {
        $lookup: {
          from: 'productunits',
          localField: 'productUnit',
          foreignField: '_id',
          as: 'productUnitDoc'
        }
      },
      {
        $addFields: {
          hasProductUnit: { $gt: [{ $size: '$productUnitDoc' }, 0] }
        }
      },
      {
        $match: {
          hasProductUnit: false
        }
      }
    ]);
    
    console.log(`\n❌ Found ${brokenPromotions.length} promotions with broken productUnit references:`);
    brokenPromotions.forEach(promo => {
      console.log(`  - ${promo._id}: productUnit = ${promo.productUnit}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing promotion references:', error);
  }
}

async function main() {
  await connectDB();
  await fixPromotionProductUnitRefs();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixPromotionProductUnitRefs }; 