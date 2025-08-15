const mongoose = require('mongoose');
const Category = require('./models/Category');

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

async function fixBakerySection() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  try {
    // 1. Find the BAKERY SECTION category
    const bakerySection = await Category.findOne({ 
      'name.en': 'BAKERY SECTION',
      status: 'show'
    });
    
    if (!bakerySection) {
      console.log('❌ BAKERY SECTION category not found');
      return;
    }
    
    console.log('🔍 BAKERY SECTION found:', {
      _id: bakerySection._id,
      name: bakerySection.name,
      parentId: bakerySection.parentId,
      hasChildren: bakerySection.children ? bakerySection.children.length : 0
    });

    // 2. Check if it's pointing to itself (circular reference)
    if (bakerySection.parentId === bakerySection._id.toString()) {
      console.log('⚠️  BAKERY SECTION has circular reference - fixing...');
      
      // Set parentId to null since it should be a top-level category
      bakerySection.parentId = null;
      await bakerySection.save();
      
      console.log('✅ Fixed BAKERY SECTION parentId to null');
    } else {
      console.log('✅ BAKERY SECTION parentId is correct');
    }

    // 3. Check for any other categories that might have circular references
    const circularCategories = await Category.find({
      $expr: {
        $eq: ['$_id', '$parentId']
      }
    });
    
    if (circularCategories.length > 0) {
      console.log(`⚠️  Found ${circularCategories.length} categories with circular references:`);
      circularCategories.forEach(cat => {
        console.log(`  - ${cat.name?.en || 'Unknown'} (${cat._id})`);
      });
      
      // Fix all circular references
      for (const cat of circularCategories) {
        cat.parentId = null;
        await cat.save();
        console.log(`✅ Fixed ${cat.name?.en || 'Unknown'} parentId to null`);
      }
    } else {
      console.log('✅ No circular references found');
    }

    // 4. Verify the fix
    const updatedBakerySection = await Category.findById(bakerySection._id);
    console.log('\n🔍 Updated BAKERY SECTION:', {
      _id: updatedBakerySection._id,
      name: updatedBakerySection.name,
      parentId: updatedBakerySection.parentId
    });

    // 5. Check subcategories
    const subcategories = await Category.find({ 
      parentId: bakerySection._id,
      status: 'show'
    });
    
    console.log(`\n🔍 BAKERY SECTION now has ${subcategories.length} subcategories:`);
    subcategories.forEach(sub => {
      console.log(`  - ${sub.name?.en || 'Unknown'} (${sub._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixBakerySection(); 