require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Database connection (using same approach as main app)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';
    console.log('Connecting to MongoDB:', mongoURI);
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

// Migration function
const migrateCategoriesFromHome = async () => {
  try {
    console.log('🚀 Starting category migration...');
    
    // Step 1: Find the Home category
    const homeCategory = await Category.findOne({ 
      $or: [
        { 'name.en': 'Home' },
        { 'name.en': 'HOME' },
        { 'name.en': 'home' },
        { parentName: 'Home' },
        { id: 'Root' }
      ]
    });
    
    if (!homeCategory) {
      console.log('❌ No Home category found');
      return;
    }
    
    console.log('🏠 Found Home category:', {
      id: homeCategory._id,
      name: homeCategory.name,
      parentId: homeCategory.parentId,
      parentName: homeCategory.parentName
    });
    
    // Step 2: Find all categories that have Home as parent
    const childCategories = await Category.find({
      $or: [
        { parentId: homeCategory._id.toString() },
        { parentId: homeCategory._id },
        { parentName: 'Home' }
      ]
    });
    
    console.log(`📋 Found ${childCategories.length} categories under Home:`);
    childCategories.forEach(cat => {
      console.log(`  - ${cat.name?.en || 'Unnamed'} (ID: ${cat._id})`);
    });
    
    if (childCategories.length === 0) {
      console.log('✅ No categories found under Home. Migration not needed.');
      return;
    }
    
    // Step 3: Move child categories to be top-level
    const updateResults = [];
    for (const category of childCategories) {
      try {
        const result = await Category.updateOne(
          { _id: category._id },
          { 
            $unset: { 
              parentId: 1, 
              parentName: 1 
            }
          }
        );
        
        updateResults.push({
          name: category.name?.en || 'Unnamed',
          id: category._id,
          success: result.modifiedCount > 0
        });
        
        console.log(`✅ Updated: ${category.name?.en || 'Unnamed'}`);
      } catch (error) {
        console.error(`❌ Failed to update ${category.name?.en || 'Unnamed'}:`, error.message);
        updateResults.push({
          name: category.name?.en || 'Unnamed',
          id: category._id,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 4: Optionally remove/update the Home category
    console.log('\n🤔 What to do with Home category?');
    console.log('Options:');
    console.log('1. Keep Home category as empty parent');
    console.log('2. Delete Home category');
    console.log('3. Convert Home category to regular category');
    
    // For safety, we'll keep it but log the recommendation
    console.log('🔒 Keeping Home category for safety. You can manually delete it if not needed.');
    
    // Step 5: Summary
    const successful = updateResults.filter(r => r.success).length;
    const failed = updateResults.filter(r => !r.success).length;
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${successful} categories`);
    console.log(`❌ Failed to update: ${failed} categories`);
    
    if (failed > 0) {
      console.log('\n❌ Failed categories:');
      updateResults.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n🎉 Category migration completed!');
    console.log('📝 Categories are now top-level and no longer under Home');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Verify migration function
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Check for categories still under Home
    const homeCategory = await Category.findOne({ 
      $or: [
        { 'name.en': 'Home' },
        { 'name.en': 'HOME' },
        { 'name.en': 'home' }
      ]
    });
    
    if (homeCategory) {
      const stillUnderHome = await Category.find({
        $or: [
          { parentId: homeCategory._id.toString() },
          { parentId: homeCategory._id },
          { parentName: 'Home' }
        ]
      });
      
      if (stillUnderHome.length > 0) {
        console.log(`⚠️  Warning: ${stillUnderHome.length} categories still under Home`);
        stillUnderHome.forEach(cat => {
          console.log(`  - ${cat.name?.en || 'Unnamed'}`);
        });
      } else {
        console.log('✅ No categories remain under Home');
      }
    }
    
    // Show top-level categories
    const topLevelCategories = await Category.find({
      $or: [
        { parentId: { $exists: false } },
        { parentId: null },
        { parentId: '' }
      ]
    });
    
    console.log(`\n📋 Top-level categories (${topLevelCategories.length}):`);
    topLevelCategories.forEach(cat => {
      console.log(`  - ${cat.name?.en || 'Unnamed'} (ID: ${cat._id})`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Run migration
    await migrateCategoriesFromHome();
    
    // Verify results
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
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
  migrateCategoriesFromHome,
  verifyMigration
}; 