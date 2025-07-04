/**
 * Check newly created promotions
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Check new promotions
const checkNewPromotions = async () => {
  console.log('\n🔍 Checking newly created promotions...\n');

  try {
    const Promotion = require('./models/Promotion');
    const ProductUnit = require('./models/ProductUnit');
    
    // Check the two new promotion IDs
    const promotionIds = ['6867f762c5a5421c7c87ef0a', '6867f762c5a5421c7c87ef41'];
    
    for (const promoId of promotionIds) {
      const promotion = await Promotion.findById(promoId);
      
      if (promotion) {
        console.log(`✅ Promotion ${promoId}:`);
        console.log(`   - Name: ${promotion.name?.en || 'N/A'}`);
        console.log(`   - Type: ${promotion.type}`);
        console.log(`   - Value: ${promotion.value}`);
        console.log(`   - Product Unit: ${promotion.productUnit}`);
        console.log(`   - Is Active: ${promotion.isActive}`);
        
        // Get the product unit details
        if (promotion.productUnit) {
          const productUnit = await ProductUnit.findById(promotion.productUnit);
          if (productUnit) {
            console.log(`   - Product Unit SKU: ${productUnit.sku}`);
            console.log(`   - Product Unit Barcode: ${productUnit.barcode || 'None'}`);
          }
        }
        
        console.log('');
      } else {
        console.log(`❌ Promotion ${promoId} not found`);
      }
    }
    
    // Also check the manually created promotion
    console.log('🔍 Checking manually created promotion: 6867f5534406d613d8c07bb4');
    const manualPromotion = await Promotion.findById('6867f5534406d613d8c07bb4');
    
    if (manualPromotion) {
      console.log('✅ Manually created promotion still exists:');
      console.log(`   - Name: ${manualPromotion.name?.en || 'N/A'}`);
      console.log(`   - Type: ${manualPromotion.type}`);
      console.log(`   - Value: ${manualPromotion.value}`);
      console.log(`   - Product Unit: ${manualPromotion.productUnit}`);
    } else {
      console.log('❌ Manually created promotion not found');
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkNewPromotions();
  
  console.log('\n🎉 Promotion check completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 