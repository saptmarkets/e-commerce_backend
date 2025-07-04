const mongoose = require('mongoose');
const Product = require('./models/Product');
const Unit = require('./models/Unit');
const ProductUnit = require('./models/ProductUnit');
const Category = require('./models/Category');

// First, let's ensure we have all basic units
const REQUIRED_BASIC_UNITS = [
  { name: "Piece", shortCode: "pcs", description: "A single item", type: "piece" },
  { name: "Gram", shortCode: "g", description: "Unit of mass", type: "weight" },
  { name: "Kilogram", shortCode: "kg", description: "1000 grams", type: "weight" },
  { name: "Milliliter", shortCode: "ml", description: "Unit of volume", type: "volume" },
  { name: "Liter", shortCode: "l", description: "1000 milliliters", type: "volume" },
];

// Configuration for automatic unit assignment based on product categories/names
const AUTO_UNIT_ASSIGNMENT_RULES = [
  // Food items - typically sold by weight
  { categoryPattern: /food|grocery|meat|vegetable|fruit/i, unitShortCode: 'kg' },
  { titlePattern: /rice|flour|sugar|salt|oil/i, unitShortCode: 'kg' },
  
  // Beverages - typically sold by volume  
  { categoryPattern: /beverage|drink|juice/i, unitShortCode: 'l' },
  { titlePattern: /water|juice|milk|soda/i, unitShortCode: 'l' },
  
  // Packaged items - typically sold by piece
  { categoryPattern: /electronics|clothing|accessories/i, unitShortCode: 'pcs' },
  { titlePattern: /phone|shirt|bag|watch/i, unitShortCode: 'pcs' },
  
  // Default fallback - piece
  { default: true, unitShortCode: 'pcs' }
];

async function ensureBasicUnits() {
  console.log('🔧 Ensuring all required basic units exist...');
  
  for (const unitDef of REQUIRED_BASIC_UNITS) {
    try {
      await Unit.findOneAndUpdate(
        { shortCode: unitDef.shortCode },
        {
          $setOnInsert: {
            name: unitDef.name,
            shortCode: unitDef.shortCode,
            description: unitDef.description,
            type: unitDef.type,
            isParent: true,
            parentUnit: null,
            packValue: 1,
            conversionFactor: 1,
            status: 'show',
            sortOrder: 0,
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Ensured unit: ${unitDef.name} (${unitDef.shortCode})`);
    } catch (error) {
      console.error(`❌ Error ensuring unit ${unitDef.name}: ${error.message}`);
    }
  }
}

async function assignBasicUnits() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB');
    
    // First ensure all basic units exist
    await ensureBasicUnits();
    
    // Get all available basic units
    const basicUnits = await Unit.find({ isParent: true });
    const unitMap = {};
    basicUnits.forEach(unit => {
      unitMap[unit.shortCode] = unit._id;
    });
    
    console.log('\n🏷️  Available Basic Units:');
    basicUnits.forEach(unit => {
      console.log(`- ${unit.name} (${unit.shortCode})`);
    });
    
    // Get products without basicUnit (removed populate to avoid Category schema issue)
    const productsToUpdate = await Product.find({ 
      $or: [
        { basicUnit: { $exists: false } },
        { basicUnit: null }
      ]
    });
    
    console.log(`\n📦 Found ${productsToUpdate.length} products without basicUnit`);
    
    let updatedCount = 0;
    let createdProductUnits = 0;
    
    for (const product of productsToUpdate) {
      let assignedUnitId = null;
      let assignedUnitShortCode = null;
      
      // Try to match against rules
      for (const rule of AUTO_UNIT_ASSIGNMENT_RULES) {
        if (rule.default) {
          // This is the fallback rule
          assignedUnitId = unitMap[rule.unitShortCode];
          assignedUnitShortCode = rule.unitShortCode;
          break;
        }
        
        // Check title pattern (since we can't populate categories for now)
        if (rule.titlePattern && rule.titlePattern.test(product.title || '')) {
          assignedUnitId = unitMap[rule.unitShortCode];
          assignedUnitShortCode = rule.unitShortCode;
          break;
        }
      }
      
      if (assignedUnitId) {
        // Update product with basic unit
        await Product.findByIdAndUpdate(product._id, {
          basicUnit: assignedUnitId,
          basicUnitType: assignedUnitShortCode, // Keep for backward compatibility
          hasMultiUnits: true,
          $addToSet: { availableUnits: assignedUnitId }
        });
        
        // Create default ProductUnit entry
        const productUnitData = {
          productId: product._id,
          unitId: assignedUnitId,
          unitValue: 1,
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          sku: product.sku ? `${product.sku}_${assignedUnitShortCode}` : undefined,
          barcode: product.barcode || undefined,
          isDefault: true,
          isActive: true,
        };
        
        try {
          await ProductUnit.findOneAndUpdate(
            { productId: product._id, unitId: assignedUnitId, unitValue: 1 },
            productUnitData,
            { upsert: true, new: true }
          );
          createdProductUnits++;
        } catch (puError) {
          console.warn(`⚠️  Could not create ProductUnit for ${product.title}: ${puError.message}`);
        }
        
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`📦 Processed ${updatedCount} products...`);
        }
      }
    }
    
    console.log('\n✅ ASSIGNMENT COMPLETE:');
    console.log(`📦 Products updated: ${updatedCount}`);
    console.log(`🏷️  ProductUnits created: ${createdProductUnits}`);
    
    // Final verification
    const remainingProducts = await Product.countDocuments({
      $or: [
        { basicUnit: { $exists: false } },
        { basicUnit: null }
      ]
    });
    
    console.log(`📦 Products still without basicUnit: ${remainingProducts}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Interactive mode for manual assignment
async function interactiveAssignment() {
  console.log('\n🎯 MANUAL UNIT ASSIGNMENT');
  console.log('This will show you products and let you assign units manually.');
  console.log('For now, running automatic assignment based on patterns...\n');
  
  await assignBasicUnits();
}

// Run the assignment
interactiveAssignment(); 