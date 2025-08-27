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

async function findDifferences() {
  try {
    console.log('\n🔍 FINDING PRODUCTS WITH DIFFERENCES...\n');
    
    const db = mongoose.connection.db;
    
    // 1. Get all store products with odoo_id
    console.log('📊 1. GETTING STORE PRODUCTS WITH ODOO_ID...');
    const productsCollection = db.collection('products');
    
    const productsWithOdooId = await productsCollection.find({ 
      odoo_id: { $exists: true, $ne: null } 
    }).toArray();
    
    console.log(`   Found ${productsWithOdooId.length} store products with odoo_id`);
    
    if (productsWithOdooId.length === 0) {
      console.log('   ❌ No store products with odoo_id found');
      return;
    }
    
    // 2. Get all Odoo products
    console.log('\n📊 2. GETTING ODOO PRODUCTS...');
    const odooProductsCollection = db.collection('odoo_products');
    
    const odooProducts = await odooProductsCollection.find({}).toArray();
    console.log(`   Found ${odooProducts.length} Odoo products`);
    
    if (odooProducts.length === 0) {
      console.log('   ❌ No Odoo products found');
      return;
    }
    
    // 3. Create lookup maps for performance
    console.log('\n📊 3. CREATING LOOKUP MAPS...');
    
    const odooProductMap = new Map();
    odooProducts.forEach(op => {
      odooProductMap.set(op.id, op);
    });
    
    console.log(`   Created lookup map with ${odooProductMap.size} Odoo products`);
    
    // 4. Find products with differences
    console.log('\n📊 4. FINDING PRODUCTS WITH DIFFERENCES...');
    
    const productsWithDifferences = [];
    const productsWithoutDifferences = [];
    let processedCount = 0;
    
    for (const storeProduct of productsWithOdooId) {
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`   Progress: ${processedCount}/${productsWithOdooId.length} (${Math.round((processedCount / productsWithOdooId.length) * 100)}%)`);
      }
      
      try {
        const odooProduct = odooProductMap.get(storeProduct.odoo_id);
        
        if (!odooProduct) {
          continue; // Skip if no matching Odoo product
        }
        
        // Check for differences
        const priceDiff = storeProduct.price !== odooProduct.list_price;
        const stockDiff = storeProduct.stock !== odooProduct.qty_available;
        
        if (priceDiff || stockDiff) {
          productsWithDifferences.push({
            storeProduct,
            odooProduct,
            differences: {
              price: priceDiff ? {
                store: storeProduct.price,
                odoo: odooProduct.list_price,
                diff: odooProduct.list_price - storeProduct.price
              } : null,
              stock: stockDiff ? {
                store: storeProduct.stock,
                odoo: odooProduct.qty_available,
                diff: odooProduct.qty_available - storeProduct.stock
              } : null
            }
          });
        } else {
          productsWithoutDifferences.push({
            storeProduct,
            odooProduct
          });
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing product ${storeProduct._id}:`, error.message);
      }
    }
    
    // 5. Results summary
    console.log('\n📊 5. RESULTS SUMMARY...');
    console.log(`   ✅ Products WITH differences: ${productsWithDifferences.length}`);
    console.log(`   ✅ Products WITHOUT differences: ${productsWithoutDifferences.length}`);
    console.log(`   📊 Total processed: ${productsWithDifferences.length + productsWithoutDifferences.length}`);
    
    if (productsWithDifferences.length > 0) {
      console.log('\n📊 6. SAMPLE PRODUCTS WITH DIFFERENCES...');
      
      // Show first 10 products with differences
      productsWithDifferences.slice(0, 10).forEach((item, index) => {
        const sp = item.storeProduct;
        const op = item.odooProduct;
        const diff = item.differences;
        
        console.log(`   ${index + 1}. "${sp.title?.en || sp.title || 'N/A'}" (ID: ${sp.odoo_id})`);
        
        if (diff.price) {
          console.log(`      💰 Price: Store ${diff.price.store} → Odoo ${diff.price.odoo} (diff: ${diff.price.diff > 0 ? '+' : ''}${diff.price.diff})`);
        }
        
        if (diff.stock) {
          console.log(`      📊 Stock: Store ${diff.stock.store} → Odoo ${diff.stock.odoo} (diff: ${diff.stock.diff > 0 ? '+' : ''}${diff.stock.diff})`);
        }
        
        console.log('');
      });
      
      console.log('🎯 THESE PRODUCTS SHOULD BE UPDATED BY SYNC!');
      console.log(`   Try running "Sync to Store" with price and stock fields selected.`);
      console.log(`   Expected result: ${productsWithDifferences.length} products should be updated.`);
      
    } else {
      console.log('\n📊 6. NO DIFFERENCES FOUND...');
      console.log('   ✅ All products are already up to date!');
      console.log('   💡 This explains why sync shows 0 products updated.');
      console.log('   🎯 Try syncing a different category or wait for Odoo data to change.');
    }
    
    // 6. Show some products without differences for comparison
    if (productsWithoutDifferences.length > 0) {
      console.log('\n📊 7. SAMPLE PRODUCTS WITHOUT DIFFERENCES...');
      
      productsWithoutDifferences.slice(0, 5).forEach((item, index) => {
        const sp = item.storeProduct;
        const op = item.odooProduct;
        
        console.log(`   ${index + 1}. "${sp.title?.en || sp.title || 'N/A'}" (ID: ${sp.odoo_id})`);
        console.log(`      💰 Price: Store ${sp.price} = Odoo ${op.list_price} ✅`);
        console.log(`      📊 Stock: Store ${sp.stock} = Odoo ${op.qty_available} ✅`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Find differences error:', error.message);
    console.error(error.stack);
  }
}

async function main() {
  try {
    await connectDB();
    await findDifferences();
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