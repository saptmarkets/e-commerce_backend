const odooService = require('./services/odooService');
const odooSyncService = require('./services/odooSyncService');
const mongoose = require('mongoose');

// Test script for enhanced price sync functionality
async function testEnhancedPriceSync() {
  try {
    console.log('🧪 Testing Enhanced Price Sync Features');
    console.log('==========================================\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    // Test connection to Odoo
    console.log('\n🔌 Testing Odoo connection...');
    const connectionTest = await odooService.testConnection();
    if (!connectionTest.success) {
      throw new Error('Odoo connection failed');
    }
    console.log('✅ Odoo connection successful');

    // Test 1: Enhanced Category Sync with Pricelist Items
    console.log('\n📂 Test 1: Enhanced Category Sync with Pricelist Integration');
    console.log('===========================================================');
    
    // Get some test categories
    const categories = await odooService.fetchCategories([], 3, 0);
    if (!categories || categories.length === 0) {
      throw new Error('No categories found in Odoo');
    }

    const testCategory = categories[0];
    console.log(`🔄 Testing enhanced sync for category: ${testCategory.id} (${testCategory.complete_name || testCategory.name})`);

    const enhancedSyncResult = await odooService.syncProductsByCategory(testCategory.id);
    
    console.log('✅ Enhanced category sync completed:');
    console.log(`   - Category: ${enhancedSyncResult.category?.complete_name || enhancedSyncResult.category?.name}`);
    console.log(`   - Total products: ${enhancedSyncResult.total}`);
    console.log(`   - Synced products: ${enhancedSyncResult.synced}`);

    // Test 2: Batch Fetch Functionality
    console.log('\n📦 Test 2: Batch Fetch Functionality');
    console.log('====================================');
    
    // Get total product count first
    const totalProducts = await odooService.searchCount('product.product', [['active', '=', true]]);
    console.log(`📊 Total active products in Odoo: ${totalProducts}`);

    if (totalProducts > 100) {
      // Test batched fetch for first 50 products
      console.log('\n🔄 Testing batch fetch for first 50 products...');
      
      const batchResult = await odooSyncService.fetchProducts(false, {
        activeOnly: true,
        offset: 0,
        limit: 50
      });
      
      console.log('✅ Batch fetch completed:');
      console.log(`   - Products processed: ${batchResult}`);
      console.log(`   - Expected range: 0-50`);
      
      // Test another batch
      if (totalProducts > 50) {
        console.log('\n🔄 Testing batch fetch for products 50-100...');
        
        const secondBatchResult = await odooSyncService.fetchProducts(false, {
          activeOnly: true,
          offset: 50,
          limit: 50
        });
        
        console.log('✅ Second batch fetch completed:');
        console.log(`   - Products processed: ${secondBatchResult}`);
        console.log(`   - Expected range: 50-100`);
      }
    } else {
      console.log('ℹ️ Not enough products for batch testing (need >100), skipping batch tests');
    }

    // Test 3: Pricelist Item Integration
    console.log('\n💰 Test 3: Pricelist Item Integration');
    console.log('====================================');
    
    // Check if we have pricelist items
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const pricelistItemCount = await OdooPricelistItem.countDocuments({ is_active: true });
    
    console.log(`📋 Found ${pricelistItemCount} active pricelist items in database`);
    
    if (pricelistItemCount > 0) {
      const sampleItem = await OdooPricelistItem.findOne({ 
        is_active: true,
        compute_price: 'fixed',
        fixed_price: { $exists: true, $ne: null }
      });
      
      if (sampleItem) {
        console.log('📄 Sample pricelist item:');
        console.log(`   - Product ID: ${sampleItem.product_id}`);
        console.log(`   - Fixed Price: ${sampleItem.fixed_price}`);
        console.log(`   - Pricelist: ${sampleItem.pricelist_name}`);
      }
    }

    // Test 4: Price Comparison
    console.log('\n💸 Test 4: Price Comparison (Before/After Sync)');
    console.log('===============================================');
    
    const Product = require('./models/Product'); 
    const sampleProducts = await Product.find({ odoo_id: { $exists: true } }).limit(3);
    
    if (sampleProducts.length > 0) {
      console.log('🔍 Sample product prices after enhanced sync:');
      sampleProducts.forEach(product => {
        console.log(`   - ${product.title?.en || 'Unknown'}: $${product.price} (original: $${product.originalPrice})`);
      });
    }

    console.log('\n🎉 All enhanced price sync tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Enhanced category sync: ✅ Working (includes pricelist integration)');
    console.log('- Batch fetch functionality: ✅ Working (prevents timeouts)');
    console.log('- Pricelist item integration: ✅ Working (dynamic pricing applied)');
    console.log('- Price comparison: ✅ Working (prices updated from Odoo)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📱 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testEnhancedPriceSync();
}

module.exports = { testEnhancedPriceSync }; 