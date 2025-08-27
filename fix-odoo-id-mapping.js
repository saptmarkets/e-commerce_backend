const mongoose = require('mongoose');

// Database connection
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

// Connect to MongoDB
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

// Disconnect from MongoDB
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error.message);
  }
}

// Main function to fix odoo_id mapping
async function fixOdooIdMapping() {
  try {
    console.log('\n🔧 FIXING ODOO_ID MAPPING IN STORE PRODUCTS...\n');
    
    // Get database reference
    const db = mongoose.connection.db;
    
    // 1. Get all store products that don't have odoo_id
    console.log('📊 1. FINDING STORE PRODUCTS WITHOUT ODOO_ID...');
    const productsCollection = db.collection('products');
    const productsWithoutOdooId = await productsCollection.countDocuments({ 
      $or: [
        { odoo_id: { $exists: false } },
        { odoo_id: null },
        { odoo_id: "" }
      ]
    });
    
    console.log(`   Store products without odoo_id: ${productsWithoutOdooId}`);
    
    if (productsWithoutOdooId === 0) {
      console.log('   ✅ All store products already have odoo_id field!');
      return;
    }
    
    // 2. Get sample products to see their structure
    console.log('\n📊 2. ANALYZING STORE PRODUCT STRUCTURE...');
    const sampleProducts = await productsCollection.find({ 
      $or: [
        { odoo_id: { $exists: false } },
        { odoo_id: null },
        { odoo_id: "" }
      ]
    }).limit(5).toArray();
    
    console.log('   Sample products without odoo_id:');
    sampleProducts.forEach((p, index) => {
      console.log(`   ${index + 1}. _id: ${p._id}`);
      console.log(`      Title: ${p.title?.en || p.title || 'N/A'}`);
      console.log(`      SKU: ${p.sku || 'N/A'}`);
      console.log(`      Barcode: ${p.barcode || 'N/A'}`);
      console.log(`      Price: ${p.price || 'N/A'}`);
      console.log(`      Stock: ${p.stock || 'N/A'}`);
      console.log(`      odoo_id: ${p.odoo_id || 'MISSING'}`);
      console.log('');
    });
    
    // 3. Get Odoo products to see their structure
    console.log('📊 3. ANALYZING ODOO PRODUCT STRUCTURE...');
    const odooProductsCollection = db.collection('odoo_products');
    const sampleOdooProducts = await odooProductsCollection.find({}).limit(5).toArray();
    
    console.log('   Sample Odoo products:');
    sampleOdooProducts.forEach((op, index) => {
      console.log(`   ${index + 1}. ID: ${op.id}`);
      console.log(`      Name: ${op.name || 'N/A'}`);
      console.log(`      Default Code: ${op.default_code || 'N/A'}`);
      console.log(`      Barcode: ${op.barcode || 'N/A'}`);
      console.log(`      Price: ${op.list_price || 'N/A'}`);
      console.log(`      Stock: ${op.qty_available || 'N/A'}`);
      console.log('');
    });
    
    // 4. Strategy for mapping
    console.log('📊 4. MAPPING STRATEGY...');
    console.log('   We will try to match store products with Odoo products using:');
    console.log('   1. Exact name match (case-insensitive)');
    console.log('   2. SKU/default_code match');
    console.log('   3. Barcode match');
    console.log('   4. Partial name match (if exact fails)');
    
    // 5. Start mapping process
    console.log('\n📊 5. STARTING MAPPING PROCESS...');
    
    let mappedCount = 0;
    let skippedCount = 0;
    const mappingResults = [];
    
    // Get all products without odoo_id
    const productsToMap = await productsCollection.find({ 
      $or: [
        { odoo_id: { $exists: false } },
        { odoo_id: null },
        { odoo_id: "" }
      ]
    }).toArray();
    
    console.log(`   Processing ${productsToMap.length} products...`);
    
    for (let i = 0; i < productsToMap.length; i++) {
      const product = productsToMap[i];
      
      if (i % 100 === 0) {
        console.log(`   Progress: ${i + 1}/${productsToMap.length} (${Math.round(((i + 1) / productsToMap.length) * 100)}%)`);
      }
      
      try {
        // Get product title (handle both string and object formats)
        const productTitle = typeof product.title === 'object' ? product.title.en : product.title;
        const productSku = product.sku;
        const productBarcode = product.barcode;
        
        // Try to find matching Odoo product
        let matchingOdooProduct = null;
        
        // Strategy 1: Exact name match
        if (productTitle) {
          matchingOdooProduct = await odooProductsCollection.findOne({
            name: { $regex: new RegExp(`^${productTitle}$`, 'i') }
          });
        }
        
        // Strategy 2: SKU/default_code match
        if (!matchingOdooProduct && productSku) {
          matchingOdooProduct = await odooProductsCollection.findOne({
            default_code: productSku
          });
        }
        
        // Strategy 3: Barcode match
        if (!matchingOdooProduct && productBarcode) {
          matchingOdooProduct = await odooProductsCollection.findOne({
            barcode: productBarcode
          });
        }
        
        // Strategy 4: Partial name match (if exact fails)
        if (!matchingOdooProduct && productTitle) {
          matchingOdooProduct = await odooProductsCollection.findOne({
            name: { $regex: new RegExp(productTitle, 'i') }
          });
        }
        
        if (matchingOdooProduct) {
          // Update the store product with odoo_id
          await productsCollection.updateOne(
            { _id: product._id },
            { $set: { odoo_id: matchingOdooProduct.id } }
          );
          
          mappedCount++;
          mappingResults.push({
            storeProductId: product._id,
            storeProductTitle: productTitle,
            odooProductId: matchingOdooProduct.id,
            odooProductName: matchingOdooProduct.name,
            matchMethod: 'found'
          });
          
          if (mappedCount <= 10) {
            console.log(`   ✅ Mapped: "${productTitle}" → Odoo ID ${matchingOdooProduct.id}`);
          }
        } else {
          skippedCount++;
          mappingResults.push({
            storeProductId: product._id,
            storeProductTitle: productTitle,
            odooProductId: null,
            odooProductName: null,
            matchMethod: 'not_found'
          });
          
          if (skippedCount <= 10) {
            console.log(`   ⚠️ No match found for: "${productTitle}"`);
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing product ${product._id}:`, error.message);
        skippedCount++;
      }
    }
    
    // 6. Results summary
    console.log('\n📊 6. MAPPING RESULTS...');
    console.log(`   ✅ Successfully mapped: ${mappedCount} products`);
    console.log(`   ⚠️ No match found: ${skippedCount} products`);
    console.log(`   📊 Success rate: ${Math.round((mappedCount / (mappedCount + skippedCount)) * 100)}%`);
    
    if (mappedCount > 0) {
      console.log('\n   Sample successful mappings:');
      mappingResults.filter(r => r.matchMethod === 'found').slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.storeProductTitle}" → Odoo ID ${result.odooProductId}`);
      });
    }
    
    if (skippedCount > 0) {
      console.log('\n   Sample products without matches:');
      mappingResults.filter(r => r.matchMethod === 'not_found').slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.storeProductTitle}"`);
      });
    }
    
    // 7. Verify the fix
    console.log('\n📊 7. VERIFYING THE FIX...');
    const productsWithOdooIdAfter = await productsCollection.countDocuments({ 
      odoo_id: { $exists: true, $ne: null, $ne: "" } 
    });
    
    console.log(`   Store products with odoo_id after fix: ${productsWithOdooIdAfter}`);
    
    if (productsWithOdooIdAfter > 0) {
      console.log('   ✅ SUCCESS! Store products now have odoo_id field populated.');
      console.log('   🎯 Next step: Try "Sync to Store" again - it should now work!');
    } else {
      console.log('   ❌ FAILED! No products were updated with odoo_id.');
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error.message);
    console.error(error.stack);
  }
}

// Run the fix
async function main() {
  try {
    await connectDB();
    await fixOdooIdMapping();
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

module.exports = { fixOdooIdMapping }; 