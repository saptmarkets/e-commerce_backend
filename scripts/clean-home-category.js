const mongoose = require('mongoose');
const Category = require('../models/Category');

mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔍 Connected to MongoDB - Cleaning Home category...');
  
  // Find Home category
  const homeCategory = await Category.findOne({ 'name.en': 'Home' });
  
  if (homeCategory) {
    console.log('🏠 Found Home category:', homeCategory._id);
    
    // Check if any categories still reference Home as parent
    const categoriesUnderHome = await Category.find({
      $or: [
        { parentId: homeCategory._id.toString() },
        { parentId: homeCategory._id },
        { parentName: 'Home' }
      ]
    });
    
    if (categoriesUnderHome.length > 0) {
      console.log('⚠️  Warning: Found', categoriesUnderHome.length, 'categories still under Home:');
      categoriesUnderHome.forEach(cat => {
        console.log('  -', cat.name?.en || 'Unnamed');
      });
      console.log('❌ Cannot delete Home category. Please fix parent relationships first.');
    } else {
      // Safe to delete Home category
      await Category.deleteOne({ _id: homeCategory._id });
      console.log('✅ Successfully deleted Home category');
      
      // Verify deletion
      const verifyHome = await Category.findOne({ 'name.en': 'Home' });
      if (!verifyHome) {
        console.log('✅ Verification: Home category successfully removed');
      } else {
        console.log('❌ Error: Home category still exists');
      }
      
      // Show new top-level count
      const topLevelCount = await Category.countDocuments({
        $or: [
          { parentId: { $exists: false } },
          { parentId: null },
          { parentId: '' }
        ]
      });
      console.log('📊 New top-level categories count:', topLevelCount);
    }
  } else {
    console.log('✅ Home category not found - already clean');
  }
  
  mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
}); 