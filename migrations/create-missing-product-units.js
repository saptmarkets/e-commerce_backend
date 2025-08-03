const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Unit = require('../models/Unit');

const createMissingProductUnits = async (skipConnection = false) => {
  if (!skipConnection) {
    console.log('🚀 Starting ProductUnit migration...');
  }
  
  try {
    // Get all products
    const products = await Product.find({}).populate('basicUnit');
    console.log(`📊 Found ${products.length} products to process`);
    
    // Get default units to use as fallbacks
    const defaultUnits = {
      pcs: await Unit.findOne({ shortCode: 'pcs' }) || await Unit.findOne({ name: /piece/i }),
      kg: await Unit.findOne({ shortCode: 'kg' }) || await Unit.findOne({ name: /kilogram/i }),
      g: await Unit.findOne({ shortCode: 'g' }) || await Unit.findOne({ name: /gram/i }),
      l: await Unit.findOne({ shortCode: 'l' }) || await Unit.findOne({ name: /liter/i }),
      ml: await Unit.findOne({ shortCode: 'ml' }) || await Unit.findOne({ name: /milliliter/i })
    };
    
    // Ensure we have at least one unit to work with
    let fallbackUnit = defaultUnits.pcs || 
                      defaultUnits.kg || 
                      defaultUnits.g || 
                      defaultUnits.l || 
                      defaultUnits.ml || 
                      await Unit.findOne();
    
    if (!fallbackUnit) {
      console.log('❌ No units found in database. Creating default "pieces" unit...');
      fallbackUnit = new Unit({
        name: 'Pieces',
        shortCode: 'pcs',
        type: 'pack',
        isBase: true,
        status: 'show'
      });
      await fallbackUnit.save();
      console.log('✅ Created default "pieces" unit');
    }
    
    const stats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const product of products) {
      try {
        stats.processed++;
        
        // Check if product already has ProductUnits
        const existingUnits = await ProductUnit.find({
          $or: [
            { product: product._id },
            { productId: product._id }
          ]
        });
        
        if (existingUnits.length > 0) {
          console.log(`⏭️  Product ${product.title?.en || product._id} already has ${existingUnits.length} units`);
          stats.skipped++;
          continue;
        }
        
        // Determine the best unit for this product
        let unitToUse = fallbackUnit;
        
        // Use product's basic unit if available
        if (product.basicUnit) {
          unitToUse = product.basicUnit;
        } else {
          // Try to guess based on product title/category
          const productTitle = (product.title?.en || product.title || '').toLowerCase();
          
          if (productTitle.includes('kg') || productTitle.includes('kilogram')) {
            unitToUse = defaultUnits.kg || fallbackUnit;
          } else if (productTitle.includes('gram') || productTitle.includes('gm')) {
            unitToUse = defaultUnits.g || fallbackUnit;
          } else if (productTitle.includes('liter') || productTitle.includes('litre')) {
            unitToUse = defaultUnits.l || fallbackUnit;
          } else if (productTitle.includes('ml') || productTitle.includes('milliliter')) {
            unitToUse = defaultUnits.ml || fallbackUnit;
          }
        }
        
        // Create default ProductUnit
        const newProductUnit = new ProductUnit({
          product: product._id,
          unit: unitToUse._id,
          unitValue: 1,
          packQty: 1,
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          sku: product.sku || "",
          barcode: product.barcode || "",
          isDefault: true,
          isActive: true,
          title: `${unitToUse.name} pack`,
          description: `Default unit for ${product.title?.en || 'product'}`,
          minOrderQuantity: 1,
          costPrice: 0,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
          attributes: {},
          sortOrder: 0
        });
        
        await newProductUnit.save();
        
        // Update product to ensure it has basicUnit set
        if (!product.basicUnit) {
          await Product.findByIdAndUpdate(product._id, {
            basicUnit: unitToUse._id,
            hasMultiUnits: true,
            availableUnits: [unitToUse._id]
          });
        } else {
          await Product.findByIdAndUpdate(product._id, {
            hasMultiUnits: true,
            availableUnits: [unitToUse._id]
          });
        }
        
        console.log(`✅ Created ProductUnit for ${product.title?.en || product._id} with unit ${unitToUse.name}`);
        stats.created++;
        
      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error.message);
        stats.errors++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Processed: ${stats.processed} products`);
    console.log(`   Created: ${stats.created} ProductUnits`);
    console.log(`   Skipped: ${stats.skipped} products (already had units)`);
    console.log(`   Errors: ${stats.errors} errors`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
};

// If this file is run directly
if (require.main === module) {
  const runMigration = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/saptmarkets', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('🔗 Connected to MongoDB');
      
      await createMissingProductUnits();
      
    } catch (error) {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    }
  };
  
  runMigration();
}

module.exports = createMissingProductUnits; 