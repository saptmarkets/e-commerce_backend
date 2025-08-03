const mongoose = require('mongoose');
const Unit = require('../models/Unit');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Arabic name mappings based on English names and shortCodes
const arabicNameMappings = {
  // Carton variations
  'CTN': 'كرتون',
  'ctn': 'كرتون',
  'Carton': 'كرتون',
  'carton': 'كرتون',
  
  // Weight units
  'kg': 'كيلو',
  'KG': 'كيلو',
  'Kilogram': 'كيلو',
  'kilogram': 'كيلو',
  'g': 'جرام',
  'G': 'جرام',
  'Gram': 'جرام',
  'gram': 'جرام',
  
  // Volume units
  'l': 'لتر',
  'L': 'لتر',
  'Liter': 'لتر',
  'liter': 'لتر',
  'ml': 'مل',
  'ML': 'مل',
  'Milliliter': 'مل',
  'milliliter': 'مل',
  
  // Count units
  'pcs': 'قطعة',
  'PCS': 'قطعة',
  'Pieces': 'قطعة',
  'pieces': 'قطعة',
  'Piece': 'قطعة',
  'piece': 'قطعة',
  
  // Pack units
  'pack': 'حزمة',
  'Pack': 'حزمة',
  'box': 'صندوق',
  'Box': 'صندوق',
  'bottle': 'زجاجة',
  'Bottle': 'زجاجة',
  'can': 'علبة',
  'Can': 'علبة',
  'dozen': 'دزينة',
  'Dozen': 'دزينة'
};

// Function to determine Arabic name based on English name and shortCode
const getArabicName = (englishName, shortCode) => {
  // First, try to match the exact English name
  if (arabicNameMappings[englishName]) {
    return arabicNameMappings[englishName];
  }
  
  // Then try to match the shortCode
  if (arabicNameMappings[shortCode]) {
    return arabicNameMappings[shortCode];
  }
  
  // Handle carton variations with numbers (e.g., "CTN 100", "CTN 18")
  if (englishName.toLowerCase().includes('ctn') || shortCode.toLowerCase().includes('ctn')) {
    return 'كرتون';
  }
  
  // Handle numeric shortCodes that represent carton quantities
  if (/^\d+$/.test(shortCode) && parseInt(shortCode) > 1) {
    return 'كرتون';
  }
  
  // Handle cases where English name contains carton-related words
  if (englishName.toLowerCase().includes('carton')) {
    return 'كرتون';
  }
  
  return null; // No mapping found
};

// Main migration function
const updateUnitArabicNames = async () => {
  try {
    console.log('🚀 Starting Unit Arabic Names Update...');
    
    // Get all units that don't have Arabic names or have empty Arabic names
    const unitsToUpdate = await Unit.find({
      $or: [
        { nameAr: { $exists: false } },
        { nameAr: "" },
        { nameAr: null }
      ]
    });
    
    console.log(`📊 Found ${unitsToUpdate.length} units without Arabic names`);
    
    const stats = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const unit of unitsToUpdate) {
      try {
        stats.processed++;
        
        console.log(`\n🔍 Processing unit: ${unit.name} (shortCode: ${unit.shortCode})`);
        
        // Get Arabic name based on English name and shortCode
        const arabicName = getArabicName(unit.name, unit.shortCode);
        
        if (arabicName) {
          // Update the unit with the Arabic name
          await Unit.findByIdAndUpdate(unit._id, {
            nameAr: arabicName
          });
          
          console.log(`✅ Updated unit "${unit.name}" with Arabic name: "${arabicName}"`);
          stats.updated++;
        } else {
          console.log(`⚠️  No Arabic mapping found for unit: ${unit.name} (${unit.shortCode})`);
          stats.skipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error updating unit ${unit.name}:`, error.message);
        stats.errors++;
      }
    }
    
    console.log('\n📈 Unit Arabic Names Update Summary:');
    console.log(`   Processed: ${stats.processed} units`);
    console.log(`   Updated: ${stats.updated} units`);
    console.log(`   Skipped: ${stats.skipped} units (no mapping found)`);
    console.log(`   Errors: ${stats.errors} errors`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Unit Arabic names update completed successfully!');
    } else {
      console.log('\n⚠️  Unit Arabic names update completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('💥 Unit Arabic names update failed:', error);
    throw error;
  }
};

// Run the migration
const runMigration = async () => {
  try {
    await connectDB();
    await updateUnitArabicNames();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { updateUnitArabicNames, getArabicName }; 