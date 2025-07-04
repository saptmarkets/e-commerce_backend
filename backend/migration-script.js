// migrationScript.js
const mongoose = require('mongoose');

// Import models
const Product = require('./models/Product');
const Unit = require('./models/Unit');
const ProductUnit = require('./models/ProductUnit');

// --- CONFIGURATION ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/saptmarkets'; // REPLACE WITH YOUR ACTUAL CONNECTION STRING

// For Phase 1: Define your core parent units
const CORE_PARENT_UNITS_DEFINITIONS = [
  { name: "Piece", shortCode: "pcs", description: "A single item", type: "piece" },
  { name: "Gram", shortCode: "g", description: "Unit of mass", type: "weight" },
  { name: "Kilogram", shortCode: "kg", description: "1000 grams", type: "weight" },
  { name: "Milliliter", shortCode: "ml", description: "Unit of volume", type: "volume" },
  { name: "Liter", shortCode: "l", description: "1000 milliliters", type: "volume" },
  { name: "Bottle", shortCode: "bottle", description: "Container unit", type: "package" },
  { name: "Can", shortCode: "can", description: "Can container", type: "package" },
  { name: "Pack", shortCode: "pack", description: "Generic package", type: "package" },
  { name: "Box", shortCode: "box", description: "Box container", type: "package" },
];

// Rules for Phase 2: Identifying child units from existing Unit names
// CUSTOMIZE THESE BASED ON YOUR ACTUAL DATA
const CHILD_UNIT_RULES = [
  { namePattern: /dozen/i, parentShortCode: 'pcs', packValue: 12, newShortCode: 'dz' },
  { namePattern: /half dozen/i, parentShortCode: 'pcs', packValue: 6, newShortCode: 'hdz' },
  { namePattern: /pack of (\d+)/i, parentShortCode: 'pcs', extractPackValue: true, index: 1, newShortCodePrefix: 'pk' },
  { namePattern: /box (\d+)/i, parentShortCode: 'pcs', extractPackValue: true, index: 1, newShortCodePrefix: 'box' },
  { namePattern: /ctn (\d+)/i, parentShortCode: 'pcs', extractPackValue: true, index: 1, newShortCodePrefix: 'ctn' },
  { namePattern: /(\d+)\s*kg/i, parentShortCode: 'kg', extractPackValue: true, index: 1, newShortCodePrefix: 'kg' },
  { namePattern: /(\d+)\s*gm/i, parentShortCode: 'g', extractPackValue: true, index: 1, newShortCodePrefix: 'gm' },
  { namePattern: /(\d+)\s*ltr/i, parentShortCode: 'l', extractPackValue: true, index: 1, newShortCodePrefix: 'ltr' },
];

async function runMigration() {
  try {
    console.log('🚀 Starting Migration Process...');
    
    // Updated connection with proper options for newer MongoDB drivers
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log('✅ MongoDB Connected for migration...');

    // --- PHASE 0: Backup Warning ---
    console.log('\n📋 PHASE 0: BACKUP WARNING');
    console.log('⚠️  ENSURE YOU HAVE A DATABASE BACKUP BEFORE PROCEEDING!');
    console.log('⚠️  This script will modify your data structure.');
    
    // Wait for user confirmation in production
    // Uncomment the following lines for production use:
    // const readline = require('readline');
    // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // await new Promise(resolve => rl.question('Type "PROCEED" to continue: ', (answer) => { 
    //   if (answer !== 'PROCEED') { console.log('Migration cancelled.'); process.exit(0); } 
    //   rl.close(); resolve(); 
    // }));

    // --- PHASE 1: Establish Core Parent Units ---
    console.log('\n🔧 PHASE 1: Establish Core Parent Units');
    const coreParentUnitIds = {};
    
    for (const def of CORE_PARENT_UNITS_DEFINITIONS) {
      try {
        const parentUnit = await Unit.findOneAndUpdate(
          { shortCode: def.shortCode },
          {
            $setOnInsert: {
              name: def.name,
              shortCode: def.shortCode,
              description: def.description,
              type: def.type,
              isParent: true,
              parentUnit: null,
              packValue: 1,
              conversionFactor: 1,
              status: 'show',
              sortOrder: 0,
            }
          },
          { upsert: true, new: true, runValidators: true }
        );
        coreParentUnitIds[def.shortCode] = parentUnit._id;
        console.log(`✅ Upserted core parent unit: ${parentUnit.name} (${parentUnit.shortCode}) - ID: ${parentUnit._id}`);
      } catch (error) {
        console.error(`❌ Error upserting core parent unit ${def.name}: ${error.message}`);
      }
    }
    console.log('✅ Phase 1 Complete - Core parent units established');

    // --- PHASE 2: Restructure Existing Global Units ---
    console.log('\n🔧 PHASE 2: Restructure Existing Global Units');
    const allUnits = await Unit.find({});
    let restructuredCount = 0;
    
    for (const unit of allUnits) {
      let updated = false;
      
      // Skip already processed core parents
      if (CORE_PARENT_UNITS_DEFINITIONS.some(def => def.shortCode === unit.shortCode && unit.isParent)) {
        if (unit.packValue !== 1 || unit.parentUnit !== null) {
          unit.packValue = 1;
          unit.conversionFactor = 1;
          unit.parentUnit = null;
          unit.isParent = true;
          await unit.save();
          console.log(`🔄 Standardized core parent: ${unit.name}`);
        }
        continue;
      }

      for (const rule of CHILD_UNIT_RULES) {
        const match = unit.name.match(rule.namePattern);
        if (match) {
          const parentUnitId = coreParentUnitIds[rule.parentShortCode];
          if (!parentUnitId) {
            console.warn(`⚠️  Parent unit for shortCode '${rule.parentShortCode}' not found for unit '${unit.name}'. Skipping rule.`);
            continue;
          }
          
          let packValue;
          if (rule.extractPackValue && match[rule.index]) {
            packValue = parseInt(match[rule.index], 10);
          } else {
            packValue = rule.packValue;
          }

          if (packValue && packValue > 0) {
            unit.isParent = false;
            unit.parentUnit = parentUnitId;
            unit.packValue = packValue;
            unit.conversionFactor = packValue;
            
            // Generate new shortCode
            if (rule.newShortCode) {
              unit.shortCode = rule.newShortCode;
            } else if (rule.newShortCodePrefix) {
              unit.shortCode = `${rule.newShortCodePrefix}${packValue}`;
            }

            // Handle shortCode collision
            const existingShortCodeUnit = await Unit.findOne({ 
              shortCode: unit.shortCode, 
              _id: { $ne: unit._id } 
            });
            if (existingShortCodeUnit) {
              console.warn(`⚠️  Derived shortCode ${unit.shortCode} for ${unit.name} already exists. Appending ID suffix.`);
              unit.shortCode = `${unit.shortCode}_${unit._id.toString().slice(-4)}`;
            }
            
            console.log(`🔄 Applied child rule to Unit '${unit.name}': parent='${rule.parentShortCode}', packValue=${packValue}, newShortCode='${unit.shortCode}'`);
            updated = true;
            restructuredCount++;
            break;
          }
        }
      }
      
      if (updated) {
        try {
          await unit.save();
        } catch (saveError) {
          console.error(`❌ Error saving updated unit ${unit.name} (${unit._id}): ${saveError.message}`);
        }
      } else if (!CORE_PARENT_UNITS_DEFINITIONS.some(def => def.shortCode === unit.shortCode) && 
                 unit.isParent && (unit.parentUnit || unit.packValue !== 1)) {
        console.warn(`⚠️  Unit '${unit.name}' (${unit._id}) was not matched by child rules and is not a core parent. Current state: isParent=${unit.isParent}, parentUnit=${unit.parentUnit}, packValue=${unit.packValue}. Review manually.`);
      }
    }
    console.log(`✅ Phase 2 Complete - Restructured ${restructuredCount} units`);

    // --- PHASE 3: Migrate Product Data ---
    console.log('\n🔧 PHASE 3: Migrate Product Data');
    const products = await Product.find({});
    let migratedProductsCount = 0;
    
    for (const product of products) {
      let productModified = false;
      let correctBasicUnitId = product.basicUnit;

      // 1. Determine correctBasicUnitId
      if (!correctBasicUnitId && product.basicUnitType) {
        correctBasicUnitId = coreParentUnitIds[product.basicUnitType];
        if (correctBasicUnitId) {
          console.log(`🔄 Product ${product._id}: Mapped old basicUnitType '${product.basicUnitType}' to Unit ID '${correctBasicUnitId}'.`);
          product.basicUnit = correctBasicUnitId;
          productModified = true;
        } else {
          console.warn(`⚠️  Product ${product._id}: Could not map old basicUnitType '${product.basicUnitType}' to a core parent Unit ID.`);
        }
      }
      
      // Ensure the determined basicUnit is indeed a parent unit
      if (correctBasicUnitId) {
        const basicUnitDoc = await Unit.findById(correctBasicUnitId);
        if (!basicUnitDoc) {
          console.warn(`⚠️  Product ${product._id}: basicUnit ID '${correctBasicUnitId}' does not exist in Units collection. Clearing basicUnit.`);
          product.basicUnit = undefined;
          correctBasicUnitId = null;
          productModified = true;
        } else if (!basicUnitDoc.isParent) {
          console.warn(`⚠️  Product ${product._id}: basicUnit '${basicUnitDoc.name}' (ID: ${correctBasicUnitId}) is NOT a parent unit. Finding ultimate parent.`);
          let ultimateParent = basicUnitDoc;
          let depth = 0;
          while (ultimateParent.parentUnit && depth < 10) {
            ultimateParent = await Unit.findById(ultimateParent.parentUnit);
            if (!ultimateParent) break;
            depth++;
          }
          if (ultimateParent && ultimateParent.isParent) {
            console.log(`🔄 Product ${product._id}: Found ultimate parent '${ultimateParent.name}' for child basic unit.`);
            product.basicUnit = ultimateParent._id;
            correctBasicUnitId = ultimateParent._id;
          } else {
            console.error(`❌ Product ${product._id}: Could not find ultimate parent for basicUnit '${basicUnitDoc.name}'. Needs manual fix.`);
            product.basicUnit = undefined;
            correctBasicUnitId = null;
          }
          productModified = true;
        }
      } else if (!product.basicUnit) {
        console.warn(`⚠️  Product ${product._id} has no determinable basicUnit. Skipping default ProductUnit creation.`);
      }

      // 2. Ensure Default ProductUnit Exists
      if (correctBasicUnitId && product.price !== undefined) {
        const defaultPU = await ProductUnit.findOneAndUpdate(
          { productId: product._id, unitId: correctBasicUnitId, unitValue: 1 },
          {
            $setOnInsert: {
              productId: product._id,
              unitId: correctBasicUnitId,
              unitValue: 1,
              price: product.price,
              originalPrice: product.price,
              sku: product.sku,
              barcode: product.barcode,
              isDefault: true,
              isActive: true,
            }
          },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`✅ Product ${product._id}: Ensured default ProductUnit (ID: ${defaultPU._id}) for basicUnit.`);
        
        // 3. Update Product.availableUnits & hasMultiUnits
        if (!product.availableUnits || product.availableUnits.length === 0 || 
            !product.availableUnits.map(String).includes(String(correctBasicUnitId))) {
          await Product.findByIdAndUpdate(product._id, { 
            $addToSet: { availableUnits: correctBasicUnitId } 
          });
          console.log(`🔄 Product ${product._id}: Added basicUnit to availableUnits.`);
        }
        
        if (!product.hasMultiUnits) {
          product.hasMultiUnits = true;
          productModified = true;
        }
      }

      // 4. Cleanup old fields
      if (product.multiUnits && product.multiUnits.length === 0) {
        product.multiUnits = undefined;
        productModified = true;
      }
      
      if (productModified) {
        try {
          await product.save();
          migratedProductsCount++;
          console.log(`✅ Product ${product._id} saved with updated basicUnit and flags.`);
        } catch (saveError) {
          console.error(`❌ Error saving migrated product ${product._id}: ${saveError.message}`);
        }
      }
    }
    console.log(`✅ Phase 3 Complete - Migrated ${migratedProductsCount} products`);

    // --- PHASE 4: Migrate Product.multiUnits Array to ProductUnit Collection ---
    console.log('\n🔧 PHASE 4: Migrate Product.multiUnits to ProductUnit Collection');
    const productsWithOldMultiUnits = await Product.find({ 
      multiUnits: { $exists: true, $ne: [] } 
    });
    let migratedMultiUnitsCount = 0;

    for (const product of productsWithOldMultiUnits) {
      console.log(`🔄 Processing product ${product._id} with ${product.multiUnits.length} items in old multiUnits array.`);
      
      for (const item of product.multiUnits) {
        if (!item.unit) {
          console.warn(`⚠️  Product ${product._id}: Item in multiUnits array has no unit ID. Skipping.`);
          continue;
        }

        const globalUnitReferenced = await Unit.findById(item.unit);
        if (!globalUnitReferenced) {
          console.warn(`⚠️  Product ${product._id}: Unit ID '${item.unit}' from multiUnits not found. Skipping.`);
          continue;
        }

        try {
          const pu = await ProductUnit.findOneAndUpdate(
            { 
              productId: product._id, 
              unitId: globalUnitReferenced._id, 
              unitValue: 1 
            },
            {
              $setOnInsert: {
                productId: product._id,
                unitId: globalUnitReferenced._id,
                unitValue: 1, 
                price: item.price,
                originalPrice: item.originalPrice || item.price,
                sku: item.sku,
                barcode: item.barcode,
                isActive: item.isActive !== undefined ? item.isActive : true,
                isDefault: (product.basicUnit && product.basicUnit.equals(globalUnitReferenced._id)),
              }
            },
            { upsert: true, new: true, runValidators: true }
          );
          console.log(`  ✅ Migrated ProductUnit for product ${product._id}, unit '${globalUnitReferenced.name}', price ${item.price}. PU_ID: ${pu._id}`);
          migratedMultiUnitsCount++;
          
          // Add to product.availableUnits
          await Product.updateOne(
            { _id: product._id }, 
            { $addToSet: { availableUnits: globalUnitReferenced._id } }
          );

        } catch (puError) {
          console.error(`  ❌ Error creating ProductUnit for product ${product._id}, unit ${globalUnitReferenced.name}: ${puError.message}`);
        }
      }

      // Clear the old multiUnits array
      product.multiUnits = undefined;
      try {
        await product.save();
        console.log(`✅ Product ${product._id}: Processed and cleared old multiUnits array.`);
      } catch (saveError) {
        console.error(`❌ Error saving product ${product._id} after clearing multiUnits: ${saveError.message}`);
      }
    }
    console.log(`✅ Phase 4 Complete - Migrated ${migratedMultiUnitsCount} multiUnits`);

    // --- PHASE 5: Final Review & Cleanup ---
    console.log('\n🔧 PHASE 5: Final Review & Cleanup');
    const productsWithoutBasicUnit = await Product.countDocuments({ 
      basicUnit: { $exists: false } 
    });
    const totalProducts = await Product.countDocuments({});
    const totalUnits = await Unit.countDocuments({});
    const totalProductUnits = await ProductUnit.countDocuments({});
    
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`📦 Total Products: ${totalProducts}`);
    console.log(`📦 Products without basicUnit: ${productsWithoutBasicUnit}`);
    console.log(`🏷️  Total Units: ${totalUnits}`);
    console.log(`🏷️  Total ProductUnits: ${totalProductUnits}`);
    console.log(`🔄 Products migrated: ${migratedProductsCount}`);
    console.log(`🔄 MultiUnits migrated: ${migratedMultiUnitsCount}`);
    console.log(`🔄 Units restructured: ${restructuredCount}`);
    
    if (productsWithoutBasicUnit > 0) {
      console.warn(`⚠️  ${productsWithoutBasicUnit} products still without basicUnit - requires manual review`);
    }
    
    console.log('\n✅ Migration script finished successfully!');
    console.log('📋 PLEASE REVIEW LOGS CAREFULLY FOR ANY WARNINGS OR ERRORS.');

  } catch (error) {
    console.error('❌ A critical error occurred during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected.');
  }
}

// Helper function to run with confirmation
async function runWithConfirmation() {
  console.log('🚀 saptmarkets Migration Script');
  console.log('==============================');
  console.log('This script will migrate your database to the new hierarchical unit system.');
  console.log('');
  console.log('⚠️  IMPORTANT: Ensure you have a complete database backup before proceeding!');
  console.log('');
  
  // For production use, uncomment these lines:
  // const readline = require('readline');
  // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // const answer = await new Promise(resolve => 
  //   rl.question('Do you want to continue? (yes/no): ', resolve)
  // );
  // rl.close();
  // 
  // if (answer.toLowerCase() !== 'yes') {
  //   console.log('Migration cancelled.');
  //   process.exit(0);
  // }

  await runMigration();
}

// Run the migration
if (require.main === module) {
  runWithConfirmation().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration }; 