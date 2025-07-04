/**
 * Check if promotion exists
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

// Check promotion
const checkPromotion = async () => {
  console.log('\n🔍 Checking promotion: 6861b8aa2386082f081fc0ac\n');

  try {
    const Promotion = require('./models/Promotion');
    
    const promotion = await Promotion.findById('6861b8aa2386082f081fc0ac');
    
    if (promotion) {
      console.log('✅ Promotion found:');
      console.log(`   - ID: ${promotion._id}`);
      console.log(`   - Name: ${promotion.name?.en || 'N/A'}`);
      console.log(`   - Type: ${promotion.type}`);
      console.log(`   - Value: ${promotion.value}`);
      console.log(`   - Product Unit: ${promotion.productUnit}`);
      console.log(`   - Is Active: ${promotion.isActive}`);
    } else {
      console.log('❌ Promotion not found!');
      console.log('💡 This means the store_promotion_id in the pricelist item is invalid.');
      console.log('💡 We need to clear it so the import can try again.');
    }
    
    // Also check the manually created promotion
    console.log('\n🔍 Checking manually created promotion: 6867f5534406d613d8c07bb4');
    const manualPromotion = await Promotion.findById('6867f5534406d613d8c07bb4');
    
    if (manualPromotion) {
      console.log('✅ Manually created promotion found:');
      console.log(`   - ID: ${manualPromotion._id}`);
      console.log(`   - Name: ${manualPromotion.name?.en || 'N/A'}`);
      console.log(`   - Type: ${manualPromotion.type}`);
      console.log(`   - Value: ${manualPromotion.value}`);
      console.log(`   - Product Unit: ${manualPromotion.productUnit}`);
      console.log(`   - Is Active: ${manualPromotion.isActive}`);
    } else {
      console.log('❌ Manually created promotion not found!');
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkPromotion();
  
  console.log('\n🎉 Promotion check completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 