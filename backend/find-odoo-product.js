/**
 * Find Odoo product by name or SKU
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

// Search for Odoo product
const searchOdooProduct = async () => {
  console.log('\n🔍 Searching for Britannia product in OdooProduct collection...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    
    // Search by name (partial match)
    const byName = await OdooProduct.find({
      $or: [
        { 'name.en': { $regex: 'BRITANNIA', $options: 'i' } },
        { 'name.ar': { $regex: 'بريتانيا', $options: 'i' } },
        { 'name.en': { $regex: '50-50', $options: 'i' } },
        { 'name.en': { $regex: 'SWEETS', $options: 'i' } }
      ]
    });

    console.log(`📦 Found ${byName.length} products by name:`);
    for (const product of byName) {
      console.log(`   - Product ID: ${product.product_id}`);
      console.log(`     Name: ${product.name?.en || 'N/A'}`);
      console.log(`     Store Product ID: ${product.store_product_id || 'Not mapped'}`);
      console.log(`     Default Code: ${product.default_code || 'N/A'}`);
      console.log('');
    }

    // Search by default_code (SKU)
    const bySku = await OdooProduct.find({ default_code: 'CONS_0351' });
    
    if (bySku.length > 0) {
      console.log(`📦 Found ${bySku.length} products by SKU (CONS_0351):`);
      for (const product of bySku) {
        console.log(`   - Product ID: ${product.product_id}`);
        console.log(`     Name: ${product.name?.en || 'N/A'}`);
        console.log(`     Store Product ID: ${product.store_product_id || 'Not mapped'}`);
        console.log(`     Default Code: ${product.default_code || 'N/A'}`);
        console.log('');
      }
    } else {
      console.log('❌ No product found with SKU: CONS_0351');
    }

    // Show all products with similar names
    const allProducts = await OdooProduct.find({}).limit(20);
    console.log(`📋 First 20 products in OdooProduct collection:`);
    for (const product of allProducts) {
      console.log(`   - ID: ${product.product_id}, Name: ${product.name?.en || 'N/A'}, SKU: ${product.default_code || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error during search:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await searchOdooProduct();
  
  console.log('\n🎉 Search completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 