const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

async function fixDeliSectionDuplicates() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  try {
    // 1. Find all DELI SECTION categories
    const deliSectionCategories = await Category.find({
      'name.en': 'DELI SECTION',
      status: 'show'
    }).lean();
    
    console.log(`🔍 Found ${deliSectionCategories.length} DELI SECTION categories:`);
    deliSectionCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ID: ${cat._id}, Slug: ${cat.slug}, ParentId: ${cat.parentId}`);
    });

    if (deliSectionCategories.length < 2) {
      console.log('✅ No duplicates to fix');
      return;
    }

    // 2. Identify the working DELI SECTION (the one with subcategories and products)
    const workingDeliSection = deliSectionCategories.find(cat => 
      cat.parentId && cat.parentId !== 'null' && cat.parentId !== null
    );
    
    const emptyDeliSection = deliSectionCategories.find(cat => 
      !cat.parentId || cat.parentId === 'null' || cat.parentId === null
    );

    if (!workingDeliSection || !emptyDeliSection) {
      console.log('❌ Could not identify working vs empty DELI SECTION');
      return;
    }

    console.log('\n🔍 Working DELI SECTION:', {
      id: workingDeliSection._id,
      slug: workingDeliSection.slug,
      parentId: workingDeliSection.parentId,
      icon: workingDeliSection.icon ? 'Yes' : 'No',
      headerImage: workingDeliSection.headerImage ? 'Yes' : 'No'
    });

    console.log('🔍 Empty DELI SECTION:', {
      id: emptyDeliSection._id,
      slug: emptyDeliSection.slug,
      parentId: emptyDeliSection.parentId,
      icon: emptyDeliSection.icon ? 'Yes' : 'No',
      headerImage: emptyDeliSection.headerImage ? 'Yes' : 'No'
    });

    // 3. Update the working DELI SECTION to be a main category (parentId: null)
    // This will make it appear on the homepage
    const workingCategory = await Category.findById(workingDeliSection._id);
    workingCategory.parentId = null;
    workingCategory.slug = 'deli-section'; // Use the better slug
    await workingCategory.save();
    
    console.log('✅ Updated working DELI SECTION to be a main category');

    // 4. Delete the empty DELI SECTION
    await Category.findByIdAndDelete(emptyDeliSection._id);
    console.log('✅ Deleted empty DELI SECTION');

    // 5. Verify the fix
    const updatedDeliSection = await Category.findById(workingDeliSection._id);
    console.log('\n🔍 Updated DELI SECTION:', {
      id: updatedDeliSection._id,
      name: updatedDeliSection.name,
      slug: updatedDeliSection.slug,
      parentId: updatedDeliSection.parentId,
      icon: updatedDeliSection.icon ? 'Yes' : 'No',
      headerImage: updatedDeliSection.headerImage ? 'Yes' : 'No'
    });

    // 6. Check subcategories
    const subcategories = await Category.find({ 
      parentId: updatedDeliSection._id,
      status: 'show'
    });
    
    console.log(`\n🔍 DELI SECTION now has ${subcategories.length} subcategories:`);
    subcategories.forEach(sub => {
      console.log(`  - ${sub.name?.en || 'Unknown'} (${sub._id})`);
    });

    // 7. Check products
    const subcategoryIds = subcategories.map(sub => sub._id);
    const products = await Product.find({
      $or: [
        { category: { $in: subcategoryIds } },
        { categories: { $in: subcategoryIds } }
      ],
      status: 'show',
      stock: { $gt: 0 }
    }).lean();
    
    console.log(`\n🔍 DELI SECTION has ${products.length} products in subcategories`);

    // 8. Check main categories for homepage
    const mainCategories = await Category.find({
      $or: [
        { parentId: null },
        { parentId: { $exists: false } },
        { parentId: '' }
      ],
      status: 'show'
    }).select('name slug parentId icon').lean();
    
    console.log(`\n🔍 Main categories (for homepage) - ${mainCategories.length} total:`);
    mainCategories.forEach(cat => {
      console.log(`  - ${cat.name?.en || 'Unknown'} (${cat._id})`);
      console.log(`    Slug: ${cat.slug}`);
      console.log(`    Icon: ${cat.icon ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixDeliSectionDuplicates(); 