const mongoose = require('mongoose');

// Database connection
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error.message);
  }
}

async function quickCheck() {
  try {
    console.log('\n🔍 QUICK CHECK - WHY SYNC IS FAILING...\n');
    
    const db = mongoose.connection.db;
    
    // 1. Check store products with odoo_id
    console.log('📊 1. CHECKING STORE PRODUCTS WITH ODOO_ID...');
    const productsCollection = db.collection('products');
    
    const productsWithOdooId = await productsCollection.countDocuments({ 
      odoo_id: { $exists: true, $ne: null } 
    });
    console.log(`   Store products with odoo_id: ${productsWithOdooId}`);
    
    if (productsWithOdooId > 0) {
      const sampleProduct = await productsCollection.findOne({ 
        odoo_id: { $exists: true, $ne: null } 
      });
      
      console.log('   Sample product with odoo_id:');
      console.log(`   - _id: ${sampleProduct._id}`);
      console.log(`   - odoo_id: ${sampleProduct.odoo_id} (type: ${typeof sampleProduct.odoo_id})`);
      console.log(`   - odooProductId: ${sampleProduct.odooProductId} (type: ${typeof sampleProduct.odooProductId})`);
      console.log(`   - title: ${JSON.stringify(sampleProduct.title)}`);
      console.log(`   - price: ${sampleProduct.price}`);
      console.log(`   - stock: ${sampleProduct.stock}`);
    }
    
    // 2. Check Odoo products
    console.log('\n📊 2. CHECKING ODOO PRODUCTS...');
    const odooProductsCollection = db.collection('odoo_products');
    
    const odooProductsCount = await odooProductsCollection.countDocuments();
    console.log(`   Total Odoo products: ${odooProductsCount}`);
    
    if (odooProductsCount > 0) {
      const sampleOdooProduct = await odooProductsCollection.findOne({});
      
      console.log('   Sample Odoo product:');
      console.log(`   - id: ${sampleOdooProduct.id} (type: ${typeof sampleOdooProduct.id})`);
      console.log(`   - name: ${sampleOdooProduct.name}`);
      console.log(`   - list_price: ${sampleOdooProduct.list_price}`);
      console.log(`   - qty_available: ${sampleOdooProduct.qty_available}`);
    }
    
    // 3. Check for specific match
    console.log('\n📊 3. CHECKING FOR SPECIFIC MATCH...');
    
    if (productsWithOdooId > 0 && odooProductsCount > 0) {
      const sampleProduct = await productsCollection.findOne({ 
        odoo_id: { $exists: true, $ne: null } 
      });
      
      const matchingOdooProduct = await odooProductsCollection.findOne({
        id: sampleProduct.odoo_id
      });
      
      if (matchingOdooProduct) {
        console.log('   ✅ MATCH FOUND!');
        console.log(`   Store product odoo_id: ${sampleProduct.odoo_id}`);
        console.log(`   Odoo product id: ${matchingOdooProduct.id}`);
        console.log(`   Store price: ${sampleProduct.price}, Odoo price: ${matchingOdooProduct.list_price}`);
        console.log(`   Store stock: ${sampleProduct.stock}, Odoo stock: ${matchingOdooProduct.qty_available}`);
        
        // Check if there are differences
        const priceDiff = sampleProduct.price !== matchingOdooProduct.list_price;
        const stockDiff = sampleProduct.stock !== matchingOdooProduct.qty_available;
        
        if (priceDiff || stockDiff) {
          console.log('   🔄 DIFFERENCES FOUND - This product should be updated!');
          if (priceDiff) console.log(`   - Price difference: Store ${sampleProduct.price} vs Odoo ${matchingOdooProduct.list_price}`);
          if (stockDiff) console.log(`   - Stock difference: Store ${sampleProduct.stock} vs Odoo ${matchingOdooProduct.qty_available}`);
        } else {
          console.log('   ✅ No differences - This product is already up to date');
        }
      } else {
        console.log('   ❌ NO MATCH FOUND!');
        console.log(`   Store product odoo_id: ${sampleProduct.odoo_id}`);
        console.log(`   No Odoo product with id: ${sampleProduct.odoo_id}`);
      }
    }
    
    // 4. Check data types
    console.log('\n📊 4. DATA TYPE ANALYSIS...');
    
    if (productsWithOdooId > 0 && odooProductsCount > 0) {
      const sampleProduct = await productsCollection.findOne({ 
        odoo_id: { $exists: true, $ne: null } 
      });
      
      const sampleOdooProduct = await odooProductsCollection.findOne({});
      
      console.log(`   Store odoo_id type: ${typeof sampleProduct.odoo_id}`);
      console.log(`   Odoo id type: ${typeof sampleOdooProduct.id}`);
      
      if (typeof sampleProduct.odoo_id === typeof sampleOdooProduct.id) {
        console.log('   ✅ Data types match');
      } else {
        console.log('   ❌ Data types DO NOT match - this could cause lookup failures');
      }
      
      // Check if they're the same value
      if (sampleProduct.odoo_id === sampleOdooProduct.id) {
        console.log('   ✅ Sample values match');
      } else {
        console.log('   ❌ Sample values DO NOT match');
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   - Store products with odoo_id: ${productsWithOdooId}`);
    console.log(`   - Odoo products available: ${odooProductsCount}`);
    
    if (productsWithOdooId > 0 && odooProductsCount > 0) {
      console.log('   🎯 The issue is likely in the sync logic, not missing data!');
    }
    
  } catch (error) {
    console.error('❌ Quick check error:', error.message);
  }
}

async function main() {
  try {
    await connectDB();
    await quickCheck();
  } catch (error) {
    console.error('❌ Main error:', error.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
} 