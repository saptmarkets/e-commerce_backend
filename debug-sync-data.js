const mongoose = require('mongoose');

// Database connection
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Disconnect from MongoDB
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error.message);
  }
}

// Main diagnostic function
async function diagnoseSyncData() {
  try {
    console.log('\n🔍 DIAGNOSING SYNC DATA ISSUES...\n');
    
    // Get database reference
    const db = mongoose.connection.db;
    
    // 1. Check OdooProduct collection
    console.log('📊 1. CHECKING ODOO PRODUCTS COLLECTION...');
    const odooProductsCollection = db.collection('odoo_products');
    const odooProductsCount = await odooProductsCollection.countDocuments();
    console.log(`   Total Odoo products: ${odooProductsCount}`);
    
    if (odooProductsCount > 0) {
      const sampleOdooProducts = await odooProductsCollection.find({}).limit(5).toArray();
      console.log('   Sample Odoo products:');
      sampleOdooProducts.forEach((op, index) => {
        console.log(`   ${index + 1}. ID: ${op.id}, Name: ${op.name}, Price: ${op.list_price}, Stock: ${op.qty_available}`);
      });
    }
    
    // 2. Check Product collection (store products)
    console.log('\n📊 2. CHECKING STORE PRODUCTS COLLECTION...');
    const productsCollection = db.collection('products');
    const productsCount = await productsCollection.countDocuments();
    console.log(`   Total store products: ${productsCount}`);
    
    if (productsCount > 0) {
      const sampleProducts = await productsCollection.find({}).limit(5).toArray();
      console.log('   Sample store products:');
      sampleProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. _id: ${p._id}, odoo_id: ${p.odoo_id}, Title: ${p.title}, Price: ${p.price}, Stock: ${p.stock}`);
      });
    }
    
    // 3. Check for odoo_id field in store products
    console.log('\n📊 3. CHECKING ODOO_ID FIELD IN STORE PRODUCTS...');
    const productsWithOdooId = await productsCollection.countDocuments({ odoo_id: { $exists: true, $ne: null } });
    console.log(`   Store products with odoo_id field: ${productsWithOdooId}`);
    
    if (productsWithOdooId > 0) {
      const sampleWithOdooId = await productsCollection.find({ odoo_id: { $exists: true, $ne: null } }).limit(5).toArray();
      console.log('   Sample products with odoo_id:');
      sampleWithOdooId.forEach((p, index) => {
        console.log(`   ${index + 1}. _id: ${p._id}, odoo_id: ${p.odoo_id}, Title: ${p.title}`);
      });
    }
    
    // 4. Check for matching IDs
    console.log('\n📊 4. CHECKING FOR MATCHING IDS...');
    
    // Get all Odoo product IDs
    const odooProductIds = await odooProductsCollection.distinct('id');
    console.log(`   Unique Odoo product IDs: ${odooProductIds.length}`);
    
    // Get all store product odoo_ids
    const storeOdooIds = await productsCollection.distinct('odoo_id');
    const validStoreOdooIds = storeOdooIds.filter(id => id !== null && id !== undefined);
    console.log(`   Valid store product odoo_ids: ${validStoreOdooIds.length}`);
    
    // Find matches
    const matches = validStoreOdooIds.filter(id => odooProductIds.includes(id));
    console.log(`   Matching IDs found: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('   Sample matching IDs:', matches.slice(0, 10));
    } else {
      console.log('   ⚠️ NO MATCHES FOUND! This explains why sync updates 0 products.');
    }
    
    // 5. Check data types and values
    console.log('\n📊 5. CHECKING DATA TYPES AND VALUES...');
    
    if (odooProductIds.length > 0 && validStoreOdooIds.length > 0) {
      const sampleOdooId = odooProductIds[0];
      const sampleStoreOdooId = validStoreOdooIds[0];
      
      console.log(`   Sample Odoo ID: ${sampleOdooId} (type: ${typeof sampleOdooId})`);
      console.log(`   Sample Store odoo_id: ${sampleStoreOdooId} (type: ${typeof sampleStoreOdooId})`);
      
      // Check if they're the same type
      if (typeof sampleOdooId === typeof sampleStoreOdooId) {
        console.log('   ✅ Data types match');
      } else {
        console.log('   ❌ Data types DO NOT match - this could cause lookup failures');
      }
      
      // Check if they're the same value
      if (sampleOdooId === sampleStoreOdooId) {
        console.log('   ✅ Sample values match');
      } else {
        console.log('   ❌ Sample values DO NOT match');
      }
    }
    
    // 6. Check OdooStock collection
    console.log('\n📊 6. CHECKING ODOO STOCK COLLECTION...');
    const odooStockCollection = db.collection('odoo_stocks');
    const odooStockCount = await odooStockCollection.countDocuments();
    console.log(`   Total Odoo stock records: ${odooStockCount}`);
    
    if (odooStockCount > 0) {
      const sampleStock = await odooStockCollection.find({}).limit(3).toArray();
      console.log('   Sample stock records:');
      sampleStock.forEach((s, index) => {
        console.log(`   ${index + 1}. Product ID: ${s.product_id}, Location: ${s.location_name}, Quantity: ${s.quantity}`);
      });
    }
    
    // 7. Summary and recommendations
    console.log('\n📊 7. SUMMARY AND RECOMMENDATIONS...');
    
    if (matches.length === 0) {
      console.log('   ❌ PROBLEM IDENTIFIED: No matching IDs between Odoo and Store products');
      console.log('   🔧 POSSIBLE SOLUTIONS:');
      console.log('      1. Check if store products have odoo_id field populated');
      console.log('      2. Verify odoo_id values match Odoo product IDs');
      console.log('      3. Check data types (string vs number)');
      console.log('      4. Ensure category sync has been run to populate odoo_* tables');
    } else {
      console.log(`   ✅ ${matches.length} products can potentially be synced`);
      console.log('   🔧 NEXT STEPS:');
      console.log('      1. Check if these products have price/stock differences');
      console.log('      2. Verify the sync logic is working correctly');
    }
    
    console.log(`\n📊 FINAL COUNTS:`);
    console.log(`   - Odoo products: ${odooProductsCount}`);
    console.log(`   - Store products: ${productsCount}`);
    console.log(`   - Store products with odoo_id: ${productsWithOdooId}`);
    console.log(`   - Matching products: ${matches.length}`);
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    console.error(error.stack);
  }
}

// Run the diagnostic
async function main() {
  try {
    await connectDB();
    await diagnoseSyncData();
  } catch (error) {
    console.error('❌ Main error:', error.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { diagnoseSyncData }; 