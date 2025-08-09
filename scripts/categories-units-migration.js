require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Unit = require('../models/Unit');

// Database connection (using same approach as main app)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Helper function to parse multilingual text
const parseMultilingualText = (text) => {
  // Split by common Arabic patterns
  const parts = text.split(/\s*[-–—]\s*/);
  
  if (parts.length >= 2) {
    return {
      en: parts[0].trim(),
      ar: parts[1].trim()
    };
  }
  
  return {
    en: text.trim(),
    ar: text.trim()
  };
};

// Category data with hierarchy
const categoryHierarchy = [
  'DELI SECTION / Sweets & Jams',
  'VEGETABLE & FRUITS SECTION- قسم الخضار والفاكهة / FRESH FRUITS - الفواكه الطازجة',
  'VEGETABLE & FRUITS SECTION- قسم الخضار والفاكهة / FRESH VEGETABLE - خضار طازج',
  'GROCERY FOOD -- طعام البقالة / CONFECTIONERY- الحلويات / Bakery & Pastry - مخبوزات',
  'GROCERY FOOD -- طعام البقالة / Milk Powder and Long Life Dairy - منتجات الألبان الطويلة الاجل',
  'CHILLED & DAIRIES -- مبرد وألبان / DAIRY PRODUCTS - منتجات الألبان',
  'GROCERY FOOD -- طعام البقالة / CONFECTIONERY- الحلويات / SWEETS & CHOCOLATES- الحلويات والشوكولاتة',
  'GROCERY FOOD -- طعام البقالة / TEA & COFFEE & INSTANT DRINKS- الشاي والقهوة والمشروبات الفورية',
  'GROCERY FOOD -- طعام البقالة / SPICES PULSES & SEASONINGS - التوابل',
  'CHILLED & DAIRIES -- مبرد وألبان / BEVERAGES- المشروبات',
  'GROCERY FOOD -- طعام البقالة / Instant Juices & Flavored Powders',
  'GROCERY NON FOOD- البقالة غير الطعام / CLEANING & HOUSEHOLD SUPPLIES - التنظيف المنزلية',
  'GROCERY FOOD -- طعام البقالة / PASTA & RICE - المعكرونة والارز',
  'GROCERY NON FOOD- البقالة غير الطعام / HEALTH & BEAUTY & Personal care- الصحة والجمال والعناية',
  'GROCERY NON FOOD- البقالة غير الطعام / PAPPER & PLASTIC PRODUCTS - مستلزمات ورقية وبلاستيكية',
  'GROCERY FOOD -- طعام البقالة / Cooking & Baking Supplies- مستلزمات مخبز ومعجنات'
];

// Units data
const unitsData = [
  'pieces', 'pcs', 'kg',
  'KG 2', 'KG 1.500', 'KG 1.200', 'KG 0.500', 'KG 1.800', 'KG 14', 'KG 10', 'KG 4.500',
  'CTN 2', 'CTN 15', 'CTN 6', 'CTN 96', 'CTN 1', 'CTN 24', 'CTN 48', 'CTN 4', 'CTN 12', 'CTN 20', 'CTN 16',
  'KG 5', 'KG 18', 'KG 4.200', 'KG 3.500', 'KG 0.700', 'KG 0.350',
  'CTN 576', 'CTN 10', 'CTN 8'
];

// Migration function for categories
const migrateCategoriesHierarchy = async () => {
  try {
    console.log('🏗️  Starting categories hierarchy migration...');
    
    // Parse category structure
    const categoryMap = new Map(); // Store created categories
    const categoryStats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };
    
    // Process each category path
    for (const categoryPath of categoryHierarchy) {
      categoryStats.processed++;
      console.log(`\n📁 Processing: ${categoryPath}`);
      
      try {
        const levels = categoryPath.split(' / ');
        let parentCategory = null;
        
        // Process each level in the hierarchy
        for (let i = 0; i < levels.length; i++) {
          const levelText = levels[i].trim();
          const categoryName = parseMultilingualText(levelText);
          
          // Generate unique key for this category
          const categoryKey = `${categoryName.en}_${parentCategory?._id || 'root'}`;
          
          // Check if category already exists in our map or database
          let existingCategory = categoryMap.get(categoryKey);
          
          if (!existingCategory) {
            // Check database
            existingCategory = await Category.findOne({
              'name.en': categoryName.en,
              parentId: parentCategory?._id || { $exists: false }
            });
          }
          
          if (existingCategory) {
            console.log(`  ⏭️  Level ${i + 1}: "${categoryName.en}" already exists`);
            parentCategory = existingCategory;
            categoryStats.skipped++;
          } else {
            // Create new category
            const newCategoryData = {
              name: categoryName,
              description: {
                en: `${categoryName.en} category`,
                ar: `فئة ${categoryName.ar || categoryName.en}`
              },
              status: 'show'
            };
            
            // Set parent relationship if this is a subcategory
            if (parentCategory) {
              newCategoryData.parentId = parentCategory._id.toString();
              newCategoryData.parentName = parentCategory.name.en;
            }
            
            const newCategory = new Category(newCategoryData);
            await newCategory.save();
            
            // Store in our map for future reference
            categoryMap.set(categoryKey, newCategory);
            
            console.log(`  ✅ Level ${i + 1}: Created "${categoryName.en}"${parentCategory ? ` under "${parentCategory.name.en}"` : ' (top-level)'}`);
            parentCategory = newCategory;
            categoryStats.created++;
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing "${categoryPath}":`, error.message);
        categoryStats.errors++;
      }
    }
    
    console.log('\n📊 Categories Migration Summary:');
    console.log(`   Processed: ${categoryStats.processed} category paths`);
    console.log(`   Created: ${categoryStats.created} categories`);
    console.log(`   Skipped: ${categoryStats.skipped} categories (already existed)`);
    console.log(`   Errors: ${categoryStats.errors} errors`);
    
    if (categoryStats.errors === 0) {
      console.log('\n🎉 Categories migration completed successfully!');
    } else {
      console.log('\n⚠️  Categories migration completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('💥 Categories migration failed:', error);
    throw error;
  }
};

// Migration function for units
const migrateUnits = async () => {
  try {
    console.log('\n🔧 Starting units migration...');
    
    const unitStats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const unitText of unitsData) {
      unitStats.processed++;
      
      try {
        // Parse unit data
        const unitName = unitText.trim();
        let shortCode = '';
        let unitType = 'pack';
        
        // Determine unit type and short code
        if (unitName.toLowerCase().includes('kg')) {
          unitType = 'weight';
          if (unitName === 'kg') {
            shortCode = 'kg';
          } else {
            shortCode = unitName.toLowerCase().replace(/\s+/g, '');
          }
        } else if (unitName.toLowerCase().includes('ctn')) {
          unitType = 'pack';
          shortCode = unitName.toLowerCase().replace(/\s+/g, '');
        } else if (unitName.toLowerCase() === 'pieces') {
          shortCode = 'pcs';
          unitType = 'pack';
        } else if (unitName.toLowerCase() === 'pcs') {
          shortCode = 'pcs';
          unitType = 'pack';
        } else {
          shortCode = unitName.toLowerCase().replace(/\s+/g, '');
        }
        
        // Check if unit already exists
        const existingUnit = await Unit.findOne({
          $or: [
            { name: unitName },
            { shortCode: shortCode }
          ]
        });
        
        if (existingUnit) {
          console.log(`  ⏭️  Unit "${unitName}" already exists`);
          unitStats.skipped++;
          continue;
        }
        
        // Create new unit
        const newUnitData = {
          name: unitName,
          shortCode: shortCode,
          type: unitType,
          isBase: ['kg', 'pieces', 'pcs'].includes(unitName.toLowerCase()),
          status: 'show'
        };
        
        const newUnit = new Unit(newUnitData);
        await newUnit.save();
        
        console.log(`  ✅ Created unit: "${unitName}" (${shortCode}) - Type: ${unitType}`);
        unitStats.created++;
        
      } catch (error) {
        console.error(`  ❌ Error creating unit "${unitText}":`, error.message);
        unitStats.errors++;
      }
    }
    
    console.log('\n📈 Units Migration Summary:');
    console.log(`   Processed: ${unitStats.processed} units`);
    console.log(`   Created: ${unitStats.created} units`);
    console.log(`   Skipped: ${unitStats.skipped} units (already existed)`);
    console.log(`   Errors: ${unitStats.errors} errors`);
    
    if (unitStats.errors === 0) {
      console.log('\n🎉 Units migration completed successfully!');
    } else {
      console.log('\n⚠️  Units migration completed with some errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('💥 Units migration failed:', error);
    throw error;
  }
};

// Verification function
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Check categories
    const totalCategories = await Category.countDocuments();
    const topLevelCategories = await Category.countDocuments({ 
      $or: [
        { parentId: { $exists: false } },
        { parentId: null },
        { parentId: '' }
      ]
    });
    const subCategories = totalCategories - topLevelCategories;
    
    console.log(`📊 Categories Summary:`);
    console.log(`   Total categories: ${totalCategories}`);
    console.log(`   Top-level categories: ${topLevelCategories}`);
    console.log(`   Sub-categories: ${subCategories}`);
    
    // Check units
    const totalUnits = await Unit.countDocuments();
    const weightUnits = await Unit.countDocuments({ type: 'weight' });
    const packUnits = await Unit.countDocuments({ type: 'pack' });
    
    console.log(`🔧 Units Summary:`);
    console.log(`   Total units: ${totalUnits}`);
    console.log(`   Weight units: ${weightUnits}`);
    console.log(`   Pack units: ${packUnits}`);
    
    // Show sample top-level categories
    const sampleCategories = await Category.find({ 
      $or: [
        { parentId: { $exists: false } },
        { parentId: null },
        { parentId: '' }
      ]
    }).limit(5);
    
    console.log(`\n📋 Sample Top-level Categories:`);
    sampleCategories.forEach(cat => {
      console.log(`   - ${cat.name?.en || 'Unnamed'} (ID: ${cat._id})`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting Categories & Units Migration...\n');
    
    // Run migrations
    await migrateCategoriesHierarchy();
    await migrateUnits();
    
    // Verify results
    await verifyMigration();
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  migrateCategoriesHierarchy,
  migrateUnits,
  verifyMigration
}; 