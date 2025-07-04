const mongoose = require('mongoose');
const Unit = require('../models/Unit');

const basicUnits = [
  { name: 'Pieces', shortCode: 'pcs', type: 'pack', isBase: true, status: 'show' },
  { name: 'Kilogram', shortCode: 'kg', type: 'weight', isBase: true, status: 'show' },
  { name: 'Gram', shortCode: 'g', type: 'weight', isBase: true, status: 'show' },
  { name: 'Liter', shortCode: 'l', type: 'volume', isBase: true, status: 'show' },
  { name: 'Milliliter', shortCode: 'ml', type: 'volume', isBase: true, status: 'show' },
  { name: 'Meter', shortCode: 'm', type: 'length', isBase: true, status: 'show' },
  { name: 'Centimeter', shortCode: 'cm', type: 'length', isBase: true, status: 'show' },
  { name: 'Pack', shortCode: 'pack', type: 'pack', isBase: false, status: 'show' },
  { name: 'Box', shortCode: 'box', type: 'pack', isBase: false, status: 'show' },
  { name: 'Bottle', shortCode: 'bottle', type: 'pack', isBase: false, status: 'show' },
  { name: 'Can', shortCode: 'can', type: 'pack', isBase: false, status: 'show' },
  { name: 'Dozen', shortCode: 'dozen', type: 'pack', isBase: false, status: 'show' }
];

const createBasicUnits = async (skipConnection = false) => {
  if (!skipConnection) {
    console.log('🚀 Starting Basic Units migration...');
  }
  
  try {
    const stats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const unitData of basicUnits) {
      try {
        stats.processed++;
        
        // Check if unit already exists
        const existingUnit = await Unit.findOne({ 
          $or: [
            { shortCode: unitData.shortCode },
            { name: unitData.name }
          ]
        });
        
        if (existingUnit) {
          console.log(`⏭️  Unit ${unitData.name} (${unitData.shortCode}) already exists`);
          stats.skipped++;
          continue;
        }
        
        // Create new unit
        const newUnit = new Unit(unitData);
        await newUnit.save();
        
        console.log(`✅ Created unit: ${unitData.name} (${unitData.shortCode})`);
        stats.created++;
        
      } catch (error) {
        console.error(`❌ Error creating unit ${unitData.name}:`, error.message);
        stats.errors++;
      }
    }
    
    console.log('\n📈 Basic Units Migration Summary:');
    console.log(`   Processed: ${stats.processed} units`);
    console.log(`   Created: ${stats.created} units`);
    console.log(`   Skipped: ${stats.skipped} units (already existed)`);
    console.log(`   Errors: ${stats.errors} errors`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Basic units migration completed successfully!');
    } else {
      console.log('\n⚠️  Basic units migration completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('💥 Basic units migration failed:', error);
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
      
      await createBasicUnits();
      
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

module.exports = createBasicUnits; 