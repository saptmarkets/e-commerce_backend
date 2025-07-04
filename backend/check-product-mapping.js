/**
 * Check product mapping for Britannia product
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

// Check product mapping
const checkMapping = async () => {
  console.log('\n🔍 Checking product mapping for Britannia...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const Product = require('./models/Product');
    
    // Find the OdooProduct with SKU CONS_0351
    const odooProduct = await OdooProduct.findOne({ default_code: 'CONS_0351' });
    
    if (!odooProduct) {
      console.log('❌ OdooProduct with SKU CONS_0351 not found');
      return;
    }
    
    console.log('✅ Found OdooProduct:');
    console.log(`   - Product ID: ${odooProduct.product_id}`);
    console.log(`   - SKU: ${odooProduct.default_code}`);
    console.log(`   - Store Product ID: ${odooProduct.store_product_id || 'Not mapped'}`);
    console.log(`   - Name: ${odooProduct.name?.en || 'N/A'}`);
    
    // Check if the store product ID matches the Britannia product
    if (odooProduct.store_product_id) {
      const storeProduct = await Product.findById(odooProduct.store_product_id);
      
      if (storeProduct) {
        console.log('\n✅ Store Product found:');
        console.log(`   - ID: ${storeProduct._id}`);
        console.log(`   - SKU: ${storeProduct.sku}`);
        console.log(`   - Title: ${storeProduct.title?.en || 'N/A'}`);
        
        if (storeProduct.sku === 'CONS_0351' && storeProduct.title?.en?.includes('BRITANNIA')) {
          console.log('✅ Mapping is correct!');
        } else {
          console.log('❌ Mapping is incorrect! This is not the Britannia product.');
        }
      } else {
        console.log('❌ Store Product not found');
      }
    } else {
      console.log('❌ No store product mapping');
    }
    
    // Also check by store product ID directly
    console.log('\n🔍 Checking by store product ID directly...');
    const britanniaStoreProduct = await Product.findById('6867f51f4406d613d8c079e8');
    
    if (britanniaStoreProduct) {
      console.log('✅ Found Britannia store product:');
      console.log(`   - ID: ${britanniaStoreProduct._id}`);
      console.log(`   - SKU: ${britanniaStoreProduct.sku}`);
      console.log(`   - Title: ${britanniaStoreProduct.title?.en || 'N/A'}`);
      
      // Check if this store product is mapped to any OdooProduct
      const mappedOdooProduct = await OdooProduct.findOne({ store_product_id: britanniaStoreProduct._id });
      
      if (mappedOdooProduct) {
        console.log('\n✅ Found OdooProduct mapping:');
        console.log(`   - Product ID: ${mappedOdooProduct.product_id}`);
        console.log(`   - SKU: ${mappedOdooProduct.default_code}`);
        console.log(`   - Name: ${mappedOdooProduct.name?.en || 'N/A'}`);
      } else {
        console.log('\n❌ No OdooProduct mapping found for this store product');
      }
    }

  } catch (error) {
    console.error('❌ Error during mapping check:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkMapping();
  
  console.log('\n🎉 Mapping check completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 