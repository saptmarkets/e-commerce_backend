/**
 * Test promotion import for Britannia product
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

// Test promotion import
const testPromotionImport = async () => {
  console.log('\n🧪 Testing Britannia Promotion Import...\n');

  try {
    const OdooImportService = require('./services/odooImportService');
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const Promotion = require('./models/Promotion');

    // 1. Check pricelist items for Britannia
    const pricelistItems = await OdooPricelistItem.find({ 
      product_id: 4829,
      compute_price: 'fixed'
    });
    
    console.log(`1️⃣ Found ${pricelistItems.length} pricelist items for Britannia:`);
    
    for (const item of pricelistItems) {
      console.log(`   Item ${item.id}:`);
      console.log(`     Barcode Unit ID: ${item.barcode_unit_id || 'None'}`);
      console.log(`     Fixed Price: ${item.fixed_price}`);
      console.log(`     Store Promotion ID: ${item.store_promotion_id || 'None'}`);
      console.log(`     Sync Status: ${item._sync_status || 'pending'}`);
    }

    // 2. Test import for the CTN 12 unit (item 25)
    console.log('\n2️⃣ Testing import for CTN 12 unit (item 25)...');
    
    const importService = new OdooImportService();
    const result = await importService.importPromotions([25]);
    
    console.log(`✅ Import result: ${result.imported} imported, ${result.errors.length} errors`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    // 3. Check if promotions were created
    console.log('\n3️⃣ Checking created promotions...');
    
    const promotions = await Promotion.find({}).populate('productUnit');
    console.log(`   Found ${promotions.length} total promotions in database`);
    
    // Look for Britannia promotions
    const britanniaPromotions = promotions.filter(p => 
      p.productUnit && p.productUnit.product && 
      p.productUnit.product.toString() === '6867f51f4406d613d8c079e8'
    );
    
    console.log(`   Found ${britanniaPromotions.length} Britannia promotions:`);
    
    for (const promo of britanniaPromotions) {
      console.log(`   ✅ Promotion ${promo._id}:`);
      console.log(`      Name: ${promo.name.en}`);
      console.log(`      Value: ${promo.value}`);
      console.log(`      ProductUnit: ${promo.productUnit._id}`);
      console.log(`      Unit Name: ${promo.productUnit.name}`);
      console.log(`      Unit Barcode: ${promo.productUnit.barcode}`);
    }

    // 4. Test import for all Britannia items
    console.log('\n4️⃣ Testing import for all Britannia items...');
    
    const allItemIds = pricelistItems.map(item => item.id);
    const allResult = await importService.importPromotions(allItemIds);
    
    console.log(`✅ All items import result: ${allResult.imported} imported, ${allResult.errors.length} errors`);
    
    if (allResult.errors.length > 0) {
      console.log('❌ Errors:');
      allResult.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n🎉 Britannia promotion import test completed!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testPromotionImport();
  
  console.log('\n🎉 Test completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 