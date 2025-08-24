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

const migrateToUnitsOnlyPricing = async () => {
  try {
    console.log('🚀 Starting migration to units-only pricing system...');
    
    // Step 1: Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to migrate`);
    
    let productsUpdated = 0;
    let productUnitsCreated = 0;
    let productUnitsUpdated = 0;
    
    for (const product of products) {
      try {
        console.log(`\n🔍 Processing product: ${product.title?.en || product._id}`);
        
        // Check if product has a basicUnit
        if (!product.basicUnit) {
          console.log(`⚠️ Product ${product._id} has no basicUnit, skipping...`);
          continue;
        }
        
        // Step 2: Check if default ProductUnit exists
        let defaultProductUnit = await ProductUnit.findOne({
          product: product._id,
          isDefault: true
        });
        
        if (!defaultProductUnit) {
          console.log(`❌ Creating missing default ProductUnit for ${product.title?.en || product._id}`);
          
          // Get the unit details
          const unit = await Unit.findById(product.basicUnit);
          if (!unit) {
            console.log(`⚠️ Unit ${product.basicUnit} not found, skipping...`);
            continue;
          }
          
          // Create the default ProductUnit using the product's current price
          const currentPrice = product.price || product.prices?.price || 0;
          
          defaultProductUnit = new ProductUnit({
            product: product._id,
            unit: product.basicUnit,
            unitValue: 1,
            packQty: 1,
            price: currentPrice,
            originalPrice: currentPrice,
            sku: product.sku || `PU-${product._id.toString().substr(-6)}-1`,
            barcode: product.barcode || '',
            isDefault: true,
            isActive: true,
            isAvailable: true,
            unitType: 'default',
            stock: product.stock || 0,
            locationStocks: product.locationStocks || []
          });
          
          await defaultProductUnit.save();
          productUnitsCreated++;
          console.log(`✅ Created default ProductUnit with price: ${currentPrice}`);
          
        } else {
          // Step 3: Update existing ProductUnit to match product price
          const currentPrice = product.price || product.prices?.price || 0;
          
          if (defaultProductUnit.price !== currentPrice) {
            console.log(`💰 Updating ProductUnit price: ${defaultProductUnit.price} → ${currentPrice}`);
            defaultProductUnit.price = currentPrice;
            defaultProductUnit.originalPrice = currentPrice;
            await defaultProductUnit.save();
            productUnitsUpdated++;
          }
        }
        
        // Step 4: Remove price fields from Product document
        const updateData = {};
        let hasChanges = false;
        
        if (product.price !== undefined) {
          updateData.price = undefined;
          hasChanges = true;
        }
        
        if (product.prices && Object.keys(product.prices).length > 0) {
          updateData.prices = undefined;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await Product.findByIdAndUpdate(product._id, {
            $unset: updateData
          });
          productsUpdated++;
          console.log(`🗑️ Removed price fields from Product document`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Products updated: ${productsUpdated}`);
    console.log(`📊 ProductUnits created: ${productUnitsCreated}`);
    console.log(`📊 ProductUnits updated: ${productUnitsUpdated}`);
    
    // Step 5: Verify migration
    console.log('\n🔍 Verifying migration...');
    const productsWithPrice = await Product.find({
      $or: [
        { price: { $exists: true } },
        { prices: { $exists: true } }
      ]
    });
    
    if (productsWithPrice.length === 0) {
      console.log('✅ All price fields successfully removed from Product collection');
    } else {
      console.log(`⚠️ ${productsWithPrice.length} products still have price fields`);
    }
    
    const productsWithoutUnits = await Product.find({
      basicUnit: { $exists: false }
    });
    
    if (productsWithoutUnits.length === 0) {
      console.log('✅ All products have basicUnit defined');
    } else {
      console.log(`⚠️ ${productsWithoutUnits.length} products missing basicUnit`);
    }
    
    const productsWithoutDefaultUnit = await Product.aggregate([
      {
        $lookup: {
          from: 'productunits',
          localField: '_id',
          foreignField: 'product',
          as: 'units'
        }
      },
      {
        $match: {
          'units.isDefault': { $ne: true }
        }
      }
    ]);
    
    if (productsWithoutDefaultUnit.length === 0) {
      console.log('✅ All products have default ProductUnit');
    } else {
      console.log(`⚠️ ${productsWithoutDefaultUnit.length} products missing default ProductUnit`);
    }
    
  } catch (error) {
    console.error('❌ Error in migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the migration
migrateToUnitsOnlyPricing(); 