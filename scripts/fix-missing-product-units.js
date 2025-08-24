const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Unit = require('../models/Unit');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fixMissingProductUnits = async () => {
  try {
    console.log('🔍 Starting to fix missing ProductUnit documents...');
    
    // Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to check`);
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const product of products) {
      try {
        // Check if product has a basicUnit
        if (!product.basicUnit) {
          console.log(`⚠️ Product ${product.title?.en || product._id} has no basicUnit, skipping...`);
          continue;
        }
        
        // Check if default ProductUnit exists
        const existingDefaultUnit = await ProductUnit.findOne({
          product: product._id,
          isDefault: true
        });
        
        if (!existingDefaultUnit) {
          console.log(`❌ Product ${product.title?.en || product._id} missing default ProductUnit, creating...`);
          
          // Get the unit details
          const unit = await Unit.findById(product.basicUnit);
          if (!unit) {
            console.log(`⚠️ Unit ${product.basicUnit} not found for product ${product._id}, skipping...`);
            continue;
          }
          
          // Create the default ProductUnit
          const defaultProductUnit = new ProductUnit({
            product: product._id,
            unit: product.basicUnit,
            unitValue: 1,
            packQty: 1,
            price: product.price || 0,
            originalPrice: product.price || 0,
            sku: product.sku || `PU-${product._id.toString().substr(-6)}-1`,
            barcode: product.barcode || '',
            isDefault: true,
            isActive: true,
            isAvailable: true,
            unitType: 'default'
          });
          
          await defaultProductUnit.save();
          createdCount++;
          console.log(`✅ Created default ProductUnit for ${product.title?.en || product._id} with price: ${product.price}`);
          
        } else {
          // Check if the price is in sync
          if (existingDefaultUnit.price !== product.price) {
            console.log(`💰 Updating ProductUnit price for ${product.title?.en || product._id}: ${existingDefaultUnit.price} → ${product.price}`);
            existingDefaultUnit.price = product.price;
            existingDefaultUnit.originalPrice = product.price;
            await existingDefaultUnit.save();
            updatedCount++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message);
      }
    }
    
    console.log('\n🎉 ProductUnit fix completed!');
    console.log(`📊 Created: ${createdCount} new ProductUnits`);
    console.log(`📊 Updated: ${updatedCount} existing ProductUnits`);
    
  } catch (error) {
    console.error('❌ Error in fixMissingProductUnits:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the fix
fixMissingProductUnits(); 